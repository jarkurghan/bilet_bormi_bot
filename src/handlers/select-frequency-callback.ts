import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang, requirePremium } from "../services/flow";
import { MESSAGES } from "../services/messages";
import { frequencyKeyboard, settingsKeyboard } from "../services/make-keyboard";
import { saveChat } from "../services/save-chat";
import { loadFlow } from "../services/flow";

export async function registerFrequencyMenuCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.SELECT_FREQ[flow.lang], frequencyKeyboard(flow.lang));
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Chastota menyusida", error, ctx });
    }
}

export async function registerFrequencySelectCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const raw = ctx.callbackQuery?.data || "";
        const frequency = Number(raw.split("_")[1]);
        if (![1, 3, 6].includes(frequency)) return;

        await saveChat(ctx, { frequency });
        const updated = await loadFlow(ctx);
        if (!updated) return;

        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.FREQ_SET[updated.lang] + "\n\n" + MESSAGES.SETTINGS(updated.chat), settingsKeyboard(updated.lang, updated.isPremium));
        if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: MESSAGES.FREQ_SET[updated.lang] });
    } catch (error) {
        await sendErrorLog({ event: "Chastota tanlashda", error, ctx });
    }
}
