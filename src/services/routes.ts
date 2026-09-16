import { and, desc, eq } from "drizzle-orm";
import { routes, ticketSnapshots } from "../db/schema";
import { db } from "../db";
import { MAX_ROUTES_PER_CHAT } from "../utils/constants";
import { Transport } from "../utils/types";
import { formatDateDisplay, stationName } from "../utils/date";
import { BTN } from "./messages";

export type RouteRow = typeof routes.$inferSelect;

export async function countActiveRoutes(chatId: number): Promise<number> {
    const rows = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.chat_id, chatId), eq(routes.is_active, true)));
    return rows.length;
}

export async function listActiveRoutes(chatId: number): Promise<RouteRow[]> {
    return db
        .select()
        .from(routes)
        .where(and(eq(routes.chat_id, chatId), eq(routes.is_active, true)))
        .orderBy(desc(routes.created_at));
}

export async function getRoute(id: number, chatId: number): Promise<RouteRow | undefined> {
    const [row] = await db
        .select()
        .from(routes)
        .where(and(eq(routes.id, id), eq(routes.chat_id, chatId)))
        .limit(1);
    return row;
}

export async function createRoute(data: {
    chat_id: number;
    transport: Transport;
    travel_date: string;
    from_code: string;
    to_code: string;
    from_name_latin: string;
    from_name_cyrillic: string;
    to_name_latin: string;
    to_name_cyrillic: string;
}): Promise<{ route?: RouteRow; error?: "limit" | "exists" }> {
    const [existing] = await db
        .select()
        .from(routes)
        .where(
            and(
                eq(routes.chat_id, data.chat_id),
                eq(routes.transport, data.transport),
                eq(routes.travel_date, data.travel_date),
                eq(routes.from_code, data.from_code),
                eq(routes.to_code, data.to_code),
            ),
        )
        .limit(1);

    if (existing?.is_active) return { error: "exists" };

    const count = await countActiveRoutes(data.chat_id);
    if (count >= MAX_ROUTES_PER_CHAT) return { error: "limit" };

    if (existing && !existing.is_active) {
        const [route] = await db.update(routes).set({ is_active: true }).where(eq(routes.id, existing.id)).returning();
        return { route };
    }

    const [route] = await db.insert(routes).values(data).returning();
    return { route };
}

export async function deactivateRoute(id: number, chatId: number): Promise<RouteRow | undefined> {
    const [row] = await db
        .update(routes)
        .set({ is_active: false })
        .where(and(eq(routes.id, id), eq(routes.chat_id, chatId)))
        .returning();
    return row;
}

export function routeLabel(route: RouteRow, lang: number): string {
    const t = route.transport === "train" ? (lang === 2 ? "🚂" : "🚂") : "🚌";
    const from = lang === 2 ? route.from_name_latin : route.from_name_cyrillic;
    const to = lang === 2 ? route.to_name_latin : route.to_name_cyrillic;
    return `${t} ${formatDateDisplay(route.travel_date, lang)} ${from} → ${to}`;
}

export async function getSnapshot(transport: Transport, travelDate: string, fromCode: string, toCode: string) {
    const [row] = await db
        .select()
        .from(ticketSnapshots)
        .where(
            and(
                eq(ticketSnapshots.transport, transport),
                eq(ticketSnapshots.travel_date, travelDate),
                eq(ticketSnapshots.from_code, fromCode),
                eq(ticketSnapshots.to_code, toCode),
            ),
        )
        .limit(1);
    return row;
}

export function routeHeader(route: RouteRow, lang: number): string {
    const transport = route.transport === "train" ? BTN.TRAIN[lang as 1 | 2] : BTN.BUS[lang as 1 | 2];
    const from = stationName({ name_latin: route.from_name_latin, name_cyrillic: route.from_name_cyrillic }, lang);
    const to = stationName({ name_latin: route.to_name_latin, name_cyrillic: route.to_name_cyrillic }, lang);
    return `${transport}\n📅 ${formatDateDisplay(route.travel_date, lang)}\n${from} → ${to}`;
}
