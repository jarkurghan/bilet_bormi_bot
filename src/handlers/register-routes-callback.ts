import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang, requirePremium } from "../services/flow";
import { listActiveRoutes, routeLabel } from "../services/routes";
import { MESSAGES } from "../services/messages";
import { routesListKeyboard } from "../services/make-keyboard";

export async function registerRoutesCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;

        const items = await listActiveRoutes(flow.chat.id);
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);

        if (!items.length) {
            await ctx.reply(MESSAGES.ROUTES_EMPTY[flow.lang], routesListKeyboard(flow.lang, []));
        } else {
            await ctx.reply(
                MESSAGES.ROUTES_LIST[flow.lang],
                routesListKeyboard(
                    flow.lang,
                    items.map((route) => ({ id: route.id, label: routeLabel(route, flow.lang) })),
                ),
            );
        }

        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Yo'nalishlar ro'yxatida", error, ctx });
    }
}
