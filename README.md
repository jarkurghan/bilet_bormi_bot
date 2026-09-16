# bilet-bormi-bot

Bot foydalanuvchilarga tanlangan sana va yo'nalish bo'yicha poyezd hamda avtobus chiptalari bor-yo'qligini tekshirib, belgilangan chastotada xabar yuboradi.

## Xususiyatlar

- **Ikki tilli interfeys:** o'zbek lotin va o'zbek kirill.
- **Premium:** private chat (39 000 so'm / oy) va guruh (99 000 so'm / oy). To'lov admin bilan shaxsiy chatda, bot aralashmaydi. Admin so'rovni tasdiqlaydi yoki rad etadi.
- **Yo'nalishlar:** poyezd yoki avtobus, sana, chiqish va borish manzili.
- **Tekshiruv:** har 10 daqiqada (`:00`, `:10`, ...) API dan ma'lumot olinadi va `updated_at` bilan saqlanadi.
- **Notification:** soatiga 6 / 3 / 1 marta. Faqat shu siklda API muvaffaqiyatli olingan ma'lumot yuboriladi.
- **Notification:** yangi foydalanuvchi va yangi guruh haqida adminga xabar (UTM ham).
- **Log:** xatoliklar log chatga yuboriladi.

## Texnologiyalar

- Telegram Bot API
- grammY
- PostgreSQL
- Drizzle ORM
- Hono (webhook)
- Bun

## Ishga tushirish

### Kerak

- bun
- PostgreSQL
- Telegram Bot Token (BotFather)

### Environment

| O'zgaruvchi             | Tavsif                                                           |
| :---------------------- | :--------------------------------------------------------------- |
| `BOT_TOKEN`             | Telegram bot token.                                              |
| `ADMIN_CHAT_ID`         | Yangi user/guruh va premium so'rovlar uchun admin chat ID.       |
| `ADMIN_PRIVATE_CHAT_ID` | Admin shaxsiy chat ID.                                           |
| `LOG_CHAT_ID`           | Xatolik loglari uchun chat ID.                                   |
| `ADMIN_USERNAME`        | To'lov uchun admin Telegram username (masalan: `admin_user`).    |
| `DB_HOST`               | PostgreSQL host.                                                 |
| `DB_PORT`               | PostgreSQL port.                                                 |
| `DB_USER`               | PostgreSQL user.                                                 |
| `DB_PASSWORD`           | PostgreSQL parol.                                                |
| `DB_NAME`               | Ma'lumotlar bazasi nomi.                                         |
| `MAX_ROUTES_PER_CHAT`   | Chatdagi yo'nalishlar limiti (default: 10).                      |

### Buyruqlar

```bash
bun install
bun run db:migrate
bun run dev
```

Webhook:

```bash
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<HOST>/bot
```

### Scheduler (cron)

Har 10 daqiqada, Toshkent vaqti bilan `:00`, `:10`, `:20` da:

```bash
bun run scheduler
```

Masalan crontab:

```cron
0,10,20,30,40,50 * * * * cd /path/to/bilet_bormi_bot && /usr/local/bin/bun run scheduler
```

### Manzillar

`ticket_bot_train_stations` va `ticket_bot_bus_stations` jadvallariga manzillarni o'zingiz kiritasiz (Drizzle Studio yoki SQL).

Poyezd uchun `code` = API `depStationCode` / `arvStationCode`.
Avtobus uchun `external_id` = API `from` / `to`.
