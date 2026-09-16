import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang, requirePremium, showDashboard } from "../services/flow";

export async function registerDashboardCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!flow.isPremium) {
            await requirePremium(ctx, flow);
            return;
        }
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
        await showDashboard(ctx, flow);
    } catch (error) {
        await sendErrorLog({ event: "Dashboard ochishda", error, ctx });
    }
}
