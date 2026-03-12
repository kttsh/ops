import { describe, expect, it } from "vitest";
import {
	type BulkExportSheetConfig,
	type BulkImportParseConfig,
	type BulkImportRow,
	buildBulkExportWorkbook,
	convertShortYearMonthHeader,
	formatShortYearMonth,
	parseBulkImportSheet,
} from "@/lib/excel-utils";

// ============================================================
// buildBulkExportWorkbook
// ============================================================

describe("buildBulkExportWorkbook", () => {
	it("固定列+動的年月列の正しいシート構成でワークブックを生成する", async () => {
		const config: BulkExportSheetConfig = {
			sheetName: "案件工数一括",
			fixedHeaders: ["キーコード", "案件名", "ケース名"],
			yearMonths: ["2026-04", "2026-05"],
			rows: [
				{
					fixedValues: [1, "プロジェクトA", "標準ケース"],
					monthlyValues: [100, 200],
				},
			],
		};

		const wb = await buildBulkExportWorkbook(config);

		expect(wb.SheetNames).toEqual(["案件工数一括"]);

		const XLSX = await import("xlsx");
		const ws = wb.Sheets.案件工数一括;
		const aoa: (string | number)[][] = XLSX.utils.sheet_to_json(ws, {
			header: 1,
		});

		// ヘッダー行
		expect(aoa[0]).toEqual([
			"キーコード",
			"案件名",
			"ケース名",
			"2026-04",
			"2026-05",
		]);
		// データ行
		expect(aoa[1]).toEqual([1, "プロジェクトA", "標準ケース", 100, 200]);
	});

	it("複数行のデータを正しく生成する", async () => {
		const config: BulkExportSheetConfig = {
			sheetName: "案件工数一括",
			fixedHeaders: ["キーコード", "案件名", "ケース名"],
			yearMonths: ["2026-04", "2026-05"],
			rows: [
				{
					fixedValues: [1, "プロジェクトA", "ケースA"],
					monthlyValues: [100, 200],
				},
				{
					fixedValues: [2, "プロジェクトB", "ケースB"],
					monthlyValues: [300, 400],
				},
			],
		};

		const wb = await buildBulkExportWorkbook(config);
		const XLSX = await import("xlsx");
		const ws = wb.Sheets.案件工数一括;
		const aoa: (string | number)[][] = XLSX.utils.sheet_to_json(ws, {
			header: 1,
		});

		expect(aoa).toHaveLength(3);
		expect(aoa[1]).toEqual([1, "プロジェクトA", "ケースA", 100, 200]);
		expect(aoa[2]).toEqual([2, "プロジェクトB", "ケースB", 300, 400]);
	});

	it("カラム幅が正しく設定される", async () => {
		const config: BulkExportSheetConfig = {
			sheetName: "テスト",
			fixedHeaders: ["キーコード", "案件名", "ケース名"],
			yearMonths: ["2026-04", "2026-05"],
			rows: [
				{
					fixedValues: [1, "A", "B"],
					monthlyValues: [100, 200],
				},
			],
		};

		const wb = await buildBulkExportWorkbook(config);
		const ws = wb.Sheets.テスト;

		expect(ws["!cols"]).toEqual([
			{ wch: 12 },
			{ wch: 20 },
			{ wch: 20 },
			{ wch: 12 },
			{ wch: 12 },
		]);
	});

	it("年月列が0件でも正しく生成する", async () => {
		const config: BulkExportSheetConfig = {
			sheetName: "テスト",
			fixedHeaders: ["キーコード", "案件名", "ケース名"],
			yearMonths: [],
			rows: [],
		};

		const wb = await buildBulkExportWorkbook(config);
		const XLSX = await import("xlsx");
		const ws = wb.Sheets.テスト;
		const aoa: (string | number)[][] = XLSX.utils.sheet_to_json(ws, {
			header: 1,
		});

		expect(aoa[0]).toEqual(["キーコード", "案件名", "ケース名"]);
	});
});

// ============================================================
// parseBulkImportSheet
// ============================================================

describe("parseBulkImportSheet", () => {
	const baseConfig: BulkImportParseConfig = {
		fixedColumnCount: 3,
		parseYearMonth: (header: string) => {
			const match = header.trim().match(/^(\d{4})-(\d{2})$/);
			if (!match) return null;
			const ym = `${match[1]}${match[2]}`;
			const month = Number.parseInt(ym.slice(4), 10);
			return month >= 1 && month <= 12 ? ym : null;
		},
		validateRow: () => [],
	};

	it("正常なデータを正しくパースする", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [
			[1, "プロジェクトA", "ケースA", 100, 200],
		];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.warnings).toHaveLength(0);
		expect(result.yearMonths).toEqual(["202604", "202605"]);
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].fixedValues).toEqual([1, "プロジェクトA", "ケースA"]);
		expect(result.rows[0].monthlyValues.get("202604")).toBe(100);
		expect(result.rows[0].monthlyValues.get("202605")).toBe(200);
	});

	it("ヘッダー列数が不足の場合エラーを返す", () => {
		const headers = ["キーコード", "案件名"];
		const rawRows: (string | number | null)[][] = [];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].row).toBe(0);
		expect(result.errors[0].field).toBe("header");
	});

	it("不正なフォーマットの年月ヘッダーにエラーを返す", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026/04", "2026-05"];
		const rawRows: (string | number | null)[][] = [[1, "A", "B", 100, 200]];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		expect(result.errors.some((e) => e.field === "yearMonth")).toBe(true);
		expect(result.yearMonths).toEqual(["202605"]);
	});

	it("重複する年月ヘッダーにエラーを返す", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026-04", "2026-04"];
		const rawRows: (string | number | null)[][] = [[1, "A", "B", 100, 200]];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		const dupError = result.errors.find((e) => e.message.includes("重複"));
		expect(dupError).toBeDefined();
	});

	it("manhour に数値以外の値がある場合エラーを返す", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026-04"];
		const rawRows: (string | number | null)[][] = [[1, "A", "B", "abc"]];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		expect(result.errors.some((e) => e.field === "manhour")).toBe(true);
	});

	it("manhour が範囲外の場合エラーを返す", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [
			[1, "A", "B", -1, 100_000_000],
		];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		const manhourErrors = result.errors.filter((e) => e.field === "manhour");
		expect(manhourErrors).toHaveLength(2);
	});

	it("空セルを 0 として扱う", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [[1, "A", "B", null, 200]];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.rows[0].monthlyValues.get("202604")).toBe(0);
		expect(result.rows[0].monthlyValues.get("202605")).toBe(200);
	});

	it("空行をスキップする", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026-04"];
		const rawRows: (string | number | null)[][] = [
			[1, "A", "B", 100],
			[null, null, null, null],
			[2, "C", "D", 200],
		];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		expect(result.rows).toHaveLength(2);
		expect(result.rows[0].fixedValues[0]).toBe(1);
		expect(result.rows[1].fixedValues[0]).toBe(2);
	});

	it("同一キーコードが複数行にある場合、あと勝ちでマージしwarningsを返す", () => {
		const headers = ["キーコード", "案件名", "ケース名", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [
			[1, "プロジェクトA", "ケースA", 100, 200],
			[1, "プロジェクトA", "ケースA", 300, 400],
		];

		const result = parseBulkImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.warnings[0].message).toContain("重複");
		// あと勝ち: 2行目の値が使われる
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].monthlyValues.get("202604")).toBe(300);
		expect(result.rows[0].monthlyValues.get("202605")).toBe(400);
	});

	it("カスタム行バリデーションのエラーを収集する", () => {
		const config: BulkImportParseConfig = {
			...baseConfig,
			validateRow: (row: BulkImportRow, rowIndex: number) => {
				if (row.fixedValues[0] == null) {
					return [
						{
							row: rowIndex,
							field: "keyCode",
							message: "キーコードは必須です",
						},
					];
				}
				return [];
			},
		};

		const headers = ["キーコード", "案件名", "ケース名", "2026-04"];
		const rawRows: (string | number | null)[][] = [[null, "A", "B", 100]];

		const result = parseBulkImportSheet(headers, rawRows, config);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].field).toBe("keyCode");
	});
});

// ============================================================
// ラウンドトリップ互換性テスト（一括エクスポート/インポート）
// ============================================================

describe("一括エクスポート/インポート ラウンドトリップ", () => {
	it("エクスポート → インポートで元データと一致する", async () => {
		const originalData = {
			yearMonths: ["202604", "202605", "202606"],
			rows: [
				{
					projectCaseId: 1,
					projectName: "プロジェクトA",
					caseName: "標準ケース",
					loads: [
						{ yearMonth: "202604", manhour: 1000 },
						{ yearMonth: "202605", manhour: 2000 },
						{ yearMonth: "202606", manhour: 3000 },
					],
				},
				{
					projectCaseId: 2,
					projectName: "プロジェクトB",
					caseName: "比較ケース",
					loads: [
						{ yearMonth: "202604", manhour: 500 },
						{ yearMonth: "202605", manhour: 600 },
						{ yearMonth: "202606", manhour: 700 },
					],
				},
			],
		};

		// エクスポート
		const displayYearMonths = originalData.yearMonths.map(
			(ym) => `${ym.slice(0, 4)}-${ym.slice(4, 6)}`,
		);

		const exportConfig: BulkExportSheetConfig = {
			sheetName: "案件工数一括",
			fixedHeaders: ["キーコード", "案件名", "ケース名"],
			yearMonths: displayYearMonths,
			rows: originalData.rows.map((r) => ({
				fixedValues: [r.projectCaseId, r.projectName, r.caseName],
				monthlyValues: displayYearMonths.map((_, i) => r.loads[i].manhour),
			})),
		};

		const wb = await buildBulkExportWorkbook(exportConfig);

		// ワークブックからパース用データを取り出す
		const XLSX = await import("xlsx");
		const ws = wb.Sheets[wb.SheetNames[0]];
		const aoa: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
			header: 1,
			defval: null,
		});

		const headers = aoa[0].map((cell) => (cell != null ? String(cell) : ""));
		const rawRows = aoa.slice(1);

		// インポート
		const importConfig: BulkImportParseConfig = {
			fixedColumnCount: 3,
			parseYearMonth: (header: string) => {
				const match = header.trim().match(/^(\d{4})-(\d{2})$/);
				if (!match) return null;
				const ym = `${match[1]}${match[2]}`;
				const month = Number.parseInt(ym.slice(4), 10);
				return month >= 1 && month <= 12 ? ym : null;
			},
			validateRow: () => [],
		};

		const result = parseBulkImportSheet(headers, rawRows, importConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.yearMonths).toEqual(originalData.yearMonths);
		expect(result.rows).toHaveLength(2);

		for (let i = 0; i < originalData.rows.length; i++) {
			const orig = originalData.rows[i];
			const parsed = result.rows[i];
			expect(parsed.fixedValues[0]).toBe(orig.projectCaseId);
			expect(parsed.fixedValues[1]).toBe(orig.projectName);
			expect(parsed.fixedValues[2]).toBe(orig.caseName);
			for (const load of orig.loads) {
				expect(parsed.monthlyValues.get(load.yearMonth)).toBe(load.manhour);
			}
		}
	});
});

// ============================================================
// 17固定列 ラウンドトリップ互換性テスト（Task 5.3）
// ============================================================

describe("17固定列 ラウンドトリップ", () => {
	it("エクスポート → インポートで 17 列フォーマットが正常動作すること", async () => {
		const originalData = {
			yearMonths: ["202604", "202605", "202606"],
			rows: [
				{
					projectCode: "PRJ-001",
					businessUnitCode: "BU-A",
					fiscalYear: 2026,
					projectTypeCode: "PT-001",
					name: "案件A",
					nickname: "略称A",
					customerName: "客先A",
					orderNumber: "ORD-001",
					startYearMonth: "202604",
					totalManhour: 5000,
					durationMonths: 12,
					calculationBasis: "根拠A",
					remarks: "備考A",
					region: "東北",
					projectCaseId: 1,
					caseName: "標準ケース",
					loads: [
						{ yearMonth: "202604", manhour: 1000 },
						{ yearMonth: "202605", manhour: 2000 },
						{ yearMonth: "202606", manhour: 3000 },
					],
				},
				{
					projectCode: "PRJ-002",
					businessUnitCode: "BU-B",
					fiscalYear: null,
					projectTypeCode: null,
					name: "案件B",
					nickname: null,
					customerName: null,
					orderNumber: null,
					startYearMonth: "202604",
					totalManhour: 3000,
					durationMonths: null,
					calculationBasis: null,
					remarks: null,
					region: null,
					projectCaseId: 2,
					caseName: "楽観ケース",
					loads: [
						{ yearMonth: "202604", manhour: 500 },
						{ yearMonth: "202605", manhour: 600 },
						{ yearMonth: "202606", manhour: 700 },
					],
				},
			],
		};

		// エクスポート: YYYYMM → YY-MM
		const displayYearMonths = originalData.yearMonths.map(formatShortYearMonth);

		const exportConfig: BulkExportSheetConfig = {
			sheetName: "案件工数一括",
			fixedHeaders: [
				"案件コード",
				"BU",
				"年度",
				"工事種別",
				"案件名",
				"通称・略称",
				"客先名",
				"オーダ",
				"開始時期",
				"案件工数",
				"月数",
				"算出根拠",
				"備考",
				"地域",
				"削除",
				"工数ケースNo",
				"工数ケース名",
			],
			yearMonths: displayYearMonths,
			rows: originalData.rows.map((r) => ({
				fixedValues: [
					r.projectCode,
					r.businessUnitCode,
					r.fiscalYear ?? "",
					r.projectTypeCode ?? "",
					r.name,
					r.nickname ?? "",
					r.customerName ?? "",
					r.orderNumber ?? "",
					r.startYearMonth,
					r.totalManhour,
					r.durationMonths ?? "",
					r.calculationBasis ?? "",
					r.remarks ?? "",
					r.region ?? "",
					"",
					r.projectCaseId,
					r.caseName,
				],
				monthlyValues: originalData.yearMonths.map(
					(ym) => r.loads.find((l) => l.yearMonth === ym)?.manhour ?? 0,
				),
			})),
		};

		const wb = await buildBulkExportWorkbook(exportConfig);

		// ワークブックからパース
		const XLSX = await import("xlsx");
		const ws = wb.Sheets[wb.SheetNames[0]];
		const aoa: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
			header: 1,
			defval: null,
		});

		const headers = aoa[0].map((cell) => (cell != null ? String(cell) : ""));
		const rawRows = aoa.slice(1);

		// インポート: YY-MM → YYYYMM
		const importConfig: BulkImportParseConfig = {
			fixedColumnCount: 17,
			parseYearMonth: convertShortYearMonthHeader,
			validateRow: () => [],
		};

		const result = parseBulkImportSheet(headers, rawRows, importConfig);

		// 検証
		expect(result.errors).toHaveLength(0);
		expect(result.yearMonths).toEqual(originalData.yearMonths);
		expect(result.rows).toHaveLength(2);

		// 1行目の検証
		const row1 = result.rows[0];
		expect(row1.fixedValues[0]).toBe("PRJ-001");
		expect(row1.fixedValues[1]).toBe("BU-A");
		expect(row1.fixedValues[2]).toBe(2026);
		expect(row1.fixedValues[3]).toBe("PT-001");
		expect(row1.fixedValues[4]).toBe("案件A");
		expect(row1.fixedValues[15]).toBe(1);
		expect(row1.fixedValues[16]).toBe("標準ケース");

		for (const load of originalData.rows[0].loads) {
			expect(row1.monthlyValues.get(load.yearMonth)).toBe(load.manhour);
		}

		// 2行目の検証（NULL フィールド）
		const row2 = result.rows[1];
		expect(row2.fixedValues[0]).toBe("PRJ-002");
		expect(row2.fixedValues[1]).toBe("BU-B");
		// fiscalYear: null → Excel では "" → パース後は ""
		// projectTypeCode: null → ""
	});

	it("複数 BU 混在データのインポートが正しく処理されること", () => {
		const headers = [
			"案件コード",
			"BU",
			"年度",
			"工事種別",
			"案件名",
			"通称・略称",
			"客先名",
			"オーダ",
			"開始時期",
			"案件工数",
			"月数",
			"算出根拠",
			"備考",
			"地域",
			"削除",
			"工数ケースNo",
			"工数ケース名",
			"26-04",
			"26-05",
		];
		const rawRows: (string | number | null)[][] = [
			[
				"PRJ-001",
				"BU-A",
				2026,
				"PT-001",
				"案件A",
				null,
				null,
				null,
				"202604",
				5000,
				12,
				null,
				null,
				null,
				null,
				1,
				"ケースA",
				1000,
				2000,
			],
			[
				"PRJ-002",
				"BU-B",
				2026,
				"PT-002",
				"案件B",
				null,
				null,
				null,
				"202604",
				3000,
				6,
				null,
				null,
				null,
				null,
				2,
				"ケースB",
				500,
				600,
			],
		];

		const config: BulkImportParseConfig = {
			fixedColumnCount: 17,
			parseYearMonth: convertShortYearMonthHeader,
			validateRow: () => [],
		};

		const result = parseBulkImportSheet(headers, rawRows, config);

		expect(result.errors).toHaveLength(0);
		expect(result.rows).toHaveLength(2);
		expect(result.rows[0].fixedValues[1]).toBe("BU-A");
		expect(result.rows[1].fixedValues[1]).toBe("BU-B");
	});

	it("案件コード空欄行 + 既存行の混在が正しく処理されること", () => {
		const headers = [
			"案件コード",
			"BU",
			"年度",
			"工事種別",
			"案件名",
			"通称・略称",
			"客先名",
			"オーダ",
			"開始時期",
			"案件工数",
			"月数",
			"算出根拠",
			"備考",
			"地域",
			"削除",
			"工数ケースNo",
			"工数ケース名",
			"26-04",
		];
		const rawRows: (string | number | null)[][] = [
			[
				"PRJ-001",
				"BU-A",
				2026,
				null,
				"既存案件",
				null,
				null,
				null,
				"202604",
				5000,
				null,
				null,
				null,
				null,
				null,
				1,
				"標準",
				1000,
			],
			[
				null,
				"BU-B",
				2026,
				null,
				"新規案件",
				null,
				null,
				null,
				"202604",
				3000,
				null,
				null,
				null,
				null,
				null,
				null,
				"新規ケース",
				500,
			],
		];

		const config: BulkImportParseConfig = {
			fixedColumnCount: 17,
			parseYearMonth: convertShortYearMonthHeader,
			validateRow: () => [],
		};

		const result = parseBulkImportSheet(headers, rawRows, config);

		expect(result.errors).toHaveLength(0);
		expect(result.rows).toHaveLength(2);
		// 既存行
		expect(result.rows[0].fixedValues[0]).toBe("PRJ-001");
		// 新規行（コード空欄）
		expect(result.rows[1].fixedValues[0]).toBeNull();
	});

	it("ソフトデリート指定行が正しく処理されること", () => {
		const headers = [
			"案件コード",
			"BU",
			"年度",
			"工事種別",
			"案件名",
			"通称・略称",
			"客先名",
			"オーダ",
			"開始時期",
			"案件工数",
			"月数",
			"算出根拠",
			"備考",
			"地域",
			"削除",
			"工数ケースNo",
			"工数ケース名",
			"26-04",
		];
		const rawRows: (string | number | null)[][] = [
			[
				"PRJ-001",
				"BU-A",
				2026,
				null,
				"案件A",
				null,
				null,
				null,
				"202604",
				5000,
				null,
				null,
				null,
				null,
				"1",
				1,
				"標準",
				1000,
			],
			[
				"PRJ-002",
				"BU-A",
				2026,
				null,
				"案件B",
				null,
				null,
				null,
				"202604",
				3000,
				null,
				null,
				null,
				null,
				"削除",
				2,
				"標準",
				500,
			],
		];

		const config: BulkImportParseConfig = {
			fixedColumnCount: 17,
			parseYearMonth: convertShortYearMonthHeader,
			validateRow: () => [],
		};

		const result = parseBulkImportSheet(headers, rawRows, config);

		expect(result.errors).toHaveLength(0);
		expect(result.rows).toHaveLength(2);
		// O列（index 14）の削除フラグ値を確認
		expect(result.rows[0].fixedValues[14]).toBe("1");
		expect(result.rows[1].fixedValues[14]).toBe("削除");
	});
});
