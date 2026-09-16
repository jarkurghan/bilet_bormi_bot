import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang, requirePremium } from "../services/flow";
import { getWizard, upsertWizard } from "../services/wizard";
import { renderWizard } from "../services/wizard-ui";
import { calendarKeyboard } from "../services/make-keyboard";
import { MESSAGES } from "../services/messages";
import { expandDate, todayISO, tashkentParts } from "../utils/date";

export async function registerCalendarMonthCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const raw = (ctx.callbackQuery?.data || "").replace("rt_m_", "");
        const year = Number(raw.slice(0, 4));
        const month = Number(raw.slice(4, 6));
        if (!year || !month) return;
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await ctx.reply(MESSAGES.SELECT_DATE[flow.lang], calendarKeyboard(flow.lang, year, month, todayISO()));
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Kalendar oyini o'zgartirishda", error, ctx });
    }
}

export async function registerCalendarDateCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const compact = (ctx.callbackQuery?.data || "").replace("rt_d_", "");
        const date = expandDate(compact);
        if (date < todayISO()) {
            if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: flow.lang === 2 ? "O'tgan sana" : "Ўтган сана" });
            return;
        }
        await upsertWizard(flow.chat.id, { step: "from_region", travel_date: date, page: 0, region_code: null });
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await renderWizard(ctx, flow);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Sana tanlashda", error, ctx });
    }
}

export async function registerWizardBackCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        const data = ctx.callbackQuery?.data || "";
        const wizard = await getWizard(flow.chat.id);
        if (!wizard) {
            await upsertWizard(flow.chat.id, { step: "type" });
        } else if (data === "rt_back_date") {
            const parts = tashkentParts();
            await upsertWizard(flow.chat.id, { step: "date", travel_date: wizard.travel_date || `${parts.year}-${String(parts.month).padStart(2, "0")}-01` });
        } else if (data === "rt_back_from_reg") {
            await upsertWizard(flow.chat.id, { step: "from_region", page: 0, region_code: null });
        } else if (data === "rt_back_from") {
            await upsertWizard(flow.chat.id, { step: "from_region", page: 0, region_code: null });
        } else if (data === "rt_back_to_reg") {
            await upsertWizard(flow.chat.id, { step: "to_region", page: 0, region_code: null });
        }
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await renderWizard(ctx, flow);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Wizard orqaga qaytishda", error, ctx });
    }
}
