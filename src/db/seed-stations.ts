import { db, sql } from "./index";
import { busStations, trainStations } from "./schema";

type Named = { id?: number; code?: number | string; name_uz?: string; name_ru?: string };
type Station = Named & { location_id?: number; location_code?: number | string };

const TRAIN_STATIONS = [
    {
        code: "2900000",
        name_latin: "Toshkent",
        name_cyrillic: "Тошкент",
        region_code: "toshkent",
        region_latin: "Toshkent shahri",
        region_cyrillic: "Тошкент шаҳри",
        sort_order: 1,
    },
    {
        code: "2900800",
        name_latin: "Buxoro",
        name_cyrillic: "Бухоро",
        region_code: "buxoro",
        region_latin: "Buxoro viloyati",
        region_cyrillic: "Бухоро вилояти",
        sort_order: 2,
    },
];

async function seedTrains() {
    for (const station of TRAIN_STATIONS) {
        await db
            .insert(trainStations)
            .values({ ...station, is_active: true })
            .onConflictDoUpdate({
                target: trainStations.code,
                set: { ...station, is_active: true },
            });
    }
    console.log(`Train stations: ${TRAIN_STATIONS.length}`);
}

async function seedBuses() {
    const res = await fetch("https://wapi.avtoticket.uz/api/locations", {
        headers: {
            Accept: "application/json",
            Origin: "https://avtoticket.uz",
            Referer: "https://avtoticket.uz/",
        },
    });
    if (!res.ok) throw new Error(`Bus locations API ${res.status}`);

    const body = (await res.json()) as {
        data?: {
            locations?: Named[];
            stations?: Station[];
        };
    };

    const locations = new Map<string, Named>();
    for (const loc of body.data?.locations || []) {
        locations.set(String(loc.id), loc);
        if (loc.code != null) locations.set(String(loc.code), loc);
    }

    const stations = body.data?.stations || [];
    if (!stations.length) {
        await db
            .insert(busStations)
            .values([
                {
                    external_id: "1726",
                    name_latin: "Toshkent",
                    name_cyrillic: "Тошкент",
                    region_code: "1726",
                    region_latin: "Toshkent shahri",
                    region_cyrillic: "Тошкент шаҳри",
                    is_active: true,
                    sort_order: 1,
                },
                {
                    external_id: "1710212",
                    name_latin: "Dehqonobod",
                    name_cyrillic: "Деҳқонобод",
                    region_code: "1722",
                    region_latin: "Surxondaryo viloyati",
                    region_cyrillic: "Сурхондарё вилояти",
                    is_active: true,
                    sort_order: 2,
                },
            ])
            .onConflictDoUpdate({
                target: busStations.external_id,
                set: { is_active: true },
            });
        console.log("Bus stations: fallback example pair");
        return;
    }

    let i = 0;
    for (const station of stations) {
        const code = String(station.code ?? station.id ?? "");
        if (!code) continue;
        const region = locations.get(String(station.location_id)) || locations.get(String(station.location_code));
        i += 1;
        const row = {
            external_id: code,
            name_latin: station.name_uz || code,
            name_cyrillic: station.name_ru || station.name_uz || code,
            region_code: station.location_code != null ? String(station.location_code) : region?.code != null ? String(region.code) : null,
            region_latin: region?.name_uz || null,
            region_cyrillic: region?.name_ru || null,
            is_active: true,
            sort_order: code === "1726" ? 1 : code === "1710212" ? 2 : 10 + i,
        };
        await db.insert(busStations).values(row).onConflictDoUpdate({ target: busStations.external_id, set: row });
    }
    console.log(`Bus stations: ${stations.length}`);
}

async function main() {
    await seedTrains();
    await seedBuses();
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end({ timeout: 5 });
    });
