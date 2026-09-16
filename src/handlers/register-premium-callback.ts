import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang } from "../services/flow";
import { MESSAGES } from "../services/messages";
import { premiumKeyboard, premiumWarnKeyboard } from "../services/make-keyboard";
import { createPremiumRequest, sendPremiumRequestToAdmin } from "../services/premium";

export async function registerPremiumCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.PREMIUM_PAGE[flow.lang], premiumKeyboard(flow.lang, flow.isPremium));
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Premium sahifasida", error, ctx });
    }
}

export async function registerPremiumRequestCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (flow.isPremium) {
            if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: flow.lang === 2 ? "Premium allaqachon faol" : "Премиум аллақачон фаол" });
            await ctx.reply(MESSAGES.PREMIUM_PAGE[flow.lang], premiumKeyboard(flow.lang, true));
            return;
        }
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.PREMIUM_WARN[flow.lang], premiumWarnKeyboard(flow.lang));
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Premium so'rov ogohlantirishida", error, ctx });
    }
}

export async function registerPremiumRequestConfirmCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow || !ctx.from) return;

        const { request, created } = await createPremiumRequest(flow.chat, ctx.from.id);
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);

        if (!created) {
            await ctx.reply(MESSAGES.PREMIUM_PENDING[flow.lang]);
            if (ctx.callbackQuery) await ctx.answerCallbackQuery();
            return;
        }

        await sendPremiumRequestToAdmin({
            chat: flow.chat,
            requestId: request.id,
            from: {
                id: ctx.from.id,
                first_name: ctx.from.first_name,
                last_name: ctx.from.last_name,
                username: ctx.from.username,
            },
        });

        await ctx.reply(MESSAGES.PREMIUM_SENT[flow.lang]);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Premium so'rov yuborishda", error, ctx });
    }
}
