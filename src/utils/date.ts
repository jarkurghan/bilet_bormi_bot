import { TZ } from "./constants";

export function tashkentParts(date = new Date()) {
    const dtf = new Intl.DateTimeFormat("en-GB", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        date: `${parts.year}-${parts.month}-${parts.day}`,
    };
}

export function todayISO(): string {
    return tashkentParts().date;
}

export function formatDateDisplay(iso: string, lang: number): string {
    const [y, m, d] = iso.split("-");
    return lang === 2 ? `${d}.${m}.${y}` : `${d}.${m}.${y}`;
}

export function formatDateTime(date: Date, lang: number): string {
    const parts = tashkentParts(date);
    const clock = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
    const day = `${String(parts.day).padStart(2, "0")}.${String(parts.month).padStart(2, "0")}.${parts.year}`;
    return lang === 2 ? `${day} ${clock}` : `${day} ${clock}`;
}

export function addDaysISO(iso: string, days: number): string {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dt.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function monthStartISO(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
    const dt = new Date(Date.UTC(year, month - 1 + delta, 1));
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1 };
}

export function daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function weekdayIndex(year: number, month: number, day: number): number {
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function compactDate(iso: string): string {
    return iso.replaceAll("-", "");
}

export function expandDate(compact: string): string {
    return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

export function shouldNotify(frequency: number, minute: number): boolean {
    if (frequency === 6) return minute % 10 === 0;
    if (frequency === 3) return minute === 0 || minute === 20 || minute === 40;
    if (frequency === 1) return minute === 0;
    return false;
}

export function formatSom(amount: number): string {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function isPremiumUntil(premiumUntil: Date | string | null | undefined): boolean {
    if (!premiumUntil) return false;
    return new Date(premiumUntil).getTime() > Date.now();
}

export function extendPremium(current: Date | string | null | undefined, days: number): Date {
    const now = Date.now();
    const currentMs = current ? new Date(current).getTime() : 0;
    const base = currentMs > now ? currentMs : now;
    return new Date(base + days * 24 * 60 * 60 * 1000);
}

export function stationName(station: { name_latin: string; name_cyrillic: string }, lang: number): string {
    return lang === 2 ? station.name_latin : station.name_cyrillic;
}

export function regionName(region: { region_latin: string; region_cyrillic: string }, lang: number): string {
    return lang === 2 ? region.region_latin : region.region_cyrillic;
}
