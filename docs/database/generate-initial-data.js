// generate-initial-data.js
// 初期データSQL生成スクリプト（本番試行用）
const fs = require('fs');
const path = require('path');

// ===== Data Definitions =====

const headcountPlan = {
  CO2:   { 2024: 225, 2025: 264, 2026: 312, 2027: 333, 2028: 350, 2029: 375, 2030: 400, 2031: 425, 2032: 450 },
  PLANT: { 2024: 140, 2025: 150, 2026: 160, 2027: 170, 2028: 175, 2029: 177, 2030: 180, 2031: 182, 2032: 185 },
  TRANS: { 2024: 158, 2025: 165, 2026: 175, 2027: 180, 2028: 185, 2029: 185, 2030: 185, 2031: 185, 2032: 185 },
};

const indirectRatios = {
  BUMON:    { 2024: 0.2000, 2025: 0.1750, 2026: 0.1500, 2027: 0.1500, 2028: 0.1500, 2029: 0.1500, 2030: 0.1500, 2031: 0.1500, 2032: 0.1500 },
  LABO:     { 2024: 0.1000, 2025: 0.0950, 2026: 0.0900, 2027: 0.0850, 2028: 0.0850, 2029: 0.0850, 2030: 0.0850, 2031: 0.0850, 2032: 0.0850 },
  ESTIMATE: { 2024: 0.0800, 2025: 0.0780, 2026: 0.0760, 2027: 0.0750, 2028: 0.0750, 2029: 0.0750, 2030: 0.0750, 2031: 0.0750, 2032: 0.0750 },
  OTHER:    { 2024: 0.0100, 2025: 0.0100, 2026: 0.0100, 2027: 0.0100, 2028: 0.0100, 2029: 0.0100, 2030: 0.0100, 2031: 0.0100, 2032: 0.0100 },
};

const capacityScenarios = [
  { id: 1, name: '標準シナリオ', is_primary: 1, description: '基準月160時間 × 稼働率80%のシナリオ', hours: 128.00 },
  { id: 2, name: '悲観シナリオ', is_primary: 0, description: '残業なし・稼働率低下を想定したシナリオ', hours: 110.00 },
  { id: 3, name: '楽観シナリオ', is_primary: 0, description: '残業込みの最大稼働シナリオ', hours: 162.00 },
];

// indirect_work_cases: BUコード → case_id
const indirectCaseMap = { PLANT: 1, TRANS: 2, CO2: 3 };
const buCodes = ['CO2', 'PLANT', 'TRANS'];
const fiscalYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032];
const workTypes = ['BUMON', 'LABO', 'ESTIMATE', 'OTHER'];

// ===== Helpers =====

function getYearMonth(fy, monthOffset) {
  let year, month;
  if (monthOffset < 9) { // Apr(0)..Dec(8)
    year = fy;
    month = 4 + monthOffset;
  } else { // Jan(9)..Mar(11)
    year = fy + 1;
    month = monthOffset - 8;
  }
  return `${year}${String(month).padStart(2, '0')}`;
}

function getFiscalYear(yearMonth) {
  const y = parseInt(yearMonth.slice(0, 4));
  const m = parseInt(yearMonth.slice(4, 6));
  return m >= 4 ? y : y - 1;
}

function getMonthlyHeadcounts(buCode) {
  const plan = headcountPlan[buCode];
  const result = [];
  for (let i = 0; i < fiscalYears.length; i++) {
    const fy = fiscalYears[i];
    const start = plan[fy];
    const end = i < fiscalYears.length - 1 ? plan[fiscalYears[i + 1]] : start;
    for (let mo = 0; mo < 12; mo++) {
      const yearMonth = getYearMonth(fy, mo);
      const headcount = Math.round(start + (end - start) * mo / 12);
      result.push({ yearMonth, headcount });
    }
  }
  return result;
}

function getTotalRatio(fy) {
  let total = 0;
  for (const wt of workTypes) {
    total += indirectRatios[wt][fy];
  }
  return total;
}

// ===== SQL Generation =====

const lines = [];
function w(s = '') { lines.push(s); }

w('-- =============================================================================');
w('-- OPS-NEXT 初期データ投入スクリプト（本番試行用）');
w('-- 対象: Microsoft SQL Server');
w('-- ');
w('-- seed-data.sql とは独立して実行可能');
w('-- 前提: マスタデータ (business_units, work_types) が存在すること');
w('-- =============================================================================');
w();
w('-- =============================================================================');
w('-- 0. 既存データ削除（子テーブルから順に削除）');
w('-- =============================================================================');
w();
w('-- チャートビュー関連（子テーブル）');
w('DELETE FROM chart_view_capacity_items;');
w('DELETE FROM chart_view_indirect_work_items;');
w();
w('-- 月次データ');
w('DELETE FROM monthly_headcount_plan;');
w('DELETE FROM monthly_capacity;');
w('DELETE FROM monthly_indirect_work_load;');
w();
w('-- 間接作業比率');
w('DELETE FROM indirect_work_type_ratios;');
w();
w('-- ケース・シナリオ');
w('DELETE FROM headcount_plan_cases;');
w('DELETE FROM indirect_work_cases;');
w('DELETE FROM capacity_scenarios;');
w();
w('-- IDENTITY列のリセット');
w("DBCC CHECKIDENT ('chart_view_capacity_items', RESEED, 0);");
w("DBCC CHECKIDENT ('chart_view_indirect_work_items', RESEED, 0);");
w("DBCC CHECKIDENT ('monthly_headcount_plan', RESEED, 0);");
w("DBCC CHECKIDENT ('monthly_capacity', RESEED, 0);");
w("DBCC CHECKIDENT ('monthly_indirect_work_load', RESEED, 0);");
w("DBCC CHECKIDENT ('indirect_work_type_ratios', RESEED, 0);");
w("DBCC CHECKIDENT ('headcount_plan_cases', RESEED, 0);");
w("DBCC CHECKIDENT ('indirect_work_cases', RESEED, 0);");
w("DBCC CHECKIDENT ('capacity_scenarios', RESEED, 0);");
w();
w('GO');
w();

// ===== 1. capacity_scenarios =====
w('-- =============================================================================');
w('-- 1. キャパシティシナリオ');
w('-- =============================================================================');
w('SET IDENTITY_INSERT capacity_scenarios ON;');
w();
w('INSERT INTO capacity_scenarios (capacity_scenario_id, scenario_name, is_primary, description, hours_per_person) VALUES');
const csLines = capacityScenarios.map(cs =>
  `(${cs.id}, N'${cs.name}', ${cs.is_primary}, N'${cs.description}', ${cs.hours.toFixed(2)})`
);
w(csLines.join(',\n') + ';');
w();
w('SET IDENTITY_INSERT capacity_scenarios OFF;');
w();
w('GO');
w();

// ===== 2. headcount_plan_cases =====
w('-- =============================================================================');
w('-- 2. 人員計画ケース');
w('-- =============================================================================');
w('SET IDENTITY_INSERT headcount_plan_cases ON;');
w();
w('INSERT INTO headcount_plan_cases (headcount_plan_case_id, case_name, is_primary, description, business_unit_code) VALUES');
w("(1, N'標準人員計画', 1, N'本番試行用の標準人員計画（2024〜2032年度）', NULL);");
w();
w('SET IDENTITY_INSERT headcount_plan_cases OFF;');
w();
w('GO');
w();

// ===== 3. monthly_headcount_plan =====
w('-- =============================================================================');
w('-- 3. 月次人員計画');
w('-- headcount_plan_case_id = 1 (標準人員計画)');
w('-- 各年度4月の人数から翌年度4月の人数に向けて線形補間');
w('-- =============================================================================');

for (const bu of buCodes) {
  const monthly = getMonthlyHeadcounts(bu);
  w();
  w(`-- ${bu}`);

  // Split by fiscal year for readability
  let currentFy = null;
  let batch = [];

  for (let i = 0; i < monthly.length; i++) {
    const { yearMonth, headcount } = monthly[i];
    const fy = getFiscalYear(yearMonth);

    if (currentFy !== null && currentFy !== fy) {
      // Flush batch
      w(`-- ${currentFy}年度 (${headcountPlan[bu][currentFy]}人 → ${headcountPlan[bu][currentFy + 1] || headcountPlan[bu][currentFy]}人)`);
      w('INSERT INTO monthly_headcount_plan (headcount_plan_case_id, business_unit_code, year_month, headcount) VALUES');
      w(batch.join(',\n') + ';');
      w();
      batch = [];
    }
    currentFy = fy;
    batch.push(`(1, '${bu}', '${yearMonth}', ${headcount})`);
  }
  // Flush last batch
  if (batch.length > 0) {
    w(`-- ${currentFy}年度 (${headcountPlan[bu][currentFy]}人、最終年度)`);
    w('INSERT INTO monthly_headcount_plan (headcount_plan_case_id, business_unit_code, year_month, headcount) VALUES');
    w(batch.join(',\n') + ';');
  }
}
w();
w('GO');
w();

// ===== 4. indirect_work_cases =====
w('-- =============================================================================');
w('-- 4. 間接作業ケース（BUごとに作成、全BU同一比率）');
w('-- =============================================================================');
w('SET IDENTITY_INSERT indirect_work_cases ON;');
w();
w('INSERT INTO indirect_work_cases (indirect_work_case_id, case_name, is_primary, description, business_unit_code) VALUES');
w("(1, N'標準間接比率', 1, N'本番試行用の標準間接比率（2024〜2032年度）', 'PLANT'),");
w("(2, N'標準間接比率', 1, N'本番試行用の標準間接比率（2024〜2032年度）', 'TRANS'),");
w("(3, N'標準間接比率', 1, N'本番試行用の標準間接比率（2024〜2032年度）', 'CO2');");
w();
w('SET IDENTITY_INSERT indirect_work_cases OFF;');
w();
w('GO');
w();

// ===== 5. indirect_work_type_ratios =====
w('-- =============================================================================');
w('-- 5. 間接作業種別比率');
w('-- ratio = 全作業に対する各間接作業の比率（個別%、合計100%制約なし）');
w('-- =============================================================================');

for (const bu of ['PLANT', 'TRANS', 'CO2']) {
  const caseId = indirectCaseMap[bu];
  w();
  w(`-- indirect_work_case_id = ${caseId} (${bu})`);
  w('INSERT INTO indirect_work_type_ratios (indirect_work_case_id, work_type_code, fiscal_year, ratio) VALUES');

  const rows = [];
  for (const fy of fiscalYears) {
    for (const wt of workTypes) {
      rows.push(`(${caseId}, '${wt}', ${fy}, ${indirectRatios[wt][fy].toFixed(4)})`);
    }
  }
  w(rows.join(',\n') + ';');
}
w();
w('GO');
w();

// ===== 6. monthly_capacity =====
w('-- =============================================================================');
w('-- 6. 月次キャパシティ');
w('-- capacity = headcount × hours_per_person');
w('-- =============================================================================');

for (const cs of capacityScenarios) {
  w();
  w(`-- capacity_scenario_id = ${cs.id} (${cs.name}: ${cs.hours}h/人月)`);

  for (const bu of buCodes) {
    const monthly = getMonthlyHeadcounts(bu);
    w(`-- ${bu}`);
    w('INSERT INTO monthly_capacity (capacity_scenario_id, business_unit_code, year_month, capacity) VALUES');

    const rows = monthly.map(({ yearMonth, headcount }) => {
      const capacity = (headcount * cs.hours).toFixed(2);
      return `(${cs.id}, '${bu}', '${yearMonth}', ${capacity})`;
    });
    w(rows.join(',\n') + ';');
    w();
  }
}
w();
w('GO');

// ===== 7. monthly_indirect_work_load =====
w('-- =============================================================================');
w('-- 7. 月次間接作業負荷');
w('-- manhour = headcount × 標準hours_per_person(128h)');
w('-- フロントエンドで manhour × ratio により種別ごとの工数を算出');
w('-- =============================================================================');

for (const bu of ['PLANT', 'TRANS', 'CO2']) {
  const caseId = indirectCaseMap[bu];
  const monthly = getMonthlyHeadcounts(bu);

  w();
  w(`-- indirect_work_case_id = ${caseId} (${bu})`);
  w("INSERT INTO monthly_indirect_work_load (indirect_work_case_id, business_unit_code, year_month, manhour, source) VALUES");

  const rows = monthly.map(({ yearMonth, headcount }) => {
    const manhour = (headcount * 128).toFixed(2);
    return `(${caseId}, '${bu}', '${yearMonth}', ${manhour}, 'calculated')`;
  });
  w(rows.join(',\n') + ';');
}

w();
w('GO');
w();
w('-- =============================================================================');
w('-- END');
w('-- =============================================================================');
w("PRINT N'初期データ投入完了';");
w('GO');

// Write to file
const outputPath = path.join(__dirname, 'initial-data.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`Generated: ${outputPath}`);
console.log(`Total lines: ${lines.length}`);
