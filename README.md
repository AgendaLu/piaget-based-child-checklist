# 寶寶發展追蹤｜個人化里程碑

以 **Piaget 認知發展理論** 為核心，整合 WHO / Denver II 百分位資料的兒童發展追蹤工具。家長可依寶寶實際月齡，瀏覽並勾選五大領域（粗動作、精細動作、語言、認知、社交情緒）的發展里程碑，並查閱對應 Piaget 階段的關鍵概念與互動任務。

純前端網頁應用，使用 ES Modules，資料儲存於瀏覽器 `localStorage`。

---

## 功能特色

- **個人化月齡計算**：依出生日自動定位至對應里程碑階段。
- **五大發展領域勾選**：四種勾選狀態（未勾 / 按時 / 事後補填 / 延遲補填）。
- **D3 互動式時間軸**：顯示 0–24 個月各階段與完成狀態。
- **Piaget 全屏模態**：對應月齡的認知發展階段、關鍵概念與親子互動任務。
- **百分位分布視覺化**：以 WHO (2006)、Denver II (1992) 等資料呈現粗動作達成的常模分布。
- **本地儲存**：個人資料與勾選狀態皆存於 `localStorage`，不上傳伺服器。

---

## 專案結構

```
piaget-based-child-checklist/
├── index.html                     # 主頁面 / UI 結構（zh-TW）
├── init.js                        # 進入點：將模組函式掛載到 window
├── app.js                         # 主應用邏輯：月齡計算、渲染任務卡
├── drawer.js                      # Piaget 全屏模態與手風琴互動
├── timeline.js                    # D3 時間軸元件
├── milestones.js                  # 資料：里程碑與領域元資料
├── piaget.js                      # 資料：Piaget 各階段內容
├── percentile-distribution.js     # 資料：粗動作百分位分布（WHO/Denver II）
├── theme.css                      # 自訂樣式
├── tailwind.config.js             # Tailwind 設定（領域色票、字型）
├── postcss.config.js              # PostCSS 設定
├── src/
│   ├── css/main.css               # Tailwind 入口（建構來源）
│   └── js/                        # （備用 / 鏡像目錄）
├── dist/                          # 建構輸出（main.css）
├── package.json
└── LICENSE                        # ISC
```

### 模組依賴關係

```
index.html
  └── init.js
        ├── milestones.js   ─┐
        ├── piaget.js        │（純資料模組，無副作用）
        ├── percentile-distribution.js ─┘
        ├── app.js           ── 主邏輯
        ├── drawer.js        ── Piaget 模態
        └── timeline.js      ── D3 時間軸
```

外部相依（CDN）：Tailwind CSS、D3 v7、Google Fonts（Noto Serif/Sans TC、DM Mono）。

---

## 開發

### 環境需求

- Node.js（建構 Tailwind CSS 用）
- 任一靜態檔案伺服器（因使用 ES Modules，需 HTTP 伺服器，無法用 `file://` 直開）

### 安裝

```bash
npm install
```

### 建構 / 監看 CSS

```bash
npm run build      # 一次性建構：src/css/main.css → dist/main.css
npm run watch      # 監看模式（= npm run dev）
```

### 啟動本地伺服器

```bash
python3 -m http.server 8000
# 或
npx serve .
```

開啟 `http://localhost:8000`。

---

## 資料儲存

所有狀態以 `localStorage` 儲存：

| 鍵名 | 內容 |
| --- | --- |
| `profile` | 寶寶個人資料（姓名、出生日等） |
| `checks_{idx}` | 第 `idx` 個里程碑的勾選紀錄，例如 `{ "gross_0": { state: "normal", date: "2024-01-15" }, ... }` |

`state` 值：`false`（未勾）／`"normal"`（按時）／`"retro"`（事後補填）／`"intermediate"`（超時補填）。

---

## 資料來源

- **WHO Multicentre Growth Reference Study (2006)** — 5 國 816 名兒童、6 項粗動作里程碑。
- **Denver II Developmental Screening Test (Frankenburg et al., 1992)** — 32 項粗動作百分位常模。
- **Piaget 認知發展理論** — 感覺動作期至前運算期之階段化整理。

詳見 `percentile-distribution.js` 檔頭註解。

---

## License

ISC，見 [LICENSE](LICENSE)。
