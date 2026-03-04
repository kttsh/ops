import type { WorkBook } from "xlsx";

// ============================================================
// Types
// ============================================================

/** エクスポートシート設定 */
export interface ExportSheetConfig {
	/** シート名 */
	sheetName: string;
	/** 最左列のヘッダーラベル（例: "ケース名", "BU名"） */
	rowHeaderLabel: string;
	/** 年月リスト（YYYY-MM 形式の表示用） */
	yearMonths: string[];
	/** 行データ: [行ラベル, ...月別値] */
	rows: ExportRow[];
}

export interface ExportRow {
	label: string;
	values: number[];
}

/** インポートパース設定 */
export interface ImportParseConfig {
	/** 最低限必要な列数 */
	minColumns: number;
	/** yearMonth の変換関数（ヘッダー文字列 → YYYYMM） */
	parseYearMonth: (header: string) => string | null;
	/** 行ごとのバリデーション */
	validateRow: (row: ImportRow, rowIndex: number) => ValidationError[];
}

export interface ImportRow {
	/** 最左列の値（案件名 or BU 名） */
	rowLabel: string;
	/** 年月ごとの値: Map<YYYYMM, number> */
	monthlyValues: Map<string, number>;
}

export interface ParseResult {
	rows: ImportRow[];
	yearMonths: string[];
	errors: ValidationError[];
}

export interface ValidationError {
	row: number;
	column?: number;
	field: string;
	message: string;
	value?: string | number;
}

// ============================================================
// Validation helpers
// ============================================================

/** manhour 範囲チェック（0 以上 99,999,999 以下） */
export function validateManhour(value: number): boolean {
	return (
		Number.isFinite(value) &&
		Number.isInteger(value) &&
		value >= 0 &&
		value <= 99_999_999
	);
}

/** yearMonth フォーマットチェック（YYYYMM 6桁） */
export function validateYearMonth(value: string): boolean {
	if (!/^\d{6}$/.test(value)) return false;
	const month = Number.parseInt(value.slice(4), 10);
	return month >= 1 && month <= 12;
}

/** YYYY-MM → YYYYMM 変換 */
export function convertYearMonthHeader(header: string): string | null {
	const match = header.trim().match(/^(\d{4})-(\d{2})$/);
	if (!match) return null;
	const ym = `${match[1]}${match[2]}`;
	return validateYearMonth(ym) ? ym : null;
}

// ============================================================
// Export functions
// ============================================================

/** ワークブック生成 */
export async function buildExportWorkbook(
	config: ExportSheetConfig,
): Promise<WorkBook> {
	const XLSX = await import("xlsx");

	// ヘッダー行: [rowHeaderLabel, ...yearMonths]
	const headerRow = [config.rowHeaderLabel, ...config.yearMonths];

	// データ行
	const dataRows = config.rows.map((row) => [row.label, ...row.values]);

	const aoa = [headerRow, ...dataRows];
	const ws = XLSX.utils.aoa_to_sheet(aoa);

	// カラム幅の設定
	ws["!cols"] = [{ wch: 20 }, ...config.yearMonths.map(() => ({ wch: 12 }))];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
	return wb;
}

/** Excel ファイルのダウンロード */
export async function downloadWorkbook(
	workbook: WorkBook,
	filename: string,
): Promise<void> {
	const XLSX = await import("xlsx");
	XLSX.writeFileXLSX(workbook, filename);
}

// ============================================================
// Import functions
// ============================================================

/** Excel ファイルの解析 */
export async function parseExcelFile(
	file: File,
): Promise<{ headers: string[]; rawRows: (string | number | null)[][] }> {
	// ファイル形式チェック
	const ext = file.name.split(".").pop()?.toLowerCase();
	if (ext !== "xlsx" && ext !== "xls") {
		throw new Error(".xlsx または .xls ファイルを選択してください");
	}

	const XLSX = await import("xlsx");
	const arrayBuffer = await file.arrayBuffer();
	const workbook = XLSX.read(arrayBuffer, { type: "array" });

	const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
	if (!firstSheet) {
		throw new Error("有効なデータが見つかりません");
	}

	const aoa: (string | number | null)[][] = XLSX.utils.sheet_to_json(
		firstSheet,
		{
			header: 1,
			defval: null,
		},
	);

	if (aoa.length === 0) {
		throw new Error("有効なデータが見つかりません");
	}

	const headers = aoa[0].map((cell) => (cell != null ? String(cell) : ""));
	const rawRows = aoa.slice(1);

	return { headers, rawRows };
}

/** パース結果のバリデーション付き変換 */
export function parseImportSheet(
	headers: string[],
	rawRows: (string | number | null)[][],
	config: ImportParseConfig,
): ParseResult {
	const errors: ValidationError[] = [];
	const rows: ImportRow[] = [];
	const yearMonths: string[] = [];

	// ヘッダーの年月列を解析（1列目はラベル列なのでスキップ）
	if (headers.length < config.minColumns) {
		errors.push({
			row: 0,
			field: "header",
			message: `ヘッダー行のフォーマットが不正です（最低${config.minColumns}列必要）`,
		});
		return { rows, yearMonths, errors };
	}

	// 年月の重複チェック用
	const seenYearMonths = new Set<string>();

	for (let colIdx = 1; colIdx < headers.length; colIdx++) {
		const header = headers[colIdx];
		if (!header || header.trim() === "") continue;

		const ym = config.parseYearMonth(header);
		if (ym === null) {
			errors.push({
				row: 0,
				column: colIdx,
				field: "yearMonth",
				message: `列ヘッダー "${header}" が不正なフォーマットです（YYYY-MM 形式で入力してください）`,
				value: header,
			});
			continue;
		}

		if (seenYearMonths.has(ym)) {
			errors.push({
				row: 0,
				column: colIdx,
				field: "yearMonth",
				message: `年月 "${header}" が重複しています`,
				value: header,
			});
			continue;
		}

		seenYearMonths.add(ym);
		yearMonths.push(ym);
	}

	// データ行の解析
	for (let rowIdx = 0; rowIdx < rawRows.length; rowIdx++) {
		const rawRow = rawRows[rowIdx];
		if (!rawRow || rawRow.length === 0) continue;

		// 空行スキップ（全セルが空）
		const hasAnyValue = rawRow.some((cell) => cell != null && cell !== "");
		if (!hasAnyValue) continue;

		const rowLabel = rawRow[0] != null ? String(rawRow[0]) : "";
		const monthlyValues = new Map<string, number>();

		let ymIndex = 0;
		for (let colIdx = 1; colIdx < headers.length; colIdx++) {
			const header = headers[colIdx];
			if (!header || header.trim() === "") continue;

			const ym = config.parseYearMonth(header);
			if (ym === null || !yearMonths.includes(ym)) {
				ymIndex++;
				continue;
			}

			const rawValue = colIdx < rawRow.length ? rawRow[colIdx] : null;

			if (rawValue == null || rawValue === "") {
				monthlyValues.set(ym, 0);
			} else {
				const numValue =
					typeof rawValue === "number" ? rawValue : Number(rawValue);
				if (Number.isNaN(numValue)) {
					errors.push({
						row: rowIdx + 1,
						column: colIdx,
						field: "manhour",
						message: `数値以外の値です`,
						value: rawValue as string | number,
					});
				} else if (!validateManhour(numValue)) {
					errors.push({
						row: rowIdx + 1,
						column: colIdx,
						field: "manhour",
						message: `工数は 0 以上 99,999,999 以下の整数で入力してください`,
						value: numValue,
					});
				} else {
					monthlyValues.set(ym, numValue);
				}
			}
			ymIndex++;
		}

		const importRow: ImportRow = { rowLabel, monthlyValues };

		// 行ごとのカスタムバリデーション
		const rowErrors = config.validateRow(importRow, rowIdx + 1);
		errors.push(...rowErrors);

		rows.push(importRow);
	}

	return { rows, yearMonths, errors };
}
