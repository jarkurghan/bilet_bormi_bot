import { InlineKeyboard, Keyboard } from "grammy";
import { ParseMode } from "@grammyjs/types/message";
import { BTN } from "./messages";
import { Region, Station } from "../utils/types";
import { compactDate, daysInMonth, regionName, shiftMonth, stationName, weekdayIndex } from "../utils/date";
import { STATIONS_PER_PAGE } from "../utils/constants";

export function makeDashboardReplyKeyboard(lang: number, isPremium: boolean) {
    const keyboard = new Keyboard();
    if (isPremium) {
        keyboard.text(BTN.ROUTES[lang as 1 | 2]).text(BTN.ADD_ROUTE[lang as 1 | 2]).row();
    }
    keyboard.text(BTN.SETTINGS[lang as 1 | 2]).text(BTN.PREMIUM[lang as 1 | 2]).row();
    return keyboard.resized();
}

export function langKeyboard(showBack?: boolean, lang?: number) {
    const marks = new InlineKeyboard().text("🇺🇿 Oʻzbekcha", "lang_2").text("🇺🇿 Ўзбекча", "lang_1").row();
    if (showBack && lang) marks.text(BTN.BACK[lang as 1 | 2], "settings").row();
    return { reply_markup: marks, parse_mode: "HTML" as ParseMode };
}

export function premiumKeyboard(lang: number, isPremium: boolean) {
    const keyboard = new InlineKeyboard();
    if (!isPremium) keyboard.text(BTN.CONNECT[lang as 1 | 2], "prem_req").row();
    keyboard.text(BTN.BACK[lang as 1 | 2], "dashboard").row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function premiumWarnKeyboard(lang: number) {
    const keyboard = new InlineKeyboard()
        .text(BTN.CONFIRM[lang as 1 | 2], "prem_req_ok")
        .text(BTN.CANCEL[lang as 1 | 2], "premium")
        .row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function adminPremiumKeyboard(requestId: number) {
    return new InlineKeyboard().text("✅ Tasdiqlash", `prem_ok_${requestId}`).text("❌ Rad etish", `prem_no_${requestId}`);
}

export function settingsKeyboard(lang: number, isPremium: boolean) {
    const keyboard = new InlineKeyboard();
    keyboard.text(BTN.LANG[lang as 1 | 2], "language").row();
    if (isPremium) keyboard.text(BTN.FREQ[lang as 1 | 2], "freq").row();
    keyboard.text(BTN.DONE[lang as 1 | 2], "dashboard").row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function frequencyKeyboard(lang: number) {
    const keyboard = new InlineKeyboard()
        .text(lang === 2 ? "Soatiga 6 marta" : "Соатига 6 марта", "freq_6")
        .row()
        .text(lang === 2 ? "Soatiga 3 marta" : "Соатига 3 марта", "freq_3")
        .row()
        .text(lang === 2 ? "Soatiga 1 marta" : "Соатига 1 марта", "freq_1")
        .row()
        .text(BTN.BACK[lang as 1 | 2], "settings")
        .row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function transportKeyboard(lang: number) {
    const keyboard = new InlineKeyboard()
        .text(BTN.TRAIN[lang as 1 | 2], "rt_tr_train")
        .text(BTN.BUS[lang as 1 | 2], "rt_tr_bus")
        .row()
        .text(BTN.CANCEL[lang as 1 | 2], "rt_x")
        .row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

const WEEKDAYS_LATIN = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const WEEKDAYS_CYR = ["Ду", "Се", "Чо", "Па", "Жу", "Ша", "Як"];
const MONTHS_LATIN = ["", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const MONTHS_CYR = ["", "Январ", "Феврал", "Март", "Апрел", "Май", "Июн", "Июл", "Август", "Сентябр", "Октябр", "Ноябр", "Декабр"];

export function calendarKeyboard(lang: number, year: number, month: number, todayISO: string) {
    const keyboard = new InlineKeyboard();
    const months = lang === 2 ? MONTHS_LATIN : MONTHS_CYR;
    const weekdays = lang === 2 ? WEEKDAYS_LATIN : WEEKDAYS_CYR;
    const title = `${months[month]} ${year}`;
    const prev = shiftMonth(year, month, -1);
    const next = shiftMonth(year, month, 1);

    keyboard.text("‹", `rt_m_${prev.year}${String(prev.month).padStart(2, "0")}`).text(title, "rt_noop").text("›", `rt_m_${next.year}${String(next.month).padStart(2, "0")}`).row();

    for (const w of weekdays) keyboard.text(w, "rt_noop");
    keyboard.row();

    const firstWeekday = (weekdayIndex(year, month, 1) + 6) % 7;
    const total = daysInMonth(year, month);
    let col = 0;

    for (let i = 0; i < firstWeekday; i++) {
        keyboard.text(" ", "rt_noop");
        col++;
    }

    for (let day = 1; day <= total; day++) {
        const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (iso < todayISO) {
            keyboard.text("·", "rt_noop");
        } else {
            keyboard.text(String(day), `rt_d_${compactDate(iso)}`);
        }
        col++;
        if (col === 7) {
            keyboard.row();
            col = 0;
        }
    }
    if (col !== 0) keyboard.row();
    keyboard.text(BTN.CANCEL[lang as 1 | 2], "rt_x").row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function regionsKeyboard(lang: number, regions: Region[], backTo: string) {
    const keyboard = new InlineKeyboard();
    for (let i = 0; i < regions.length; i++) {
        keyboard.text(regionName(regions[i], lang), `rt_r_${regions[i].region_code}`);
        if (i % 2 === 1 || i === regions.length - 1) keyboard.row();
    }
    keyboard.text(BTN.BACK[lang as 1 | 2], backTo).text(BTN.CANCEL[lang as 1 | 2], "rt_x").row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function stationsKeyboard(lang: number, stations: Station[], page: number, backTo: string) {
    const keyboard = new InlineKeyboard();
    const start = page * STATIONS_PER_PAGE;
    const slice = stations.slice(start, start + STATIONS_PER_PAGE);

    for (const station of slice) {
        keyboard.text(stationName(station, lang), `rt_s_${station.id}`).row();
    }

    const nav: { text: string; data: string }[] = [];
    if (page > 0) nav.push({ text: "‹", data: `rt_pg_${page - 1}` });
    if (start + STATIONS_PER_PAGE < stations.length) nav.push({ text: "›", data: `rt_pg_${page + 1}` });
    if (nav.length) {
        for (const n of nav) keyboard.text(n.text, n.data);
        keyboard.row();
    }

    keyboard.text(BTN.BACK[lang as 1 | 2], backTo).text(BTN.CANCEL[lang as 1 | 2], "rt_x").row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function confirmRouteKeyboard(lang: number) {
    const keyboard = new InlineKeyboard()
        .text(BTN.CONFIRM[lang as 1 | 2], "rt_ok")
        .text(BTN.CANCEL[lang as 1 | 2], "rt_x")
        .row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function routesListKeyboard(
    lang: number,
    items: { id: number; label: string }[],
) {
    const keyboard = new InlineKeyboard();
    for (const item of items) {
        keyboard.text(item.label, `rt_v_${item.id}`).text("🗑", `rt_del_${item.id}`).row();
    }
    keyboard.text(BTN.ADD_ROUTE[lang as 1 | 2], "rt_add").row();
    keyboard.text(BTN.DONE[lang as 1 | 2], "dashboard").row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}

export function routeViewKeyboard(lang: number, routeId: number) {
    const keyboard = new InlineKeyboard()
        .text(BTN.DELETE[lang as 1 | 2], `rt_del_${routeId}`)
        .row()
        .text(BTN.BACK[lang as 1 | 2], "routes")
        .row();
    return { reply_markup: keyboard, parse_mode: "HTML" as ParseMode };
}
