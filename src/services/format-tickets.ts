import { ChatRow } from "../utils/types";
import { formatDateTime } from "../utils/date";
import { MESSAGES } from "./messages";
import { RouteRow, routeHeader } from "./routes";
import { extractTrains } from "./train-api";
import { extractTrips, tripFreeSeats } from "./bus-api";

function escapeHtml(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function langText(map: { 1: string; 2: string }, lang: number): string {
    return lang === 2 ? map[2] : map[1];
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = obj[key];
        if (typeof value === "string" && value.trim()) return value;
        if (typeof value === "number") return String(value);
    }
    return "";
}

function formatPrice(value: unknown): string {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "";
    return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
}

function formatTrainSnapshot(payload: unknown, lang: number): string {
    const trains = extractTrains(payload);
    if (!trains.length) return langText(MESSAGES.NO_TICKETS, lang);

    const lines: string[] = [];
    for (const train of trains) {
        const number = pickString(train, ["number", "trainNumber", "train_number"]);
        const type = pickString(train, ["type", "trainType", "brand"]);
        const dep = pickString(train, ["departureDate", "departure_date", "depTime", "departureTime"]);
        const arr = pickString(train, ["arrivalDate", "arrival_date", "arrTime", "arrivalTime"]);
        const title = [number, type].filter(Boolean).join(" · ") || (lang === 2 ? "Poyezd" : "Поезд");
        lines.push(`🚂 <b>${escapeHtml(title)}</b>`);
        if (dep || arr) lines.push(`⏰ ${escapeHtml([dep, arr].filter(Boolean).join(" → "))}`);

        const cars = Array.isArray(train.cars) ? (train.cars as Record<string, unknown>[]) : [];
        if (cars.length) {
            for (const car of cars) {
                const carType = pickString(car, ["type", "carType", "name"]);
                const free = Number(car.freeSeats ?? car.free_seats ?? 0);
                const tariffs = Array.isArray(car.tariffs) ? (car.tariffs as Record<string, unknown>[]) : [];
                const price = tariffs.length ? formatPrice(tariffs[0].tariff ?? tariffs[0].price) : formatPrice(car.tariff ?? car.price);
                const bits = [carType, free > 0 ? `${free} ${lang === 2 ? "joy" : "жой"}` : lang === 2 ? "joy yo'q" : "жой йўқ", price].filter(Boolean);
                lines.push(`• ${escapeHtml(bits.join(" · "))}`);
            }
        } else {
            const free = Number(train.freeSeats ?? train.free_seats ?? 0);
            lines.push(free > 0 ? `• ${free} ${lang === 2 ? "joy" : "жой"}` : `• ${langText(MESSAGES.NO_TICKETS, lang)}`);
        }
        lines.push("");
    }

    const text = lines.join("\n").trim();
    return text || langText(MESSAGES.NO_TICKETS, lang);
}

function formatBusSnapshot(payload: unknown, lang: number): string {
    const trips = extractTrips(payload);
    if (!trips.length) return langText(MESSAGES.NO_TICKETS, lang);

    const lines: string[] = [];
    for (const trip of trips) {
        const name = pickString(trip, ["name", "route", "title", "number"]);
        const dep = pickString(trip, ["departure_at", "departureAt", "depTime", "time", "from_time"]);
        const arr = pickString(trip, ["arrive_at", "arriveAt", "arrTime", "to_time"]);
        const free = tripFreeSeats(trip);
        const price = formatPrice(trip.price ?? trip.tariff ?? trip.cost);
        const title = name || (lang === 2 ? "Avtobus" : "Автобус");
        lines.push(`🚌 <b>${escapeHtml(title)}</b>`);
        if (dep || arr) lines.push(`⏰ ${escapeHtml([dep, arr].filter(Boolean).join(" → "))}`);
        const bits = [free > 0 ? `${free} ${lang === 2 ? "joy" : "жой"}` : lang === 2 ? "joy yo'q" : "жой йўқ", price].filter(Boolean);
        lines.push(`• ${escapeHtml(bits.join(" · "))}`);
        lines.push("");
    }

    return lines.join("\n").trim() || langText(MESSAGES.NO_TICKETS, lang);
}

export function formatTicketMessage(opts: {
    chat: ChatRow;
    route: RouteRow;
    payload: unknown;
    updatedAt: Date;
}): string {
    const lang = opts.chat.language === 2 ? 2 : 1;
    const header = routeHeader(opts.route, lang);
    const body =
        opts.route.transport === "train" ? formatTrainSnapshot(opts.payload, lang) : formatBusSnapshot(opts.payload, lang);
    const when = `${langText(MESSAGES.UPDATED_AT, lang)}: <code>${formatDateTime(opts.updatedAt, lang)}</code>`;
    return `${header}\n\n${body}\n\n${when}`;
}
