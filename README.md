# Single-Conference Website Template

這是一套以 React、Vite、Vercel Functions 與 Notion API 建立的單一 conference 官方網站模板。網站只有一個當屆 conference；名稱、年份、內容、議程、organizers、場地與贊助資料可由 Notion 管理，品牌色、版面、動畫、選單名稱與離線 fallback 則由程式碼控制。

> 這不是多 conference／多 track 系統。Notion 資料不需要 `conference` 欄位，也不應再用 HCOMP、CI 等欄位區分兩套資料。

## 目錄

- [快速開始](#快速開始)
- [系統架構](#系統架構)
- [Notion Registry Database](#notion-registry-database)
- [網站頁面與 Notion 來源對照](#網站頁面與-notion-來源對照)
- [各 Notion Database 資料結構](#各-notion-database-資料結構)
- [Notion Page 支援格式](#notion-page-支援格式)
- [enabled 顯示控制](#enabled-顯示控制)
- [Organizer 顯示規則](#organizer-顯示規則)
- [寫在程式碼中的設定](#寫在程式碼中的設定)
- [客製成自己的 Conference](#客製成自己的-conference)
- [部署到 Vercel](#部署到-vercel)
- [驗證與疑難排解](#驗證與疑難排解)

## 快速開始

### 系統需求

- Node.js 18 以上版本
- 一個 Notion integration
- 一個 Notion Registry database
- 建議使用 Vercel 部署，因為 `/api/*` 使用 Vercel Functions

### 安裝與啟動

```bash
npm install
npm run dev
```

建立 `.env.local`：

```bash
NOTION_API_KEY=secret_xxx
NOTION_REGISTRY_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`.env.example` 仍保留 `NOTION_PROGRAM_DATABASE_ID`、`NOTION_ORGANIZER_DATABASE_ID` 等舊欄位，但目前單一 conference 架構由 Registry 的 `source_id` 決定資料來源；正常情況只需要：

- `NOTION_API_KEY`
- `NOTION_REGISTRY_DATABASE_ID`

`GEMINI_API_KEY` 不負責 conference／Notion 內容，這個模板目前不需要它來呈現網站資料。

### Notion 權限

Notion integration 必須能讀取：

1. Registry database
2. Registry 中每個 `source_id` 指向的 database 或 page

只分享 Registry database 給 integration 並不會自動授權其他來源。

## 系統架構

```text
Notion Registry Database
  ├─ page_key + section_key
  ├─ source_type
  ├─ source_id
  └─ enabled
          │
          ▼
Vercel Functions (/api/content, /api/program, /api/organizers)
          │
          ▼
React UI
  ├─ 優先顯示 Notion 資料
  └─ 部分區域沒有資料時使用 src/constants/content.ts fallback
```

主要檔案：

| 檔案 | 用途 |
|---|---|
| `api/content.ts` | 讀取 Registry，載入 database/page/inline 內容，提供 visibility manifest |
| `api/program.ts` | 由 Registry 找到 program database 並輸出議程 |
| `api/organizers.ts` | 由 Registry 找到 organizer database 並輸出 organizers |
| `src/lib/registryParsers.ts` | 將 Notion database records 轉成前端資料模型 |
| `src/components/NotionContentRenderer.tsx` | 顯示 Notion page blocks |
| `src/App.tsx` | 頁面、選單、資料來源對應與顯示邏輯 |
| `src/constants/content.ts` | 靜態 fallback 文案與示例資料 |
| `src/constants/theme.ts` | 品牌標準色與背景 Canvas 顏色 |
| `src/index.css` | 字型、玻璃效果、漸層與全域樣式 |

## Notion Registry Database

Registry 是整個模板的資料路由表。每一列代表網站的一個 section。

### 必要欄位

| Property | 建議 Notion 類型 | 說明 |
|---|---|---|
| `page_key` | Title 或 Rich text | 網站頁面識別字；可用逗號、分號或換行指定多個 page keys |
| `section_key` | Rich text | 頁面內區塊識別字 |
| `source_type` | Select | `database`、`page` 或 `inline` |
| `source_id` | Rich text | Notion database/page ID，也可貼完整 Notion URL |
| `source_url` | URL | 可選；`source_id` 空白時可從 URL 擷取 ID |
| `description` | Rich text | 說明文字；`inline` 類型時也作為內容 |
| `enabled` | Checkbox | 勾選才啟用；未勾選會隱藏內容與對應按鈕 |

欄位名稱比對不分大小寫，空格與 `/` 會正規化成 `_`。但為了容易維護，建議使用上表的精確名稱。

### source_type

| 值 | 用途 |
|---|---|
| `database` | 讀取結構化 rows，交給對應 parser |
| `page` | 讀取 Notion page 的 blocks，保留段落、標題、列表、連結等格式 |
| `inline` | 直接使用 Registry row 的 `description` |

若 `source_type` 空白，系統會依 `source_id` 與 `description` 推測類型；正式模板建議明確填寫。

## 網站頁面與 Notion 來源對照

下表的 key 會經過正規化，因此 `Home Page` 與 `home_page` 可被視為相同；仍建議統一使用表中的寫法。

| 網站區域 | `page_key` | `section_key` | 建議類型 |
|---|---|---|---|
| 首頁 conference 名稱、年份、介紹 | `home page` | `conference info` | database |
| 首頁底部合作單位 Logos | `home page` | `logo area` | database |
| 首頁／CFP Topics | `home page` 或 `call for participation` | `topics of interest` | database |
| CFP Important Dates | `home page` | `important dates` | database |
| CFP Instructions 內文 | `call for participation` | `general instructions` | page |
| CFP Papers | `call for participation` | `papers` | page |
| CFP Posters and Demos | `call for participation` | `poster and demos` | page |
| Doctoral Consortium（內容保留、tab 目前隱藏） | `call for participation` | `doctoral consortium` | page |
| Workshops | `call for participation` | `workshops` | page |
| CrowdCamp（內容保留、tab 目前隱藏） | `call for participation` | `crowdcamp` | page |
| Organizers | `organizer page` 或 `organizers page` | `organizers` | database |
| Program | `program page` | `program` | database |
| Venue | `attend page` | `venue` | database |
| Accommodation | `attend page` | `accomodation` | database |
| Transportation | `attend page` | `transportation` | database |
| Sponsor 招募內文 | `sponsor page` | `call for sponsor` | page |
| Sponsor logos | `sponsor page` | `sponsor logo` | database |
| Community photos | `sponsor page` | `proven committee` 或 `proven communities` | database |
| Sponsorship tiers | `sponsor page` | `sponsorship tiers` | database |
| Past Meetings（主選單目前隱藏） | `past meetings` | `past meetings` | database |
| Past Reports | `past meetings` | `past reports` | database |
| Code of Conduct（主選單目前隱藏） | `code of conduct` | `code of conduct` | page |

> `accomodation` 是目前程式實際使用的拼字。若改成 `accommodation`，必須同步修改 `src/App.tsx`。

## 各 Notion Database 資料結構

### Conference Info

建議至少建立一筆 `main = checked` 的當屆資料。

| Property | 建議類型 | 用途 |
|---|---|---|
| `main` | Checkbox | 指定主要 conference row；沒有時使用第一列 |
| `name` | Title | 短名稱，例如 `TAICHI`；會連動頁首、Hero、頁面標籤與 document title |
| `long name` | Rich text | Hero 副標題／完整名稱 |
| `year` | Number 或 Rich text | 年份，例如 `2027` |
| `about` | Rich text | 首頁 About 內容；可用空白行分段 |
| `conference info` | Rich text | 首頁 Conference Information 與 Current Conference 介紹 |
| `brief_topic_of_interests` | Rich text | CFP → Instructions → Topic of Interests 上方介紹；可用空白行分段 |
| `location` | Rich text | 場地摘要，可有多列 |
| `event date` | Date 或 Rich text | 日期摘要，可有多列 |

相容 aliases 包括 `long_name`、`conference_info`、`event_date`、`brief topic of interests` 等。

### Topics of Interest

每列是一個 topic category。

| Property | 建議類型 | 用途 |
|---|---|---|
| `Name` | Title | category 標題 |
| `topic` | Multi-select 或 Rich text | category 下的項目；字串可用逗號、分號或換行分隔 |

也接受 `title`、`category`、`topics`、`item`、`items`。

### Important Dates

| Property | 建議類型 | 用途 |
|---|---|---|
| `date` | Date 或 Rich text | 顯示日期 |
| `label` | Title | 事件名稱 |
| `status` | Select 或 Rich text | 例如 `Upcoming` |
| `color` | Rich text | Tailwind class，例如 `text-brand-blue` |

事件名稱也接受 `title`、`name`、`event`。

### Organizers

| Property | 建議類型 | 用途 |
|---|---|---|
| `Name` | Title | 姓名，必要 |
| `organization` | Rich text | 學校／機構 |
| `Role` | Select 或 Rich text | 職務，也決定顯示位置 |
| `photos` | Files & media | 頭像；也接受 URL 型態文字 |
| `order` | Number | 排序；空白時視為 999 |
| `email` | Email | 聯絡信箱 |

### Program

| Property | 建議類型 | 用途 |
|---|---|---|
| `Date` | Date | 活動日期，必要 |
| `start_time` | Rich text | 開始時間 |
| `end_time` | Rich text | 結束時間 |
| `Topic` | Title | Session 名稱，必要 |
| `location` | Rich text | 地點 |
| `keywords` | Select 或 Multi-select | 類型標籤 |

`keywords` 包含 `keynote` 時顯示 Keynote 樣式；包含 `network` 或 `social` 時顯示 Social，其餘為 Technical。

### Venue

| Property | 建議類型 | 用途 |
|---|---|---|
| `Name` | Title | 場地名稱 |
| `address` | Rich text | 地址 |
| `location` | Rich text | 城市／國家 |
| `days` | Multi-select | 使用日 |
| `photo` | Files & media | 場地圖片 |
| `main hall` | Rich text | 主會場 |

### Accommodation

| Property | 建議類型 | 用途 |
|---|---|---|
| `hotel name` | Title | 飯店名稱 |
| `price` | Rich text | 房價 |
| `discount code` | Rich text | 折扣碼 |
| `address` | Rich text | 地址 |
| `distance` | Rich text | 距會場距離 |

### Transportation

| Property | 建議類型 | 用途 |
|---|---|---|
| `Name` | Title | 交通方式 |
| `description` | Rich text | 說明 |

### Sponsor Logos

首頁底部的合作單位 Logo 使用獨立的 `home page` / `logo area` database：

| Property | 建議類型 | 用途 |
|---|---|---|
| `Logo Name` | Title | 單位名稱 |
| `area` | Select | `main organizers`、`co-organizers`、`Supporting Organizations` 或 `Sponsors` |
| `logo` | URL 或 Files & media | Logo 圖片；若有多張只使用第一張 |

四種 area 依序顯示為主辦單位、共同主辦、協辦單位與贊助單位。空白群組不顯示；Registry `enabled` 未勾選時整個 Logo 區塊隱藏。

Sponsor 頁面本身的 Sponsor Logos 使用另一個 `sponsor page` / `sponsor logo` database：

| Property | 建議類型 | 用途 |
|---|---|---|
| `Name` | Title | Sponsor 名稱 |
| `sub` | Rich text | 副標／機構說明 |
| `logo` | Files & media | Logo |
| `url` | URL | Sponsor 網站 |
| `group` | Select | `platinum`、`gold`、`silver`、`bronze`、`sponsoring societies` 等 |

### Community Photos

| Property | 建議類型 | 用途 |
|---|---|---|
| `Name` | Title | 圖片名稱 |
| `caption` | Rich text | 圖說 |
| `files & media` | Files & media | 圖片 |
| `url` | URL | 點擊連結 |

### Sponsorship Tiers

每列 `Name` 為 `Platinum`、`Gold`、`Silver` 或 `Bronze`。其他 properties 會自動成為比較表的 feature 欄位；Checkbox 會顯示 `✓` 或 `×`。

### Past Meetings

| Property | 建議類型 | 用途 |
|---|---|---|
| `year` | Number | 年份，必要 |
| `name` | Title | Conference 名稱 |
| `location` | Rich text | 地點 |
| `website` | URL | 官網 |
| `proceedings` | URL | Proceedings |
| `best paper award` | Rich text | Best paper 資料 |

### Past Reports

| Property | 建議類型 | 用途 |
|---|---|---|
| `Name` | Title | 報告名稱／citation |
| `link` | URL | 報告連結 |

## Notion Page 支援格式

`source_type = page` 時支援：

- Paragraph
- Heading 1、2、3
- Bulleted list、Numbered list（包含巢狀 children）
- Quote
- Callout
- Divider
- Table
- Rich text：粗體、斜體、刪除線、底線、code、超連結
- 中文與其他 Unicode 文字

目前未實作圖片 block、bookmark、toggle、column、video、embed 等 block。若內容使用未支援格式，該 block 不會出現在網站上。

## enabled 顯示控制

Registry row 的 `enabled`：

- 勾選：載入並顯示來源。
- 未勾選：不載入來源、不顯示內容，也不顯示對應按鈕。
- 同一主頁有多個 sections：至少一個啟用時主選單保留；全部停用時主選單隱藏。
- Call for Participation：各 tab 依自己的 `section_key` 個別控制。
- 欄位不存在：視為啟用，供舊 Registry 相容。
- Visibility API 暫時失敗：前端採 permissive fallback，保留導航，避免網路錯誤讓整站選單消失。

## Organizer 顯示規則

`Role` 不分大小寫，使用關鍵字包含比對：

| 顯示位置 | Role 需包含 |
|---|---|
| 首頁 Current Conference | `general`；顯示所有符合者 |
| CFP → Papers 最底部 | `paper` |
| CFP → Posters and Demos 最底部 | `poster` 或 `demo` |
| Doctoral Consortium | `doctoral consortium` |
| Workshops | `workshops` |
| CrowdCamp | `crowdcamp` |
| Sponsor Contacts | `general` 或 `sponsor` |

例如 `General Chair`、`General Co-Chair`、`Papers Chair`、`Poster Chair`、`Demo Co-Chair` 都能被辨識。

## 寫在程式碼中的設定

### 品牌標準色

修改 `src/constants/theme.ts`：

```ts
export const THEME_COLORS = {
  blue: '#fce874',       // Highlight Yellow
  purple: '#b31229',     // Deep Red
  teal: '#ffb0bc',       // Soft Pink
  background: '#E81B39', // Main Red
};
```

目前實際標準色：

| 用途 | Hex |
|---|---|
| 主背景紅 | `#E81B39` |
| 深紅 | `#B31229` |
| 強調黃 | `#FCE874` |
| 淡粉 | `#FFB0BC` |
| 白色文字 | `#FFFFFF` |

變數名稱 `blue`、`purple`、`teal` 是早期語意名稱；客製時可以只換色碼，也可以同步重新命名所有 `brand-*` classes。

### 字型與全域視覺

修改 `src/index.css`：

- `--font-sans`、`--font-serif`、`--font-display`
- `.glass` 的透明度、blur 與 border
- `.text-title-gradient`
- `.orb` 背景光暈
- `.connection-grid` 背景網格

### Canvas 動畫

修改 `src/constants/theme.ts` 的 `CANVAS_SETTINGS`：

- `particleCount`
- `connectionDistance`
- `particleColor`
- `lineColor`
- `mouseLineColor`

### 選單、標題與顯示結構

以下由 `src/App.tsx` 控制：

- 主選單項目與標籤
- Call for Participation tabs
- `Call for Papers` 等頁面標題
- 哪些 pages/tabs 固定隱藏
- Organizer role 對應
- 頁面 layout、動畫、卡片與按鈕
- Register 按鈕行為

### 靜態 fallback

`src/constants/content.ts` 包含：

- 預設 conference 名稱、年份、Hero 文案
- 預設日期與 program
- 預設 CFP 內容
- 預設 About、Venue、Organizer、Sponsor、Code of Conduct 等資料

Notion 缺資料或本機沒有 `/api/*` 時，部分區域會使用這些內容。建立正式 conference 前應逐段檢查，避免顯示 HCOMP 範例文字。

## 客製成自己的 Conference

### 1. 複製專案並建立 Notion integration

- Fork／clone repository。
- 建立新的 Notion integration。
- 建立 Registry database。
- 將 Registry 與所有來源 pages/databases 分享給 integration。

### 2. 建立 Conference Info

- 建立一筆 `main = checked` 的 row。
- 設定 `name`、`long name`、`year`、`about`、`conference info`。
- 修改 `name` 即可讓網站上的 conference 名稱連動，例如 `TAICHI`。

### 3. 依需求建立內容來源

- 結構化、需要排序或篩選的資料使用 database。
- 長篇政策、投稿說明使用 page。
- 在 Registry 設定精確的 `page_key`、`section_key`、`source_type`、`source_id`。
- 暫時不公開的內容取消勾選 `enabled`。

### 4. 替換品牌

- 修改 `src/constants/theme.ts` 色碼。
- 修改 `src/index.css` 字型與視覺效果。
- 替換 `public/` 中的圖片或圖示。
- 搜尋 `HCOMP`、舊年份與舊地點，清除 fallback 範例。

```bash
rg -n "HCOMP|2026|Washington|Collective Intelligence|CI" src public README.md
```

### 5. 調整導覽與頁面

- 在 `src/App.tsx` 修改主選單與 CFP tabs。
- 若更改 Registry key，必須同步修改程式中的 `getRegistryEntry(...)`。
- Registry key 建議保持穩定；一般文案更新應只改 Notion 內容。

### 6. 完整驗證

```bash
./node_modules/.bin/tsx --test src/lib/*.test.ts
npm run lint
npm run build
```

## 部署到 Vercel

1. 將 repository 連接到 Vercel。
2. 在 Project Settings → Environment Variables 設定：
   - `NOTION_API_KEY`
   - `NOTION_REGISTRY_DATABASE_ID`
3. 重新部署。
4. 檢查：
   - `/api/content?visibility_only=1`
   - `/api/content?page_keys=home%20page`
   - `/api/organizers`
   - `/api/program`

不要把 `NOTION_API_KEY` 放進前端程式或提交到 Git。

## 驗證與疑難排解

### Notion 內容沒有出現

依序檢查：

1. Registry row 的 `enabled` 是否勾選。
2. `page_key`、`section_key` 是否和本文件一致。
3. `source_type` 是否正確。
4. `source_id` 是否為正確 page/database ID。
5. Notion integration 是否有來源頁面的讀取權限。
6. Vercel 是否已設定環境變數並重新部署。

### `/api/organizers` 顯示 Missing registry source

Registry 必須存在：

```text
page_key: organizer page
section_key: organizers
source_type: database
source_id: <organizer database id>
enabled: checked
```

也接受 `organizers page`。

### 中文內容沒有顯示

API 與 renderer 支援 UTF-8／Unicode。先查看 `/api/content` 是否已回傳中文；若 API 有資料但畫面沒有，確認該段使用的是受支援的 Notion block 類型，並重新整理部署快取。

### Notion 更新後網站仍是舊內容

- 確認編輯的是 Registry 指向的來源，而不是另一份複製頁面。
- 重新整理瀏覽器。
- 查看 `/api/content` 回應以判斷是 Notion/API 還是前端問題。
- 若修改的是程式碼、環境變數或 Registry key，必須重新部署。

### 本機看到 fallback

純 Vite dev server 不一定能提供 Vercel `/api/*` routes；可使用 Vercel 本機環境，或部署 preview 後測試完整 Notion 串接。沒有 API 時出現 `src/constants/content.ts` 的 fallback 是預期行為。

## 資料模型原則

- 一個部署只代表一個當屆 conference。
- Conference 名稱由 Conference Info database 的 `name` 決定。
- Organizer、Topics、Program 等資料不需要 conference discriminator。
- 不建立第二套 conference organizer team 或 track-specific fallback。
- 過往 conference 使用 Past Meetings archive 表示，不與當屆資料混在一起。
