import { boolean, date, integer, jsonb, pgTable, text, timestamp, uniqueIndex, varchar, index } from "drizzle-orm/pg-core";

export const users = pgTable(
    "ticket_bot_users",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        tg_id: varchar("tg_id", { length: 255 }),
        first_name: text("first_name"),
        last_name: text("last_name"),
        username: text("username"),
        status: text("status", { enum: ["new", "active", "has_blocked", "deleted_account", "other"] })
            .default("new")
            .notNull(),
        utm: text("utm"),
        created_at: timestamp("created_at").defaultNow().notNull(),
        updated_at: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [uniqueIndex("ticket_bot_users_tg_id_unique").on(table.tg_id)],
);

export const chats = pgTable(
    "ticket_bot_chats",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        tg_chat_id: varchar("tg_chat_id", { length: 255 }),
        type: text("type", { enum: ["private", "group", "supergroup"] }).notNull(),
        title: text("title"),
        language: integer("language"),
        frequency: integer("frequency").default(6).notNull(),
        premium_until: timestamp("premium_until"),
        status: text("status", { enum: ["active", "inactive", "kicked", "left"] })
            .default("active")
            .notNull(),
        added_by_tg_id: varchar("added_by_tg_id", { length: 255 }),
        created_at: timestamp("created_at").defaultNow().notNull(),
        updated_at: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [uniqueIndex("ticket_bot_chats_tg_chat_id_unique").on(table.tg_chat_id)],
);

export const premiumRequests = pgTable(
    "ticket_bot_premium_requests",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        chat_id: integer("chat_id")
            .notNull()
            .references(() => chats.id),
        requested_by_tg_id: varchar("requested_by_tg_id", { length: 255 }).notNull(),
        plan: text("plan", { enum: ["private", "group"] }).notNull(),
        price: integer("price").notNull(),
        status: text("status", { enum: ["pending", "approved", "rejected"] })
            .default("pending")
            .notNull(),
        admin_message_id: integer("admin_message_id"),
        created_at: timestamp("created_at").defaultNow().notNull(),
        resolved_at: timestamp("resolved_at"),
    },
    (table) => [index("ticket_bot_premium_requests_chat_id_idx").on(table.chat_id)],
);

export const trainStations = pgTable(
    "ticket_bot_train_stations",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        code: varchar("code", { length: 32 }).notNull(),
        name_latin: text("name_latin").notNull(),
        name_cyrillic: text("name_cyrillic").notNull(),
        region_code: varchar("region_code", { length: 32 }),
        region_latin: text("region_latin"),
        region_cyrillic: text("region_cyrillic"),
        is_active: boolean("is_active").default(true).notNull(),
        sort_order: integer("sort_order").default(0).notNull(),
    },
    (table) => [uniqueIndex("ticket_bot_train_stations_code_unique").on(table.code)],
);

export const busStations = pgTable(
    "ticket_bot_bus_stations",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        external_id: varchar("external_id", { length: 64 }).notNull(),
        name_latin: text("name_latin").notNull(),
        name_cyrillic: text("name_cyrillic").notNull(),
        region_code: varchar("region_code", { length: 32 }),
        region_latin: text("region_latin"),
        region_cyrillic: text("region_cyrillic"),
        is_active: boolean("is_active").default(true).notNull(),
        sort_order: integer("sort_order").default(0).notNull(),
    },
    (table) => [uniqueIndex("ticket_bot_bus_stations_external_id_unique").on(table.external_id)],
);

export const routes = pgTable(
    "ticket_bot_routes",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        chat_id: integer("chat_id")
            .notNull()
            .references(() => chats.id),
        transport: text("transport", { enum: ["train", "bus"] }).notNull(),
        travel_date: date("travel_date", { mode: "string" }).notNull(),
        from_code: varchar("from_code", { length: 64 }).notNull(),
        to_code: varchar("to_code", { length: 64 }).notNull(),
        from_name_latin: text("from_name_latin").notNull(),
        from_name_cyrillic: text("from_name_cyrillic").notNull(),
        to_name_latin: text("to_name_latin").notNull(),
        to_name_cyrillic: text("to_name_cyrillic").notNull(),
        is_active: boolean("is_active").default(true).notNull(),
        created_at: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("ticket_bot_routes_unique").on(table.chat_id, table.transport, table.travel_date, table.from_code, table.to_code),
        index("ticket_bot_routes_active_idx").on(table.is_active, table.travel_date),
    ],
);

export const routeWizards = pgTable(
    "ticket_bot_route_wizards",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        chat_id: integer("chat_id")
            .notNull()
            .references(() => chats.id),
        step: text("step").notNull(),
        transport: text("transport", { enum: ["train", "bus"] }),
        travel_date: date("travel_date", { mode: "string" }),
        from_code: varchar("from_code", { length: 64 }),
        to_code: varchar("to_code", { length: 64 }),
        from_name_latin: text("from_name_latin"),
        from_name_cyrillic: text("from_name_cyrillic"),
        to_name_latin: text("to_name_latin"),
        to_name_cyrillic: text("to_name_cyrillic"),
        region_code: varchar("region_code", { length: 32 }),
        page: integer("page").default(0).notNull(),
        updated_at: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [uniqueIndex("ticket_bot_route_wizards_chat_id_unique").on(table.chat_id)],
);

export const ticketSnapshots = pgTable(
    "ticket_bot_ticket_snapshots",
    {
        id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
        transport: text("transport", { enum: ["train", "bus"] }).notNull(),
        travel_date: date("travel_date", { mode: "string" }).notNull(),
        from_code: varchar("from_code", { length: 64 }).notNull(),
        to_code: varchar("to_code", { length: 64 }).notNull(),
        payload: jsonb("payload"),
        has_tickets: boolean("has_tickets").default(false).notNull(),
        updated_at: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [uniqueIndex("ticket_bot_ticket_snapshots_unique").on(table.transport, table.travel_date, table.from_code, table.to_code)],
);
