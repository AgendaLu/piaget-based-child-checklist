// ─────────────────────────────────────────
// percentile-distribution.js
// 粗大動作百分位分布數據（Phase 1 MVP）
//
// 數據來源：
//   [WHO2006]   WHO Multicentre Growth Reference Study (2006)
//               816 children, 5 countries, 6 gross motor milestones
//   [D2]        Frankenburg et al., Denver II Developmental Screening Test (1992)
//               Percentile norms for 32 gross motor items
//   [CLN]       Clinical estimation from published developmental ranges
//
// 鍵格式：`{milestoneIdx}_{domain}_{itemIdx}`
//   milestoneIdx 對應 MILESTONES[] 陣列索引（0–9）
//   domain = "gross"（Phase 1 僅粗動作）
//   itemIdx = 0-based 項目索引
//
// 所有月齡值為小數月（1 個月 ≈ 30.44 天）
// ─────────────────────────────────────────

export const PERCENTILE_DATA = {

  // ════════════════════════════════════════
  // 里程碑 0：新生兒期 (monthStart=0, 0–1m)
  // 粗動作：先天反射與俯臥初步抬頭
  // ════════════════════════════════════════

  "0_gross_0": {
    // 仰臥時頭可短暫轉向側面以保持呼吸道暢通
    p10: 0, p25: 0, p50: 0, p75: 0.25, p90: 0.5,
    source: "CLN",
    note: "先天性保護性反射，正常足月兒生後即具備；不具備此反射為警示指標"
  },
  "0_gross_1": {
    // 四肢呈屈曲姿勢，具備原始反射（抓握、驚嚇、踏步）
    p10: 0, p25: 0, p50: 0, p75: 0, p90: 0.25,
    source: "CLN",
    note: "原始反射群生後即具備，4–6 個月漸自動整合消失"
  },
  "0_gross_2": {
    // 俯臥時下巴可短暫離床
    p10: 0, p25: 0, p50: 0.25, p75: 0.5, p90: 1.0,
    source: "D2",
    note: "Denver II 俯臥初步抬頭最早指標；p50 約 1 週–1 個月"
  },

  // ════════════════════════════════════════
  // 里程碑 1：2個月 (monthStart=1, 1–3m)
  // 粗動作：俯臥抬頭、腿部動作、頭部控制
  // ════════════════════════════════════════

  "1_gross_0": {
    // 俯臥時頭可抬起約45度並維持數秒
    p10: 0.7, p25: 1.0, p50: 2.0, p75: 2.9, p90: 3.9,
    source: "D2",
    note: "Denver II 俯臥 45° 抬頭；p25=1.0m, p50=2.0m, p75=2.9m, p90=3.9m"
  },
  "1_gross_1": {
    // 腿部踢踹動作增加且較有力
    p10: 0.5, p25: 1.0, p50: 1.5, p75: 2.5, p90: 3.5,
    source: "CLN",
    note: "臨床觀察估計；自發性踢踹在 1–2 個月顯著增加"
  },
  "1_gross_2": {
    // 拉坐時頭部稍可控制（仍有落後）
    p10: 1.0, p25: 1.5, p50: 2.5, p75: 3.5, p90: 4.5,
    source: "D2",
    note: "Denver II 頭部控制系列指標延伸估計"
  },

  // ════════════════════════════════════════
  // 里程碑 2：4個月 (monthStart=3, 3–5m)
  // 粗動作：俯臥抬頭 90°、腹部力量、頭部不落後
  // ════════════════════════════════════════

  "2_gross_0": {
    // 俯臥時頭可穩定抬起90度，以前臂撐起胸部
    p10: 1.5, p25: 2.3, p50: 3.0, p75: 4.2, p90: 5.1,
    source: "D2",
    note: "Denver II 俯臥前臂撐起（chest up, arm support）p25=2.3m, p50=3.0m, p90=5.1m"
  },
  "2_gross_1": {
    // 仰臥時嘗試抬頭看自己的腳
    p10: 2.0, p25: 2.5, p50: 3.5, p75: 4.5, p90: 5.5,
    source: "CLN",
    note: "臨床觀察估計；腹部力量初現，約 3–4 個月"
  },
  "2_gross_2": {
    // 拉坐時頭部不再落後，可與身體保持一直線
    p10: 2.0, p25: 2.5, p50: 3.5, p75: 4.5, p90: 5.5,
    source: "D2",
    note: "Denver II 頭部控制成熟指標估計；p50 約 3–4 個月"
  },

  // ════════════════════════════════════════
  // 里程碑 3：6個月 (monthStart=5, 5–7m)
  // 粗動作：雙手撐地、翻身、坐立、承重
  // ════════════════════════════════════════

  "3_gross_0": {
    // 俯臥時雙手撐起，胸腹離地
    p10: 2.5, p25: 3.5, p50: 4.5, p75: 5.5, p90: 6.5,
    source: "D2",
    note: "Denver II 胸腹離地（chest up, weight on hands）估計；與前臂撐起指標連續"
  },
  "3_gross_1": {
    // 可翻身：仰臥→俯臥（雙向）
    p10: 2.0, p25: 3.5, p50: 4.5, p75: 5.5, p90: 6.5,
    source: "D2",
    note: "Denver II 單向翻身 p50=3.9m；雙向翻身（仰→俯）約晚半個月"
  },
  "3_gross_2": {
    // 在支撐下可短暫坐立（tripod坐姿）
    p10: 3.5, p25: 4.0, p50: 5.0, p75: 6.0, p90: 7.0,
    source: "D2",
    note: "Denver II 支撐坐立估計；WHO 獨立坐立 p10=4.6m，此項略早"
  },
  "3_gross_3": {
    // 扶腋下站立時雙腿可承重片刻
    p10: 3.5, p25: 4.5, p50: 5.5, p75: 6.5, p90: 7.5,
    source: "CLN",
    note: "臨床觀察估計；WHO 扶持站立 p10=6.3m，此為更早期的部分承重"
  },

  // ════════════════════════════════════════
  // 里程碑 4：9個月 (monthStart=7, 7–10m)
  // 粗動作：獨坐、爬行、扶站、拉站
  // ════════════════════════════════════════

  "4_gross_0": {
    // 可獨立坐穩，雙手自由操作玩具
    p10: 4.6, p25: 5.2, p50: 6.0, p75: 6.8, p90: 7.5,
    source: "WHO2006",
    note: "WHO MGRS (2006) 官方數據：獨立坐立（sitting without support）816 children, 5 countries"
  },
  "4_gross_1": {
    // 腹部或四肢爬行（個體差異大）
    p10: 6.1, p25: 7.0, p50: 8.5, p75: 9.5, p90: 10.5,
    source: "WHO2006",
    note: "WHO MGRS (2006) 官方數據：手膝爬行。⚠️ 4.3% 正常兒童跳過爬行直接行走，不爬行本身不是發展異常指標"
  },
  "4_gross_2": {
    // 扶物站立，並可側移步伐（cruising）
    p10: 7.0, p25: 8.0, p50: 9.0, p75: 10.5, p90: 12.0,
    source: "WHO2006",
    note: "WHO MGRS (2006) 扶持站立 p10=6.3m, p90=11.0m；側移（cruising）略晚，估計上限延至 12m"
  },
  "4_gross_3": {
    // 從坐姿拉扶東西站起來
    p10: 7.0, p25: 8.0, p50: 9.5, p75: 11.0, p90: 12.5,
    source: "WHO2006",
    note: "WHO MGRS 扶站指標延伸；需要比單純扶站更多主動肌力"
  },

  // ════════════════════════════════════════
  // 里程碑 5：12個月 (monthStart=10, 10–13m)
  // 粗動作：獨站、扶走、獨走、蹲起
  // ════════════════════════════════════════

  "5_gross_0": {
    // 可獨立站立數秒
    p10: 8.8, p25: 9.5, p50: 11.0, p75: 12.5, p90: 14.4,
    source: "WHO2006",
    note: "WHO MGRS (2006) 官方數據：獨立站立（standing alone）；視窗跨度約 5.6 個月"
  },
  "5_gross_1": {
    // 扶物或單手扶持行走
    p10: 7.6, p25: 8.5, p50: 9.7, p75: 11.0, p90: 12.7,
    source: "WHO2006",
    note: "WHO MGRS (2006) 官方數據：扶持行走（walking with assistance）"
  },
  "5_gross_2": {
    // 部分孩子開始獨立行走（±3個月屬正常範圍）
    p10: 10.0, p25: 11.0, p50: 12.1, p75: 13.0, p90: 14.4,
    source: "WHO2006",
    note: "WHO MGRS (2006) 官方數據：獨立行走（walking alone）；p10=10.0m 至 p90=14.4m，跨度 4.4 個月均屬正常"
  },
  "5_gross_3": {
    // 從站姿蹲下再站起
    p10: 9.5, p25: 10.5, p50: 12.0, p75: 13.5, p90: 15.0,
    source: "D2",
    note: "Denver II stoops and recovers 蹲下撿物再站起估計"
  },

  // ════════════════════════════════════════
  // 里程碑 6：15個月 (monthStart=13, 13–16m)
  // 粗動作：行走穩定、蹲站、推拉、爬樓梯
  // ════════════════════════════════════════

  "6_gross_0": {
    // 獨立行走穩定，跌倒次數減少
    p10: 10.5, p25: 11.3, p50: 12.4, p75: 13.4, p90: 14.5,
    source: "D2",
    note: "Denver II 行走穩定（walks well）p25=11.3m, p50=12.4m, p75=13.4m, p90=14.5m"
  },
  "6_gross_1": {
    // 可蹲下撿物再站起
    p10: 10.5, p25: 11.5, p50: 13.0, p75: 14.5, p90: 16.0,
    source: "D2",
    note: "Denver II stoops and recovers 延伸，需要更好的平衡控制"
  },
  "6_gross_2": {
    // 可推拉玩具行走
    p10: 11.5, p25: 12.5, p50: 13.5, p75: 14.5, p90: 16.0,
    source: "D2",
    note: "Denver II 行走進階指標：攜帶物體行走，發展於獨走後 1–2 個月"
  },
  "6_gross_3": {
    // 爬樓梯（需大人扶持，雙腳同一階）
    p10: 12.0, p25: 13.0, p50: 14.5, p75: 16.0, p90: 18.0,
    source: "D2",
    note: "Denver II 扶持爬樓梯估計（大人扶持版本）；Denver II 獨自爬樓梯 p50=18.9m"
  },

  // ════════════════════════════════════════
  // 里程碑 7：18個月 (monthStart=16, 16–19m)
  // 粗動作：跑步、坐椅、扶欄梯、踢球
  // ════════════════════════════════════════

  "7_gross_0": {
    // 獨立行走穩定，可小跑步
    p10: 13.5, p25: 15.5, p50: 17.2, p75: 18.9, p90: 21.7,
    source: "D2",
    note: "Denver II 跑步（runs well）p25=15.5m, p50=17.2m, p75=18.9m, p90=21.7m；視窗跨度 8.2 個月"
  },
  "7_gross_1": {
    // 可坐在小椅子上
    p10: 13.0, p25: 14.0, p50: 15.5, p75: 17.0, p90: 19.0,
    source: "CLN",
    note: "臨床觀察估計；需要髖關節控制和平衡，通常在行走穩定後 2–3 個月出現"
  },
  "7_gross_2": {
    // 扶欄杆爬樓梯（雙腳同一階）
    p10: 14.0, p25: 15.5, p50: 17.0, p75: 19.0, p90: 21.5,
    source: "D2",
    note: "Denver II 扶欄杆上樓梯估計；介於扶持爬樓梯（13m）與獨立交替腳（24m+）之間"
  },
  "7_gross_3": {
    // 可踢靜止的球
    p10: 14.0, p25: 15.8, p50: 17.5, p75: 19.5, p90: 21.0,
    source: "D2",
    note: "Denver II 踢球（kicks ball forward）p25=15.8m, p50=17.5m, p75=19.5m, p90=21.0m"
  },

  // ════════════════════════════════════════
  // 里程碑 8：21個月 (monthStart=19, 19–22m)
  // 粗動作：跑步轉向、精準踢球、交替上樓、拋球
  // ════════════════════════════════════════

  "8_gross_0": {
    // 跑步更穩，可轉向
    p10: 16.0, p25: 17.5, p50: 19.5, p75: 21.5, p90: 24.0,
    source: "D2",
    note: "Denver II 跑步進階估計；由 runs well 延伸至方向控制"
  },
  "8_gross_1": {
    // 可踢靜止的球（較準確）
    p10: 16.0, p25: 17.5, p50: 19.0, p75: 21.0, p90: 23.0,
    source: "D2",
    note: "Denver II 踢球精準版延伸估計；需更好的動作計劃和腿部控制"
  },
  "8_gross_2": {
    // 扶手上樓梯（交替腳在發展中）
    p10: 16.0, p25: 17.0, p50: 18.9, p75: 21.7, p90: 24.0,
    source: "D2",
    note: "Denver II 走上樓梯（walks up steps）p25=17.0m, p50=18.9m, p75=21.7m, p90=24.0m"
  },
  "8_gross_3": {
    // 可拋球（雙手向前）
    p10: 15.0, p25: 16.5, p50: 18.5, p75: 21.0, p90: 23.5,
    source: "D2",
    note: "Denver II 過手投球（throws ball overhand）估計；p50 約 18–19 個月"
  },

  // ════════════════════════════════════════
  // 里程碑 9：24個月 (monthStart=22, 22–25m)
  // 粗動作：急停轉向、雙腳跳、上下樓梯、踢移動球
  // ════════════════════════════════════════

  "9_gross_0": {
    // 跑步穩定，可急停轉向
    p10: 18.0, p25: 19.5, p50: 21.5, p75: 23.5, p90: 26.0,
    source: "D2",
    note: "Denver II 跑步進階控制估計；急停和轉向需更成熟的動作計劃"
  },
  "9_gross_1": {
    // 可雙腳跳離地
    p10: 19.0, p25: 21.3, p50: 23.6, p75: 25.6, p90: 27.9,
    source: "D2",
    note: "Denver II 雙腳跳（jumps up）p25=21.3m, p50=23.6m, p75=25.6m, p90=27.9m"
  },
  "9_gross_2": {
    // 上下樓梯扶欄杆（雙腳同一階）
    p10: 18.0, p25: 20.0, p50: 22.0, p75: 24.0, p90: 26.5,
    source: "D2",
    note: "Denver II 上下樓梯扶欄杆估計；此為下樓梯（比上樓梯略難）"
  },
  "9_gross_3": {
    // 可踢移動中的球
    p10: 20.0, p25: 22.0, p50: 24.0, p75: 26.0, p90: 29.0,
    source: "CLN",
    note: "臨床觀察估計；移動目標踢球需更高動作預測能力，通常在 24 個月後發展"
  },
};

// ─────────────────────────────────────────
// 查詢函式
// ─────────────────────────────────────────

/**
 * 根據寶寶當前月齡，判斷在某個粗動作項目的百分位位置
 *
 * 邏輯說明：
 *   p10/p25/p50/p75/p90 = 10%/25%/50%/75%/90% 的同齡兒完成該動作的月齡
 *   若 ageInMonths < p10：寶寶比 90% 同齡兒更早達到，顯著超前
 *   若 ageInMonths > p90：寶寶比 90% 同齡兒更晚，建議持續觀察
 *
 * @param {string} itemKey - `{milestoneIdx}_gross_{itemIdx}`
 * @param {number} ageInMonths - 寶寶當前月齡（小數，例如 7.4）
 * @returns {{ position: string, pct: string } | null}
 */
export function getPercentilePosition(itemKey, ageInMonths) {
  const data = PERCENTILE_DATA[itemKey];
  if (!data) return null;

  if (ageInMonths < data.p10) return { position: 'far-ahead',       pct: '>P90' };
  if (ageInMonths < data.p25) return { position: 'ahead',           pct: 'P75–P90' };
  if (ageInMonths < data.p50) return { position: 'slightly-ahead',  pct: 'P50–P75' };
  if (ageInMonths < data.p75) return { position: 'normal',          pct: 'P25–P50' };
  if (ageInMonths < data.p90) return { position: 'slightly-behind', pct: 'P10–P25' };
  return { position: 'behind', pct: '<P10' };
}

/**
 * 百分位位置的中文標籤
 * @param {string} position
 * @returns {string}
 */
export function getPositionLabel(position) {
  const MAP = {
    'far-ahead':       '顯著超前（>P90）',
    'ahead':           '超前（P75–P90）',
    'slightly-ahead':  '稍超前（P50–P75）',
    'normal':          '正常範圍（P25–P50）',
    'slightly-behind': '稍落後（P10–P25）',
    'behind':          '需持續觀察（<P10）',
  };
  return MAP[position] || '';
}
