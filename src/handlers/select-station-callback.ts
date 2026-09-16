import { CTX } from "../utils/types";
import { sendErrorLog } from "../services/log";
import { requireLang, requirePremium } from "../services/flow";
import { getWizard, upsertWizard, wizardTransport } from "../services/wizard";
import { getStationById } from "../services/stations";
import { renderWizard } from "../services/wizard-ui";

export async function registerRegionCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const regionCode = (ctx.callbackQuery?.data || "").replace("rt_r_", "");
        const wizard = await getWizard(flow.chat.id);
        const step = wizard?.step === "to_region" ? "to" : "from";
        await upsertWizard(flow.chat.id, { step, region_code: regionCode, page: 0 });
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await renderWizard(ctx, flow);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Viloyat tanlashda", error, ctx });
    }
}

export async function registerStationPageCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const page = Number((ctx.callbackQuery?.data || "").replace("rt_pg_", ""));
        await upsertWizard(flow.chat.id, { step: (await getWizard(flow.chat.id))?.step || "from", page: Number.isFinite(page) ? page : 0 });
        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await renderWizard(ctx, flow);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Manzil sahifasida", error, ctx });
    }
}

export async function registerStationCallback(ctx: CTX) {
    try {
        const flow = await requireLang(ctx);
        if (!flow) return;
        if (!(await requirePremium(ctx, flow))) return;
        const wizard = await getWizard(flow.chat.id);
        const transport = wizardTransport(wizard);
        if (!wizard || !transport) return;

        const id = Number((ctx.callbackQuery?.data || "").replace("rt_s_", ""));
        const station = await getStationById(transport, id);
        if (!station) {
            if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: "Manzil topilmadi" });
            return;
        }

        if (wizard.step === "from") {
            await upsertWizard(flow.chat.id, {
                step: "to_region",
                from_code: station.code,
                from_name_latin: station.name_latin,
                from_name_cyrillic: station.name_cyrillic,
                region_code: null,
                page: 0,
            });
        } else {
            await upsertWizard(flow.chat.id, {
                step: "confirm",
                to_code: station.code,
                to_name_latin: station.name_latin,
                to_name_cyrillic: station.name_cyrillic,
                region_code: null,
                page: 0,
            });
        }

        if (ctx.callbackQuery) await ctx.deleteMessage().catch(() => undefined);
        await renderWizard(ctx, flow);
        if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    } catch (error) {
        await sendErrorLog({ event: "Manzil tanlashda", error, ctx });
    }
}
