import { CTX } from "../utils/types";
import { sendErrorLog, sendLog } from "../services/log";
import { requireLang, requirePremium, showDashboard } from "../services/flow";
import { clearWizard, getWizard, wizardTransport } from "../services/wizard";
import { createRoute } from "../services/routes";
import { MESSAGES } from "../services/messages";
import { Transport } from "../utils/types";
import { userLink } from "../services/save-user";
import { ADMIN_CHAT } from "../utils/constants";
import { bot } from "../bot";

export async function registerConfirmRouteCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;

        const wizard = await getWizard(flow.chat.id);
        const transport = wizardTransport(wizard) as Transport | null;
        if (!wizard || !transport || !wizard.travel_date || !wizard.from_code || !wizard.to_code) {
            if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "Ma'lumot to'liq emas" });
            return;
        }

        const result = await createRoute({
            chat_id: flow.chat.id,
            transport,
            travel_date: wizard.travel_date,
            from_code: wizard.from_code,
            to_code: wizard.to_code,
            from_name_latin: wizard.from_name_latin || wizard.from_code,
            from_name_cyrillic: wizard.from_name_cyrillic || wizard.from_code,
            to_name_latin: wizard.to_name_latin || wizard.to_code,
            to_name_cyrillic: wizard.to_name_cyrillic || wizard.to_code,
        });

        await clearWizard(flow.chat.id);
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);

        if (result.error === "limit") {
            await ctx.reply(MESSAGES.ROUTE_LIMIT[flow.lang]);
        } else if (result.error === "exists") {
            await ctx.reply(MESSAGES.ROUTE_EXISTS[flow.lang]);
        } else {
            await ctx.reply(MESSAGES.ROUTE_ADDED[flow.lang]);
        }

        const user = userLink({
            tg_id: String(flow.user.tg_id),
            first_name: flow.user.first_name,
            last_name: flow.user.last_name,
            username: flow.user.username,
        });
        const msg =
            `🆕 Yangi yo'nalish:\n\n👤 Ism: ${user}\n🆔 ID: <code>${flow.user.tg_id}</code>\n🤖 Bot: @${bot.botInfo.username}\n\n` +
            `${result.route?.transport === "train" ? "🚂" : "🚌"} Yo'nalish: ${result.route?.from_name_latin} → ${result.route?.to_name_latin}\n` +
            `📅 Sana: ${result.route?.travel_date}`;
        await bot.api.sendMessage(ADMIN_CHAT, msg, { parse_mode: "HTML" });

        await showDashboard(ctx, flow, false);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Yo'nalishni tasdiqlashda", error, ctx });
    }
}
