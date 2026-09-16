import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang, requirePremium } from "../services/flow";
import { clearWizard, upsertWizard } from "../services/wizard";
import { renderWizard } from "../services/wizard-ui";
import { MESSAGES } from "../services/messages";
import { makeDashboardReplyKeyboard } from "../services/make-keyboard";
import { Transport } from "../utils/types";

export async function registerAddRouteCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        await upsertWizard(flow.chat.id, { step: "type", page: 0, region_code: null, transport: null, travel_date: null });
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await renderWizard(ctx, flow);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Yo'nalish qo'shishni boshlashda", error, ctx });
    }
}

export async function registerTransportCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const data = ctx.callbackQuery?.data || "";
        const transport: Transport = data.endsWith("bus") ? "bus" : "train";
        await upsertWizard(flow.chat.id, { step: "date", transport, page: 0, region_code: null });
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await renderWizard(ctx, flow);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Transport tanlashda", error, ctx });
    }
}

export async function registerCancelRouteCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        await clearWizard(flow.chat.id);
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.WIZARD_CANCELLED[flow.lang], { reply_markup: makeDashboardReplyKeyboard(flow.lang, flow.isPremium) });
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Yo'nalish qo'shishni bekor qilishda", error, ctx });
    }
}

export async function registerWizardNoopCallback(ctx: CTX) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery();
}
