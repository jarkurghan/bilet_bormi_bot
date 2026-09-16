import { CTX } from "../utils/types";
import { Flow } from "./flow";
import { MESSAGES } from "./messages";
import {
    calendarKeyboard,
    confirmRouteKeyboard,
    regionsKeyboard,
    stationsKeyboard,
    transportKeyboard,
} from "./make-keyboard";
import { getWizard, wizardTransport } from "./wizard";
import { listRegions, listStations } from "./stations";
import { stationName } from "../utils/date";
import { tashkentParts, todayISO } from "../utils/date";

export async function renderWizard(ctx: CTX, flow: Flow) {
    const wizard = await getWizard(flow.chat.id);
    const lang = flow.lang;
    const step = wizard?.step || "type";

    if (step === "type") {
        await ctx.reply(MESSAGES.SELECT_TRANSPORT[lang], transportKeyboard(lang));
        return;
    }

    if (step === "date") {
        const parts = tashkentParts();
        let year = parts.year;
        let month = parts.month;
        if (wizard?.travel_date) {
            year = Number(wizard.travel_date.slice(0, 4));
            month = Number(wizard.travel_date.slice(5, 7));
        }
        await ctx.reply(MESSAGES.SELECT_DATE[lang], calendarKeyboard(lang, year, month, todayISO()));
        return;
    }

    const transport = wizardTransport(wizard);
    if (!transport) {
        await ctx.reply(MESSAGES.SELECT_TRANSPORT[lang], transportKeyboard(lang));
        return;
    }

    if (step === "from_region" || step === "to_region") {
        const regions = await listRegions(transport);
        if (!regions.length) {
            await ctx.reply(MESSAGES.NO_STATIONS[lang], transportKeyboard(lang));
            return;
        }
        const text = step === "from_region" ? MESSAGES.SELECT_FROM_REGION[lang] : MESSAGES.SELECT_TO_REGION[lang];
        const back = step === "from_region" ? "rt_back_date" : "rt_back_from";
        await ctx.reply(text, regionsKeyboard(lang, regions, back));
        return;
    }

    if (step === "from" || step === "to") {
        const stations = await listStations(transport, wizard?.region_code);
        if (!stations.length) {
            await ctx.reply(MESSAGES.NO_STATIONS[lang]);
            return;
        }
        const text = step === "from" ? MESSAGES.SELECT_FROM[lang] : MESSAGES.SELECT_TO[lang];
        const back = step === "from" ? "rt_back_from_reg" : "rt_back_to_reg";
        await ctx.reply(text, stationsKeyboard(lang, stations, wizard?.page || 0, back));
        return;
    }

    if (step === "confirm" && wizard?.travel_date && wizard.from_code && wizard.to_code) {
        const from = stationName(
            { name_latin: wizard.from_name_latin || "", name_cyrillic: wizard.from_name_cyrillic || "" },
            lang,
        );
        const to = stationName({ name_latin: wizard.to_name_latin || "", name_cyrillic: wizard.to_name_cyrillic || "" }, lang);
        await ctx.reply(
            MESSAGES.ROUTE_CONFIRM({
                lang,
                transport,
                date: wizard.travel_date,
                from,
                to,
            }),
            confirmRouteKeyboard(lang),
        );
    }
}
