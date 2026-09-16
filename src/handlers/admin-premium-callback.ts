import { CallbackQueryContext, Context } from "grammy";
import { sendErrorLog } from "../services/log";
import { markAdminRequestResolved, resolvePremiumRequest } from "../services/premium";
import { bot } from "../bot";
import { MESSAGES, langOf } from "../services/messages";
import { makeDashboardReplyKeyboard } from "../services/make-keyboard";
import { chatIsPremium } from "../services/premium";

export async function registerAdminPremiumCallback(ctx: CallbackQueryContext<Context>) {
    try {
        const data = ctx.callbackQuery.data;
        const action = data.startsWith("prem_ok_") ? "approved" : "rejected";
        const id = Number(data.replace("prem_ok_", "").replace("prem_no_", ""));
        if (!id) {
            await ctx.answerCallbackQuery({ text: "So'rov topilmadi" });
            return;
        }

        const result = await resolvePremiumRequest(id, action);
        if (!result) {
            await ctx.answerCallbackQuery({ text: "So'rov topilmadi" });
            return;
        }

        if (result.already) {
            await ctx.answerCallbackQuery({ text: "Bu so'rov allaqachon ko'rilgan" });
            return;
        }

        await markAdminRequestResolved(id, action);

        const chat = result.chat;
        if (chat?.tg_chat_id) {
            const lang = langOf(chat);
            const text = action === "approved" ? MESSAGES.PREMIUM_APPROVED[lang] : MESSAGES.PREMIUM_REJECTED[lang];
            const isPremium = action === "approved" || chatIsPremium(chat);
            await bot.api.sendMessage(chat.tg_chat_id, text, {
                parse_mode: "HTML",
                reply_markup: makeDashboardReplyKeyboard(lang, isPremium),
            });
            if (action === "approved") {
                await bot.api.sendMessage(chat.tg_chat_id, MESSAGES.DASHBOARD({ ...chat, language: chat.language }), {
                    parse_mode: "HTML",
                    reply_markup: makeDashboardReplyKeyboard(lang, true),
                });
            }
        }

        await ctx.answerCallbackQuery({ text: action === "approved" ? "Tasdiqlandi" : "Rad etildi" });
    } catch (error) {
        await sendErrorLog({ event: "Admin premium tasdiqlashda", error, ctx });
    }
}
