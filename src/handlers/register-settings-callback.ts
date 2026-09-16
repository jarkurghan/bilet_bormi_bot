import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang } from "../services/flow";
import { MESSAGES } from "../services/messages";
import { settingsKeyboard } from "../services/make-keyboard";

export async function registerSettingsCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.SETTINGS(flow.chat), settingsKeyboard(flow.lang, flow.isPremium));
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Sozlamalar olishda", error, ctx });
    }
}
