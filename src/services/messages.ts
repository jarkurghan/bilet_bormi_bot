import { ADMIN_USERNAME, PREMIUM_GROUP_PRICE, PREMIUM_PRIVATE_PRICE } from "../utils/constants";
import { ChatRow } from "../utils/types";
import { formatDateDisplay, formatDateTime, formatSom, isPremiumUntil } from "../utils/date";

const adminLink = ADMIN_USERNAME ? `@${ADMIN_USERNAME}` : "admin";

export const BTN = {
    ROUTES: { 2: "🎫 Yo'nalishlar", 1: "🎫 Йўналишлар" },
    ADD_ROUTE: { 2: "➕ Yo'nalish qo'shish", 1: "➕ Йўналиш қўшиш" },
    SETTINGS: { 2: "⚙️ Sozlamalar", 1: "⚙️ Созламалар" },
    PREMIUM: { 2: "⭐ Premium", 1: "⭐ Премиум" },
    BACK: { 2: "Ortga qaytish", 1: "Ортга қайтиш" },
    CANCEL: { 2: "Bekor qilish", 1: "Бекор қилиш" },
    CONFIRM: { 2: "Tasdiqlash", 1: "Тасдиқлаш" },
    CONNECT: { 2: "Premiumga ulanish", 1: "Премиумга уланиш" },
    TRAIN: { 2: "🚂 Poyezd", 1: "🚂 Поезд" },
    BUS: { 2: "🚌 Avtobus", 1: "🚌 Автобус" },
    DELETE: { 2: "O'chirish", 1: "Ўчириш" },
    LANG: { 2: "Tilni o'zgartirish", 1: "Тилни ўзгартириш" },
    FREQ: { 2: "Xabar chastotasini o'zgartirish", 1: "Хабар частотасини ўзгартириш" },
    DONE: { 2: "✅ Tayyor", 1: "✅ Тайёр" },
    PREV: { 2: "‹", 1: "‹" },
    NEXT: { 2: "›", 1: "›" },
};

export const MESSAGES = {
    SELECT_LANG: {
        2: "Iltimos, tilni tanlang!\nИлтимос, тилни танланг:",
        1: "Iltimos, tilni tanlang!\nИлтимос, тилни танланг:",
    },
    PREMIUM_LOCKED: {
        2: "Bu bot faqat premium sotib olganlar uchun amal qiladi.",
        1: "Бу бот фақат премиум сотиб олганлар учун амал қилади.",
    },
    PREMIUM_PAGE: {
        2:
            `⭐ <b>Premium</b>\n\n` +
            `Private chat: <b>${formatSom(PREMIUM_PRIVATE_PRICE)} so'm</b> / oy\n` +
            `Guruh: <b>${formatSom(PREMIUM_GROUP_PRICE)} so'm</b> / oy\n\n` +
            `To'lov admin bilan shaxsiy chatda amalga oshiriladi. Bot to'lovga aralashmaydi.\n` +
            `Admin: ${adminLink}\n\n` +
            `<b>Diqqat:</b> «Premiumga ulanish» tugmasi darhol ulamaydi. So'rov adminga boradi, admin tasdiqlagandan keyin premium yoqiladi.`,
        1:
            `⭐ <b>Премиум</b>\n\n` +
            `Шахсий чат: <b>${formatSom(PREMIUM_PRIVATE_PRICE)} сўм</b> / ой\n` +
            `Гуруҳ: <b>${formatSom(PREMIUM_GROUP_PRICE)} сўм</b> / ой\n\n` +
            `Тўлов админ билан шахсий чатда амалга оширилади. Бот тўловга аралашмайди.\n` +
            `Админ: ${adminLink}\n\n` +
            `<b>Диққат:</b> «Премиумга уланиш» тугмаси дарҳол уламайди. Сўров админга боради, админ тасдиқлагандан кейин премиум ёқилади.`,
    },
    PREMIUM_WARN: {
        2: "Bu tugma sizni darhol premiumga ulamaydi. So'rov adminga yuboriladi, to'lovni admin bilan shaxsiy chatda amalga oshirasiz. Davom etasizmi?",
        1: "Бу тугма сизни дарҳол премиумга уламайди. Сўров админга юборилади, тўловни админ билан шахсий чатда амалга оширасиз. Давом этасизми?",
    },
    PREMIUM_SENT: {
        2: "So'rovingiz adminga yuborildi. Admin tasdiqlagach, bu haqida xabar beramiz.",
        1: "Сўровингиз админга юборилди. Админ тасдиқлагач, бу ҳақда хабар берамиз.",
    },
    PREMIUM_PENDING: {
        2: "Sizda allaqachon kutilayotgan so'rov bor. Admin javobini kuting.",
        1: "Сизда аллақачон кутилаётган сўров бор. Админ жавобини кутинг.",
    },
    PREMIUM_APPROVED: {
        2: "✅ Premium ulandi. Endi yo'nalish qo'shishingiz mumkin.",
        1: "✅ Премиум уланди. Энди йўналиш қўшишингиз мумкин.",
    },
    PREMIUM_REJECTED: {
        2: "❌ Premium so'rovingiz rad etildi. Savollar uchun adminga yozing: " + adminLink,
        1: "❌ Премиум сўровингиз рад этилди. Саволлар учун админга ёзинг: " + adminLink,
    },
    DASHBOARD: (chat: ChatRow) => {
        const lang = chat.language === 2 ? 2 : 1;
        const until = chat.premium_until ? formatDateTime(new Date(chat.premium_until), lang) : "-";
        const freq = chat.frequency || 6;
        if (lang === 2) {
            return (
                `🎫 <b>Bilet bormi</b>\n\n` +
                `Premium: ${isPremiumUntil(chat.premium_until) ? `faol, ${until} gacha` : "yo'q"}\n` +
                `Xabarlar: soatiga ${freq} marta\n\n` +
                `Yo'nalish qo'shing — tanlangan sanada poyezd yoki avtobus chiptalarini tekshiramiz.`
            );
        }
        return (
            `🎫 <b>Билет борми</b>\n\n` +
            `Премиум: ${isPremiumUntil(chat.premium_until) ? `фаол, ${until} гача` : "йўқ"}\n` +
            `Хабарлар: соатига ${freq} марта\n\n` +
            `Йўналиш қўшинг — танланган санада поезд ёки автобус чипталарини текширамиз.`
        );
    },
    SETTINGS: (chat: ChatRow) => {
        const lang = chat.language === 2 ? 2 : 1;
        const freq = chat.frequency || 6;
        if (lang === 2) {
            return `Hozirgi sozlamalar:\n\nTil: 🇺🇿 Oʻzbekcha (lotin)\nXabar chastotasi: soatiga ${freq} marta`;
        }
        return `Ҳозирги созламалар:\n\nТил: 🇺🇿 Ўзбекча (кирилл)\nХабар частотаси: соатига ${freq} марта`;
    },
    SELECT_FREQ: {
        2: "Soatiga necha marta xabar yuborilsin?\nEski ma'lumot yuborilmaydi — faqat API dan yangi olingan natija.",
        1: "Соатига неча марта хабар юборилсин?\nЭски маълумот юборилмайди — фақат API дан янги олинган натижа.",
    },
    FREQ_SET: {
        2: "Xabar chastotasi saqlandi.",
        1: "Хабар частотаси сақланди.",
    },
    SELECT_TRANSPORT: {
        2: "Qaysi transport turini tekshiramiz?",
        1: "Қайси транспорт турини текширамиз?",
    },
    SELECT_DATE: {
        2: "Sanani tanlang",
        1: "Санани танланг",
    },
    SELECT_FROM_REGION: {
        2: "Chiqish viloyatini tanlang",
        1: "Чиқиш вилоятини танланг",
    },
    SELECT_FROM: {
        2: "Chiqish manzilini tanlang",
        1: "Чиқиш манзилини танланг",
    },
    SELECT_TO_REGION: {
        2: "Borish viloyatini tanlang",
        1: "Бориш вилоятини танланг",
    },
    SELECT_TO: {
        2: "Borish manzilini tanlang",
        1: "Бориш манзилини танланг",
    },
    NO_STATIONS: {
        2: "Hozircha manzillar kiritilmagan. Admin DB ga manzil qo'shishi kerak.",
        1: "Ҳозирча манзиллар киритилмаган. Админ DB га манзил қўшиши керак.",
    },
    ROUTE_CONFIRM: (opts: {
        lang: number;
        transport: string;
        date: string;
        from: string;
        to: string;
    }) => {
        const t = opts.transport === "train" ? (opts.lang === 2 ? "Poyezd" : "Поезд") : opts.lang === 2 ? "Avtobus" : "Автобус";
        const d = formatDateDisplay(opts.date, opts.lang);
        if (opts.lang === 2) {
            return `Yo'nalishni tasdiqlang:\n\n${t}\n📅 ${d}\n${opts.from} → ${opts.to}`;
        }
        return `Йўналишни тасдиқланг:\n\n${t}\n📅 ${d}\n${opts.from} → ${opts.to}`;
    },
    ROUTE_ADDED: {
        2: "Yo'nalish qo'shildi. Har 10 daqiqada tekshiramiz va sozlamadagi chastota bo'yicha xabar yuboramiz.",
        1: "Йўналиш қўшилди. Ҳар 10 дақиқада текширамиз ва созламадаги частота бўйича хабар юборамиз.",
    },
    ROUTE_EXISTS: {
        2: "Bu yo'nalish allaqachon qo'shilgan.",
        1: "Бу йўналиш аллақачон қўшилган.",
    },
    ROUTE_LIMIT: {
        2: "Yo'nalishlar limiti to'ldi.",
        1: "Йўналишлар лимити тўлди.",
    },
    ROUTES_EMPTY: {
        2: "Hozircha yo'nalish yo'q. «Yo'nalish qo'shish» orqali qo'shing.",
        1: "Ҳозирча йўналиш йўқ. «Йўналиш қўшиш» орқали қўшинг.",
    },
    ROUTES_LIST: {
        2: "Sizning yo'nalishlaringiz:",
        1: "Сизнинг йўналишларингиз:",
    },
    ROUTE_DELETED: {
        2: "Yo'nalish o'chirildi.",
        1: "Йўналиш ўчирилди.",
    },
    WIZARD_CANCELLED: {
        2: "Yo'nalish qo'shish bekor qilindi.",
        1: "Йўналиш қўшиш бекор қилинди.",
    },
    NO_TICKETS: {
        2: "Hozircha bilet yo'q.",
        1: "Ҳозирча билет йўқ.",
    },
    UPDATED_AT: {
        2: "Ma'lumot vaqti",
        1: "Маълумот вақти",
    },
};

export function langOf(chat: { language?: number | null }): 1 | 2 {
    return chat.language === 2 ? 2 : 1;
}
