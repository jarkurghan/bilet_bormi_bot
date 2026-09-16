import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang, requirePremium } from "../services/flow";
import { deactivateRoute, getRoute, getSnapshot, routeHeader, routeLabel } from "../services/routes";
import { MESSAGES } from "../services/messages";
import { routeViewKeyboard, routesListKeyboard } from "../services/make-keyboard";
import { listActiveRoutes } from "../services/routes";
import { formatTicketMessage } from "../services/format-tickets";

export async function registerDeleteRouteCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const id = Number((ctx.callbackQuery?.data || "").replace("rt_del_", ""));
        await deactivateRoute(id, flow.chat.id);
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        const items = await listActiveRoutes(flow.chat.id);
        await ctx.reply(
            MESSAGES.ROUTE_DELETED[flow.lang] + (items.length ? `\n\n${MESSAGES.ROUTES_LIST[flow.lang]}` : `\n\n${MESSAGES.ROUTES_EMPTY[flow.lang]}`),
            routesListKeyboard(
                flow.lang,
                items.map((route) => ({ id: route.id, label: routeLabel(route, flow.lang) })),
            ),
        );
        if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: MESSAGES.ROUTE_DELETED[flow.lang] });
    } catch (error) {
        await sendErrorLog({ event: "Yo'nalishni o'chirishda", error, ctx });
    }
}

export async function registerViewRouteCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const id = Number((ctx.callbackQuery?.data || "").replace("rt_v_", ""));
        const route = await getRoute(id, flow.chat.id);
        if (!route) {
            if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "Topilmadi" });
            return;
        }

        const snapshot = await getSnapshot(route.transport, route.travel_date, route.from_code, route.to_code);
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);

        const text = snapshot
            ? formatTicketMessage({ chat: flow.chat, route, payload: snapshot.payload, updatedAt: snapshot.updated_at })
            : `${routeHeader(route, flow.lang)}\n\n${flow.lang === 2 ? "Hali tekshirilmagan. Keyingi 10 daqiqada ma'lumot keladi." : "Ҳали текширилмаган. Кейинги 10 дақиқада маълумот келади."}`;

        await ctx.reply(text, routeViewKeyboard(flow.lang, route.id));
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Yo'nalishni ko'rishda", error, ctx });
    }
}
