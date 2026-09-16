import { CallbackQueryContext, Context } from "grammy";
import { sendErrorLog } from "../services/log";
import { loadFlow, showDashboard } from "../services/flow";
import { langKeyboard } from "../services/make-keyboard";
import { MESSAGES } from "../services/messages";
import { saveChat } from "../services/save-chat";
import { makeDashboardReplyKeyboard, premiumKeyboard } from "../services/make-keyboard";

export async function registerLangCallback(ctx: CallbackQueryContext<Context>) {
    try {
        const language = Number(ctx.callbackQuery.data.split("_")[1]);
        await saveChat(ctx, { language });
        const flow = await loadFlow(ctx);
        if (!flow) return;

        await ctx.deleteMessage().catch(() => undefined);
        await ctx.answerCallbackQuery({ text: language === 2 ? "Lotincha tanlandi" : "Кириллча танланди" });

        if (!flow.isPremium) {
            await ctx.reply(MESSAGES.PREMIUM_LOCKED[flow.lang], { reply_markup: makeDashboardReplyKeyboard(flow.lang, false) });
            await ctx.reply(MESSAGES.PREMIUM_PAGE[flow.lang], premiumKeyboard(flow.lang, false));
            return;
        }

        await showDashboard(ctx, flow, false);
    } catch (error) {
        await sendErrorLog({ event: "Til tanlashda", error, ctx });
    }
}

export async function registerLanguageCallback(ctx: CallbackQueryContext<Context>) {
    try {
        const flow = await loadFlow(ctx);
        const lang = flow?.lang;
        await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.SELECT_LANG[1], langKeyboard(Boolean(lang), lang));
        await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Til bo'limini ochishda", error, ctx });
    }
}
