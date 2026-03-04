import { describe, expect, it } from "vitest";
import {
	buildExportWorkbook,
	convertYearMonthHeader,
	type ExportSheetConfig,
	type ImportParseConfig,
	type ImportRow,
	parseImportSheet,
	type ValidationError,
	validateManhour,
	validateYearMonth,
} from "@/lib/excel-utils";

// ============================================================
// validateManhour
// ============================================================

describe("validateManhour", () => {
	it("正常値: 0 を受け付ける", () => {
		expect(validateManhour(0)).toBe(true);
	});

	it("正常値: 99,999,999 を受け付ける", () => {
		expect(validateManhour(99_999_999)).toBe(true);
	});

	it("正常値: 中間の整数値を受け付ける", () => {
		expect(validateManhour(12345)).toBe(true);
	});

	it("異常値: -1 を拒否する", () => {
		expect(validateManhour(-1)).toBe(false);
	});

	it("異常値: 100,000,000 を拒否する", () => {
		expect(validateManhour(100_000_000)).toBe(false);
	});

	it("異常値: 小数値を拒否する", () => {
		expect(validateManhour(1.5)).toBe(false);
	});

	it("異常値: NaN を拒否する", () => {
		expect(validateManhour(Number.NaN)).toBe(false);
	});

	it("異常値: Infinity を拒否する", () => {
		expect(validateManhour(Number.POSITIVE_INFINITY)).toBe(false);
	});
});

// ============================================================
// validateYearMonth
// ============================================================

describe("validateYearMonth", () => {
	it("正常値: 202601 を受け付ける", () => {
		expect(validateYearMonth("202601")).toBe(true);
	});

	it("正常値: 202612 を受け付ける", () => {
		expect(validateYearMonth("202612")).toBe(true);
	});

	it("異常値: YYYY-MM 形式を拒否する", () => {
		expect(validateYearMonth("2026-01")).toBe(false);
	});

	it("異常値: 5桁を拒否する", () => {
		expect(validateYearMonth("20261")).toBe(false);
	});

	it("異常値: 7桁を拒否する", () => {
		expect(validateYearMonth("2026010")).toBe(false);
	});

	it("異常値: 月が00を拒否する", () => {
		expect(validateYearMonth("202600")).toBe(false);
	});

	it("異常値: 月が13を拒否する", () => {
		expect(validateYearMonth("202613")).toBe(false);
	});

	it("異常値: 英字を拒否する", () => {
		expect(validateYearMonth("abcdef")).toBe(false);
	});

	it("異常値: 空文字を拒否する", () => {
		expect(validateYearMonth("")).toBe(false);
	});
});

// ============================================================
// convertYearMonthHeader
// ============================================================

describe("convertYearMonthHeader", () => {
	it("正常: 2026-04 → 202604", () => {
		expect(convertYearMonthHeader("2026-04")).toBe("202604");
	});

	it("正常: 2026-12 → 202612", () => {
		expect(convertYearMonthHeader("2026-12")).toBe("202612");
	});

	it("正常: 前後のスペースをトリムする", () => {
		expect(convertYearMonthHeader("  2026-04  ")).toBe("202604");
	});

	it("異常: YYYYMM 形式は null", () => {
		expect(convertYearMonthHeader("202604")).toBeNull();
	});

	it("異常: YYYY/MM 形式は null", () => {
		expect(convertYearMonthHeader("2026/04")).toBeNull();
	});

	it("異常: 月が13の場合は null", () => {
		expect(convertYearMonthHeader("2026-13")).toBeNull();
	});

	it("異常: 月が00の場合は null", () => {
		expect(convertYearMonthHeader("2026-00")).toBeNull();
	});

	it("異常: 空文字は null", () => {
		expect(convertYearMonthHeader("")).toBeNull();
	});

	it("異常: テキスト文字列は null", () => {
		expect(convertYearMonthHeader("abc")).toBeNull();
	});
});

// ============================================================
// buildExportWorkbook
// ============================================================

describe("buildExportWorkbook", () => {
	it("正しいシート構造でワークブックを生成する", async () => {
		const config: ExportSheetConfig = {
			sheetName: "案件工数",
			rowHeaderLabel: "ケース名",
			yearMonths: ["2026-04", "2026-05", "2026-06"],
			rows: [{ label: "Case A", values: [100, 200, 300] }],
		};

		const wb = await buildExportWorkbook(config);

		// シート名
		expect(wb.SheetNames).toEqual(["案件工数"]);

		// シートのデータ
		const XLSX = await import("xlsx");
		const ws = wb.Sheets["案件工数"];
		const aoa: (string | number)[][] = XLSX.utils.sheet_to_json(ws, {
			header: 1,
		});

		// ヘッダー行
		expect(aoa[0]).toEqual(["ケース名", "2026-04", "2026-05", "2026-06"]);
		// データ行
		expect(aoa[1]).toEqual(["Case A", 100, 200, 300]);
	});

	it("複数行のデータを正しく生成する", async () => {
		const config: ExportSheetConfig = {
			sheetName: "間接工数",
			rowHeaderLabel: "BU名",
			yearMonths: ["2026-04", "2026-05"],
			rows: [
				{ label: "設計部", values: [500, 600] },
				{ label: "製造部", values: [800, 700] },
			],
		};

		const wb = await buildExportWorkbook(config);
		const XLSX = await import("xlsx");
		const ws = wb.Sheets["間接工数"];
		const aoa: (string | number)[][] = XLSX.utils.sheet_to_json(ws, {
			header: 1,
		});

		expect(aoa).toHaveLength(3); // ヘッダー + 2データ行
		expect(aoa[0]).toEqual(["BU名", "2026-04", "2026-05"]);
		expect(aoa[1]).toEqual(["設計部", 500, 600]);
		expect(aoa[2]).toEqual(["製造部", 800, 700]);
	});

	it("カラム幅が正しく設定される", async () => {
		const config: ExportSheetConfig = {
			sheetName: "テスト",
			rowHeaderLabel: "ラベル",
			yearMonths: ["2026-04", "2026-05"],
			rows: [{ label: "Row1", values: [1, 2] }],
		};

		const wb = await buildExportWorkbook(config);
		const ws = wb.Sheets["テスト"];

		expect(ws["!cols"]).toEqual([{ wch: 20 }, { wch: 12 }, { wch: 12 }]);
	});
});

// ============================================================
// parseImportSheet
// ============================================================

describe("parseImportSheet", () => {
	const baseConfig: ImportParseConfig = {
		minColumns: 2,
		parseYearMonth: convertYearMonthHeader,
		validateRow: (): ValidationError[] => [],
	};

	it("正常なデータを正しくパースする", () => {
		const headers = ["ケース名", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [["Case A", 100, 200]];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.yearMonths).toEqual(["202604", "202605"]);
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].rowLabel).toBe("Case A");
		expect(result.rows[0].monthlyValues.get("202604")).toBe(100);
		expect(result.rows[0].monthlyValues.get("202605")).toBe(200);
	});

	it("空セルを 0 として扱う", () => {
		const headers = ["ラベル", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [["Row1", null, 200]];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.rows[0].monthlyValues.get("202604")).toBe(0);
		expect(result.rows[0].monthlyValues.get("202605")).toBe(200);
	});

	it("ヘッダー列数が不足の場合エラーを返す", () => {
		const headers = ["ラベル"];
		const rawRows: (string | number | null)[][] = [];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].row).toBe(0);
		expect(result.errors[0].field).toBe("header");
	});

	it("不正なフォーマットの年月ヘッダーにエラーを返す", () => {
		const headers = ["ラベル", "2026/04", "2026-05"];
		const rawRows: (string | number | null)[][] = [["Row1", 100, 200]];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.errors.some((e) => e.field === "yearMonth")).toBe(true);
		// 有効な年月は 202605 のみ
		expect(result.yearMonths).toEqual(["202605"]);
	});

	it("重複する年月ヘッダーにエラーを返す", () => {
		const headers = ["ラベル", "2026-04", "2026-04"];
		const rawRows: (string | number | null)[][] = [["Row1", 100, 200]];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		const dupError = result.errors.find((e) => e.message.includes("重複"));
		expect(dupError).toBeDefined();
	});

	it("manhour に数値以外の値がある場合エラーを返す", () => {
		const headers = ["ラベル", "2026-04"];
		const rawRows: (string | number | null)[][] = [["Row1", "abc"]];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.errors.some((e) => e.field === "manhour")).toBe(true);
	});

	it("manhour が範囲外の場合エラーを返す", () => {
		const headers = ["ラベル", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [["Row1", -1, 100_000_000]];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		const manhourErrors = result.errors.filter((e) => e.field === "manhour");
		expect(manhourErrors).toHaveLength(2);
	});

	it("空行をスキップする", () => {
		const headers = ["ラベル", "2026-04"];
		const rawRows: (string | number | null)[][] = [
			["Row1", 100],
			[null, null],
			["Row2", 200],
		];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.rows).toHaveLength(2);
		expect(result.rows[0].rowLabel).toBe("Row1");
		expect(result.rows[1].rowLabel).toBe("Row2");
	});

	it("複数行のデータを正しくパースする", () => {
		const headers = ["BU名", "2026-04", "2026-05"];
		const rawRows: (string | number | null)[][] = [
			["設計部", 500, 600],
			["製造部", 800, 700],
		];

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.rows).toHaveLength(2);
		expect(result.rows[0].rowLabel).toBe("設計部");
		expect(result.rows[1].rowLabel).toBe("製造部");
	});

	it("カスタム行バリデーションのエラーを収集する", () => {
		const config: ImportParseConfig = {
			...baseConfig,
			validateRow: (row: ImportRow, rowIndex: number): ValidationError[] => {
				if (row.rowLabel === "不明部") {
					return [
						{
							row: rowIndex,
							field: "businessUnitName",
							message: `BU名 "${row.rowLabel}" が見つかりません`,
						},
					];
				}
				return [];
			},
		};

		const headers = ["BU名", "2026-04"];
		const rawRows: (string | number | null)[][] = [
			["設計部", 100],
			["不明部", 200],
		];

		const result = parseImportSheet(headers, rawRows, config);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].field).toBe("businessUnitName");
		expect(result.errors[0].row).toBe(2);
	});

	it("100行以上の大量データを正常にパースする", () => {
		const headers = ["ラベル", "2026-04", "2026-05", "2026-06"];
		const rawRows: (string | number | null)[][] = Array.from(
			{ length: 150 },
			(_, i) => [`Row${i + 1}`, i * 10, i * 20, i * 30],
		);

		const result = parseImportSheet(headers, rawRows, baseConfig);

		expect(result.errors).toHaveLength(0);
		expect(result.rows).toHaveLength(150);
	});
});

// ============================================================
// ラウンドトリップ互換性テスト (Task 7.2)
// ============================================================

describe("ラウンドトリップ互換性", () => {
	describe("案件工数", () => {
		it("エクスポート → インポートで元データと一致する", async () => {
			// 元データ
			const originalData = {
				caseName: "Case A",
				yearMonths: ["202604", "202605", "202606"],
				loads: [
					{ yearMonth: "202604", manhour: 100 },
					{ yearMonth: "202605", manhour: 200 },
					{ yearMonth: "202606", manhour: 300 },
				],
			};

			// エクスポート
			const config: ExportSheetConfig = {
				sheetName: "案件工数",
				rowHeaderLabel: "ケース名",
				yearMonths: originalData.yearMonths.map(
					(ym) => `${ym.slice(0, 4)}-${ym.slice(4, 6)}`,
				),
				rows: [
					{
						label: originalData.caseName,
						values: originalData.loads.map((l) => l.manhour),
					},
				],
			};

			const wb = await buildExportWorkbook(config);

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
			const parseConfig: ImportParseConfig = {
				minColumns: 2,
				parseYearMonth: convertYearMonthHeader,
				validateRow: (): ValidationError[] => [],
			};

			const result = parseImportSheet(headers, rawRows, parseConfig);

			// 検証
			expect(result.errors).toHaveLength(0);
			expect(result.yearMonths).toEqual(originalData.yearMonths);
			expect(result.rows).toHaveLength(1);
			expect(result.rows[0].rowLabel).toBe(originalData.caseName);

			for (const load of originalData.loads) {
				expect(result.rows[0].monthlyValues.get(load.yearMonth)).toBe(
					load.manhour,
				);
			}
		});
	});

	describe("間接工数", () => {
		it("複数BUのエクスポート → インポートで元データと一致する", async () => {
			// 元データ
			const originalData = {
				yearMonths: ["202604", "202605", "202606"],
				businessUnits: [
					{
						name: "設計部",
						code: "BU001",
						loads: [
							{ yearMonth: "202604", manhour: 500 },
							{ yearMonth: "202605", manhour: 600 },
							{ yearMonth: "202606", manhour: 550 },
						],
					},
					{
						name: "製造部",
						code: "BU002",
						loads: [
							{ yearMonth: "202604", manhour: 800 },
							{ yearMonth: "202605", manhour: 700 },
							{ yearMonth: "202606", manhour: 750 },
						],
					},
				],
			};

			// エクスポート
			const config: ExportSheetConfig = {
				sheetName: "間接工数",
				rowHeaderLabel: "BU名",
				yearMonths: originalData.yearMonths.map(
					(ym) => `${ym.slice(0, 4)}-${ym.slice(4, 6)}`,
				),
				rows: originalData.businessUnits.map((bu) => ({
					label: bu.name,
					values: bu.loads.map((l) => l.manhour),
				})),
			};

			const wb = await buildExportWorkbook(config);

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
			const buNameToCode = new Map(
				originalData.businessUnits.map((bu) => [bu.name, bu.code]),
			);

			const parseConfig: ImportParseConfig = {
				minColumns: 2,
				parseYearMonth: convertYearMonthHeader,
				validateRow: (row: ImportRow, rowIndex: number): ValidationError[] => {
					if (!buNameToCode.has(row.rowLabel)) {
						return [
							{
								row: rowIndex,
								field: "businessUnitName",
								message: `BU名 "${row.rowLabel}" が見つかりません`,
							},
						];
					}
					return [];
				},
			};

			const result = parseImportSheet(headers, rawRows, parseConfig);

			// 検証
			expect(result.errors).toHaveLength(0);
			expect(result.yearMonths).toEqual(originalData.yearMonths);
			expect(result.rows).toHaveLength(2);

			for (let i = 0; i < originalData.businessUnits.length; i++) {
				const bu = originalData.businessUnits[i];
				const row = result.rows[i];
				expect(row.rowLabel).toBe(bu.name);

				for (const load of bu.loads) {
					expect(row.monthlyValues.get(load.yearMonth)).toBe(load.manhour);
				}
			}
		});
	});

	describe("エッジケース", () => {
		it("ゼロ値がラウンドトリップで保持される", async () => {
			const config: ExportSheetConfig = {
				sheetName: "テスト",
				rowHeaderLabel: "ラベル",
				yearMonths: ["2026-04", "2026-05"],
				rows: [{ label: "Row1", values: [0, 0] }],
			};

			const wb = await buildExportWorkbook(config);

			const XLSX = await import("xlsx");
			const ws = wb.Sheets[wb.SheetNames[0]];
			const aoa: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
				header: 1,
				defval: null,
			});

			const headers = aoa[0].map((cell) => (cell != null ? String(cell) : ""));
			const rawRows = aoa.slice(1);

			const parseConfig: ImportParseConfig = {
				minColumns: 2,
				parseYearMonth: convertYearMonthHeader,
				validateRow: (): ValidationError[] => [],
			};

			const result = parseImportSheet(headers, rawRows, parseConfig);

			expect(result.errors).toHaveLength(0);
			expect(result.rows[0].monthlyValues.get("202604")).toBe(0);
			expect(result.rows[0].monthlyValues.get("202605")).toBe(0);
		});

		it("YYYY-MM ヘッダーが正しく YYYYMM に変換される", async () => {
			const config: ExportSheetConfig = {
				sheetName: "テスト",
				rowHeaderLabel: "ラベル",
				yearMonths: ["2026-01", "2026-12"],
				rows: [{ label: "Row1", values: [10, 20] }],
			};

			const wb = await buildExportWorkbook(config);

			const XLSX = await import("xlsx");
			const ws = wb.Sheets[wb.SheetNames[0]];
			const aoa: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
				header: 1,
				defval: null,
			});

			const headers = aoa[0].map((cell) => (cell != null ? String(cell) : ""));

			expect(headers[1]).toBe("2026-01");
			expect(headers[2]).toBe("2026-12");

			const rawRows = aoa.slice(1);
			const parseConfig: ImportParseConfig = {
				minColumns: 2,
				parseYearMonth: convertYearMonthHeader,
				validateRow: (): ValidationError[] => [],
			};

			const result = parseImportSheet(headers, rawRows, parseConfig);

			expect(result.yearMonths).toEqual(["202601", "202612"]);
		});
	});
});
