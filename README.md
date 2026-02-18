# Shopee Popular Products Scraper

ดึงข้อมูลสินค้ายอดนิยม (Popular/Trending Products) จากหน้าแรกของ **Shopee Thailand** (`shopee.co.th`) โดยใช้ [Ulixee Hero](https://ulixee.org/docs/hero) เป็น headless browser framework ร่วมกับ [Cheerio](https://cheerio.js.org/) สำหรับ parse HTML

---

## สารบัญ

- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้ง](#การติดตั้ง)
- [การตั้งค่า](#การตั้งค่า)
- [วิธีรัน](#วิธีรัน)
- [ผลลัพธ์ที่ได้](#ผลลัพธ์ที่ได้)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ขั้นตอนการทำงาน](#ขั้นตอนการทำงาน)
- [Data Schema](#data-schema)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)
- [ข้อควรระวัง](#ข้อควรระวัง)

---

## ความต้องการของระบบ

| รายการ | เวอร์ชัน |
|--------|---------|
| Node.js | >= 18.x |
| npm | >= 9.x |
| OS | macOS / Linux / Windows |

> Ulixee Hero ต้องการ Chromium ซึ่งจะถูกดาวน์โหลดอัตโนมัติตอน `npm install`

---

## การติดตั้ง

```bash
# 1. Clone โปรเจกต์
git clone <repository-url>
cd nodeJS_Shopee_Products_Scraper

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env (คัดลอกจากตัวอย่าง)
cp .env.example .env
```

หรือถ้ามีไฟล์ `.env` อยู่แล้ว สามารถข้ามขั้นตอนที่ 3 ได้

---

## การตั้งค่า

แก้ไขไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
# URL หน้าแรก Shopee
BASE_URL=https://shopee.co.th

# Port ของ Ulixee Cloud server
HERO_CLOUD_PORT=1818

# จำนวนครั้งสูงสุดที่จะ scroll เพื่อ load สินค้า
MAX_SCROLL_TIMES=15

# Delay ระหว่าง scroll (milliseconds) — สุ่มระหว่าง MIN-MAX
SCROLL_DELAY_MIN=1500
SCROLL_DELAY_MAX=3000

# Timeout รอหน้าโหลด (milliseconds)
PAGE_LOAD_TIMEOUT=30000

# จำนวนสินค้าสูงสุดที่ต้องการดึง
MAX_PRODUCTS=100

# จำนวนครั้ง retry กรณี fail
MAX_RETRIES=3

# โฟลเดอร์เก็บผลลัพธ์
OUTPUT_DIR=./output

# โฟลเดอร์เก็บ log
LOG_DIR=./logs
```

### ค่าที่แนะนำให้ปรับตามสถานการณ์

| ค่า | เมื่อไหร่ควรปรับ |
|-----|-----------------|
| `MAX_SCROLL_TIMES` | เพิ่มเป็น 20-30 ถ้าต้องการสินค้ามากขึ้น |
| `SCROLL_DELAY_MIN/MAX` | เพิ่มถ้าโดน rate limit, ลดถ้าต้องการเร็วขึ้น |
| `MAX_PRODUCTS` | ปรับตามจำนวนสินค้าที่ต้องการ (100-200) |
| `PAGE_LOAD_TIMEOUT` | เพิ่มถ้าเน็ตช้า |

---

## วิธีรัน

### ต้องใช้ 2 Terminal

#### Terminal 1 — เริ่ม Ulixee Cloud Server

```bash
npm run cloud
```

รอจนเห็นข้อความ:

```
[INFO] Ulixee Cloud server started on port 1818
[INFO] Press Ctrl+C to stop
```

> Cloud server ต้องรันค้างไว้ตลอดเวลาที่ scrape — ห้ามปิด

#### Terminal 2 — รัน Scraper

```bash
npm start
```

หรือ:

```bash
npm run scrape
```

### ตัวอย่าง output ที่จะเห็นใน terminal

```
[INFO] ============================================================
[INFO] Shopee Popular Products Scraper — Starting
[INFO] Target: https://shopee.co.th
[INFO] Max products: 100
[INFO] ============================================================
[INFO] [Step 1/3] Scraping product cards from Shopee...
[INFO] Navigating to https://shopee.co.th...
[INFO] Page loaded successfully
[INFO] Checking for popups...
[INFO] Closed popup using selector: .shopee-popup__close-btn
[INFO] Starting scroll (max 15 times)...
[INFO] Scroll completed: 15 scrolls
[INFO] Found 60 product cards with selector: a[data-sqe="link"]
[INFO] Extracted 60 raw product cards
[INFO] [Step 2/3] Parsing product data...
[INFO] Parsed 58 products from 60 cards
[INFO] [Step 3/3] Saving results...
[INFO] JSON saved: ./output/products.json (58 products)
[INFO] CSV saved: ./output/products.csv (58 products)
[INFO] ============================================================
[INFO] Scraping completed!
[INFO]   Products scraped: 58
[INFO]   JSON output: ./output/products.json
[INFO]   CSV output:  ./output/products.csv
[INFO]   Time elapsed: 45.2s
[INFO] ============================================================
[INFO] Sample products:
[INFO]   1. เคสโทรศัพท์ iPhone 15 Pro Max — ฿199 -50%
[INFO]   2. หูฟังบลูทูธไร้สาย — ฿299
[INFO]   3. เสื้อยืดผ้าฝ้าย Oversize — ฿159 -60%
```

---

## ผลลัพธ์ที่ได้

หลังรันสำเร็จ จะได้ไฟล์ 2 ไฟล์ในโฟลเดอร์ `output/`:

### `output/products.json`

```json
{
  "metadata": {
    "source": "https://shopee.co.th",
    "scrapedAt": "2026-02-18T10:30:00.000Z",
    "totalProducts": 58
  },
  "products": [
    {
      "name": "เคสโทรศัพท์ iPhone 15 Pro Max",
      "price": 199,
      "originalPrice": 399,
      "discount": "-50%",
      "sold": "ขายแล้ว 1.2พัน ชิ้น",
      "rating": 4.8,
      "image": "https://cf.shopee.co.th/file/...",
      "productUrl": "https://shopee.co.th/product/...",
      "shopName": "iCase Official",
      "shopLocation": "กรุงเทพมหานคร",
      "isMall": true,
      "isPreferred": false,
      "freeShipping": true,
      "scrapedAt": "2026-02-18T10:30:00.000Z"
    }
  ]
}
```

### `output/products.csv`

ไฟล์ CSV รองรับภาษาไทย (มี BOM) สามารถเปิดใน Excel ได้โดยตรง

### `logs/scraper.log`

Log ทั้งหมดถูกบันทึกที่นี่สำหรับ debug

---

## โครงสร้างโปรเจกต์

```
shopee-scraper/
├── .env                         # ค่า config (ไม่ถูก commit)
├── .gitignore
├── package.json
├── README.md
├── src/
│   ├── index.js                 # Entry point — orchestrate workflow
│   ├── cloud-server.js          # Ulixee Cloud server
│   ├── config/
│   │   └── settings.js          # อ่านค่า .env + กำหนด selectors
│   ├── scraper/
│   │   ├── shopee-hero.js       # เปิดเว็บ + navigate + ดึง HTML
│   │   ├── scroll-handler.js    # จัดการ infinite scroll / lazy load
│   │   └── captcha-handler.js   # ตรวจจับ captcha / verification
│   ├── parser/
│   │   ├── product-parser.js    # Parse HTML → structured data (Cheerio)
│   │   └── category-parser.js   # Parse หมวดหมู่สินค้า
│   ├── storage/
│   │   ├── json-writer.js       # บันทึกเป็น JSON
│   │   └── csv-writer.js        # บันทึกเป็น CSV
│   └── utils/
│       ├── delay.js             # Random delay (human emulation)
│       ├── logger.js            # Logging → console + file
│       └── retry.js             # Retry with exponential backoff
├── output/                      # ผลลัพธ์ JSON + CSV
└── logs/                        # Log files
```

---

## ขั้นตอนการทำงาน

```
npm run cloud                     npm start
     │                                │
     ▼                                ▼
┌─────────────┐              ┌─────────────────┐
│ Cloud Server│◄─────────────│  1. สร้าง Hero   │
│ (port 1818) │  WebSocket   │     instance     │
└─────────────┘              └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │  2. เปิด Shopee  │
                             │  shopee.co.th    │
                             └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │  3. ปิด Popup    │
                             │  โปรโมชัน        │
                             └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │  4. Scroll ลง    │
                             │  load สินค้า     │◄──┐
                             └────────┬────────┘   │ วนรอบจน
                                      │            │ ครบ/หมด
                             ┌────────▼────────┐   │
                             │  5. ดึง HTML     │───┘
                             │  product cards   │
                             └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │  6. Parse ด้วย   │
                             │  Cheerio         │
                             └────────┬────────┘
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                   ┌─────────────┐        ┌─────────────┐
                   │ products.json│        │ products.csv│
                   └─────────────┘        └─────────────┘
```

---

## Data Schema

ข้อมูลที่ดึงได้ต่อสินค้า:

| # | Field | Type | ตัวอย่าง |
|---|-------|------|---------|
| 1 | `name` | string | `"เคสโทรศัพท์ iPhone 15 Pro Max"` |
| 2 | `price` | number \| null | `199` |
| 3 | `originalPrice` | number \| null | `399` |
| 4 | `discount` | string \| null | `"-50%"` |
| 5 | `sold` | string \| null | `"ขายแล้ว 1.2พัน ชิ้น"` |
| 6 | `rating` | number \| null | `4.8` |
| 7 | `image` | string (URL) \| null | `"https://cf.shopee.co.th/file/..."` |
| 8 | `productUrl` | string (URL) \| null | `"https://shopee.co.th/product/..."` |
| 9 | `shopName` | string \| null | `"iCase Official"` |
| 10 | `shopLocation` | string \| null | `"กรุงเทพมหานคร"` |
| 11 | `isMall` | boolean | `true` |
| 12 | `isPreferred` | boolean | `false` |
| 13 | `freeShipping` | boolean | `true` |
| 14 | `scrapedAt` | ISO datetime | `"2026-02-18T10:30:00Z"` |

---

## การแก้ไขปัญหา

### Cloud server เริ่มไม่ได้

```
Error: Failed to start Cloud server
```

**แก้ไข:** ตรวจสอบว่า port 1818 ไม่ถูกใช้งานอยู่

```bash
lsof -i :1818
```

ถ้ามี process ค้างอยู่ ให้ kill ก่อน หรือเปลี่ยน `HERO_CLOUD_PORT` ใน `.env`

---

### Scraper ไม่พบสินค้า (0 products)

```
[WARN] No product cards found
```

**สาเหตุที่เป็นไปได้:**

1. **Cloud server ไม่ได้รัน** — ตรวจสอบว่ารัน `npm run cloud` ก่อน
2. **Shopee เปลี่ยน layout** — ต้องอัพเดท selectors ใน `src/config/settings.js`
3. **โดน block** — ลองเพิ่ม delay ใน `.env`:
   ```env
   SCROLL_DELAY_MIN=3000
   SCROLL_DELAY_MAX=5000
   ```
4. **scroll ไม่พอ** — เพิ่ม `MAX_SCROLL_TIMES=25` ใน `.env`

---

### โดน Captcha

```
[WARN] Captcha detected
```

**แก้ไข:**
- Scraper จะรอ 60 วินาทีให้ captcha หาย
- ถ้าไม่หาย จะ skip รอบนั้นแล้ว retry
- ลองเว้นช่วงให้นานขึ้นระหว่างแต่ละครั้งที่รัน

---

### Parse ได้ข้อมูลไม่ครบ (บาง field เป็น null)

**สาเหตุ:** Shopee ใช้ class name แบบ hash ที่เปลี่ยนทุกครั้งที่ deploy

**แก้ไข:**
1. เปิด Shopee ใน Chrome → คลิกขวาที่สินค้า → Inspect
2. หา selector ที่ตรงกับ element ที่ต้องการ
3. อัพเดทใน `src/config/settings.js` → object `SELECTORS`

---

### Connection refused / WebSocket error

```
Error: connect ECONNREFUSED 127.0.0.1:1818
```

**แก้ไข:** Cloud server ต้องรันอยู่ก่อน ให้เปิด terminal แยกแล้วรัน:

```bash
npm run cloud
```

---

## npm Scripts

| คำสั่ง | คำอธิบาย |
|--------|---------|
| `npm run cloud` | เริ่ม Ulixee Cloud server (ต้องรันก่อน) |
| `npm start` | รัน scraper |
| `npm run scrape` | เหมือน `npm start` |

---

## Dependencies

| Package | เวอร์ชัน | หน้าที่ |
|---------|---------|--------|
| `@ulixee/hero` | ^2.0.0-alpha.29 | Headless browser ที่หลีกเลี่ยง anti-bot |
| `@ulixee/cloud` | ^2.0.0-alpha.29 | Cloud server สำหรับรัน Hero แบบ remote |
| `cheerio` | ^1.0.0 | Parse HTML → structured data |
| `dotenv` | ^16.4.7 | อ่านค่า config จาก `.env` |

---

## ข้อควรระวัง

1. **Terms of Service** — ตรวจสอบ Shopee TOS ก่อนใช้งาน
2. **robots.txt** — เช็ค `https://shopee.co.th/robots.txt`
3. **Rate Limiting** — อย่ารัน scraper ถี่เกินไป อาจโดน block IP
4. **ข้อมูลส่วนบุคคล** — ไม่ดึงข้อมูลส่วนบุคคลของผู้ขาย/ผู้ซื้อ
5. **การใช้งาน** — ใช้เพื่อการศึกษา/วิจัยเท่านั้น ไม่ใช่เชิงพาณิชย์โดยไม่ได้รับอนุญาต

---

## License

MIT
