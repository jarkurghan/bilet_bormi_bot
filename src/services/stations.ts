import { and, asc, eq, isNull } from "drizzle-orm";
import { busStations, trainStations } from "../db/schema";
import { db } from "../db";
import { Region, Station, Transport } from "../utils/types";

function mapTrain(row: typeof trainStations.$inferSelect): Station {
    return {
        id: row.id,
        code: row.code,
        name_latin: row.name_latin,
        name_cyrillic: row.name_cyrillic,
        region_code: row.region_code,
        region_latin: row.region_latin,
        region_cyrillic: row.region_cyrillic,
    };
}

function mapBus(row: typeof busStations.$inferSelect): Station {
    return {
        id: row.id,
        code: row.external_id,
        name_latin: row.name_latin,
        name_cyrillic: row.name_cyrillic,
        region_code: row.region_code,
        region_latin: row.region_latin,
        region_cyrillic: row.region_cyrillic,
    };
}

export async function listRegions(transport: Transport): Promise<Region[]> {
    if (transport === "train") {
        const rows = await db.select().from(trainStations).where(eq(trainStations.is_active, true)).orderBy(asc(trainStations.sort_order), asc(trainStations.name_latin));
        return uniqueRegions(rows);
    }
    const rows = await db.select().from(busStations).where(eq(busStations.is_active, true)).orderBy(asc(busStations.sort_order), asc(busStations.name_latin));
    return uniqueRegions(rows);
}

function uniqueRegions(rows: { region_code: string | null; region_latin: string | null; region_cyrillic: string | null }[]): Region[] {
    const map = new Map<string, Region>();
    for (const row of rows) {
        const code = row.region_code || "other";
        if (!map.has(code)) {
            map.set(code, {
                region_code: code,
                region_latin: row.region_latin || "Boshqa",
                region_cyrillic: row.region_cyrillic || "Бошқа",
            });
        }
    }
    return Array.from(map.values());
}

function regionFilter(regionCode: string | null | undefined, column: typeof trainStations.region_code | typeof busStations.region_code) {
    if (!regionCode) return undefined;
    if (regionCode === "other") return isNull(column);
    return eq(column, regionCode);
}

export async function listStations(transport: Transport, regionCode?: string | null): Promise<Station[]> {
    if (transport === "train") {
        const filters = [eq(trainStations.is_active, true)];
        const region = regionFilter(regionCode, trainStations.region_code);
        if (region) filters.push(region);
        const rows = await db
            .select()
            .from(trainStations)
            .where(and(...filters))
            .orderBy(asc(trainStations.sort_order), asc(trainStations.name_latin));
        return rows.map(mapTrain);
    }

    const filters = [eq(busStations.is_active, true)];
    const region = regionFilter(regionCode, busStations.region_code);
    if (region) filters.push(region);
    const rows = await db
        .select()
        .from(busStations)
        .where(and(...filters))
        .orderBy(asc(busStations.sort_order), asc(busStations.name_latin));
    return rows.map(mapBus);
}

export async function getStationById(transport: Transport, id: number): Promise<Station | undefined> {
    if (transport === "train") {
        const [row] = await db.select().from(trainStations).where(eq(trainStations.id, id)).limit(1);
        return row ? mapTrain(row) : undefined;
    }
    const [row] = await db.select().from(busStations).where(eq(busStations.id, id)).limit(1);
    return row ? mapBus(row) : undefined;
}
