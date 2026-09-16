import type { CommandContext, Context } from "grammy";
import { getStartPayload, objPayload, findUtm } from "../services/start-payload";
import { sendErrorLog } from "../services/log";
import { saveUser } from "../services/save-user";
import { requireLang, showDashboard } from "../services/flow";
import { MESSAGES } from "../services/messages";
import { premiumKeyboard, makeDashboardReplyKeyboard } from "../services/make-keyboard";

export async function registerStartCommand(ctx: CommandContext<Context>) {
    try {
        const payload = getStartPayload(ctx);
        const payloadObj = objPayload(payload);
        const utm = findUtm(payloadObj);

        await saveUser(ctx, { utm: utm || undefined });

        const flow = await requireLang(ctx);
        if (!flow) return;

        if (!flow.isPremium) {
            await ctx.reply(MESSAGES.PREMIUM_LOCKED[flow.lang], { reply_markup: makeDashboardReplyKeyboard(flow.lang, false) });
            await ctx.reply(MESSAGES.PREMIUM_PAGE[flow.lang], premiumKeyboard(flow.lang, false));
            return;
        }

        await showDashboard(ctx, flow, false);
    } catch (error) {
        await sendErrorLog({ event: "Start bosganda", error, ctx });
    }
}
