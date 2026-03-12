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

/** YY-MM → YYYYMM 変換（YY >= 70 → 19YY、YY < 70 → 20YY） */
export function convertShortYearMonthHeader(header: string): string | null {
	const match = header.trim().match(/^(\d{2})-(\d{2})$/);
	if (!match) return null;
	const yy = parseInt(match[1], 10);
	const century = yy >= 70 ? 19 : 20;
	const ym = `${century}${match[1]}${match[2]}`;
	return validateYearMonth(ym) ? ym : null;
}

/** YYYYMM → YY-MM 変換 */
export function formatShortYearMonth(ym: string): string {
	return `${ym.slice(2, 4)}-${ym.slice(4, 6)}`;
}

// ============================================================
// Bulk Export/Import Types
// ============================================================

/** 一括エクスポートシート設定（複数固定列対応） */
export interface BulkExportSheetConfig {
	sheetName: string;
	fixedHeaders: string[];
	yearMonths: string[];
	rows: BulkExportRow[];
}

export interface BulkExportRow {
	fixedValues: (string | number)[];
	monthlyValues: number[];
}

/** 一括インポートパース設定（複数固定列対応） */
export interface BulkImportParseConfig {
	fixedColumnCount: number;
	parseYearMonth: (header: string) => string | null;
	validateRow: (row: BulkImportRow, rowIndex: number) => ValidationError[];
}

export interface BulkImportRow {
	fixedValues: (string | number | null)[];
	monthlyValues: Map<string, number>;
}

export interface BulkImportParseResult {
	rows: BulkImportRow[];
	yearMonths: string[];
	errors: ValidationError[];
	warnings: ValidationError[];
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

/** 一括エクスポート用ワークブック生成（複数固定列 + 動的年月列） */
export async function buildBulkExportWorkbook(
	config: BulkExportSheetConfig,
): Promise<WorkBook> {
	const XLSX = await import("xlsx");

	const headerRow = [...config.fixedHeaders, ...config.yearMonths];
	const dataRows = config.rows.map((row) => [
		...row.fixedValues,
		...row.monthlyValues,
	]);

	const aoa = [headerRow, ...dataRows];
	const ws = XLSX.utils.aoa_to_sheet(aoa);

	ws["!cols"] = [
		...config.fixedHeaders.map((_, i) => ({ wch: i === 0 ? 12 : 20 })),
		...config.yearMonths.map(() => ({ wch: 12 })),
	];

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

		for (let colIdx = 1; colIdx < headers.length; colIdx++) {
			const header = headers[colIdx];
			if (!header || header.trim() === "") continue;

			const ym = config.parseYearMonth(header);
			if (ym === null || !yearMonths.includes(ym)) {
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
		}

		const importRow: ImportRow = { rowLabel, monthlyValues };

		// 行ごとのカスタムバリデーション
		const rowErrors = config.validateRow(importRow, rowIdx + 1);
		errors.push(...rowErrors);

		rows.push(importRow);
	}

	return { rows, yearMonths, errors };
}

// ============================================================
// Bulk Import functions (複数固定列対応)
// ============================================================

/** 一括インポート用パース（複数固定列 + 動的年月列 + 重複警告） */
export function parseBulkImportSheet(
	headers: string[],
	rawRows: (string | number | null)[][],
	config: BulkImportParseConfig,
): BulkImportParseResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];
	const rows: BulkImportRow[] = [];
	const yearMonths: string[] = [];

	// ヘッダー検証: 固定列 + 少なくとも1つの年月列が必要
	const minColumns = config.fixedColumnCount + 1;
	if (headers.length < minColumns) {
		errors.push({
			row: 0,
			field: "header",
			message: `ヘッダー行のフォーマットが不正です（最低${minColumns}列必要）`,
		});
		return { rows, yearMonths, errors, warnings };
	}

	// 年月ヘッダーの解析（固定列以降）
	const seenYearMonths = new Set<string>();
	for (
		let colIdx = config.fixedColumnCount;
		colIdx < headers.length;
		colIdx++
	) {
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

	// 重複キーコード検出用
	const keyCodeIndexMap = new Map<string | number, number>();

	// データ行の解析
	for (let rowIdx = 0; rowIdx < rawRows.length; rowIdx++) {
		const rawRow = rawRows[rowIdx];
		if (!rawRow || rawRow.length === 0) continue;

		const hasAnyValue = rawRow.some((cell) => cell != null && cell !== "");
		if (!hasAnyValue) continue;

		// 固定列の抽出
		const fixedValues: (string | number | null)[] = [];
		for (let i = 0; i < config.fixedColumnCount; i++) {
			const val = i < rawRow.length ? rawRow[i] : null;
			fixedValues.push(val != null ? val : null);
		}

		// 月別工数の抽出
		const monthlyValues = new Map<string, number>();
		for (
			let colIdx = config.fixedColumnCount;
			colIdx < headers.length;
			colIdx++
		) {
			const header = headers[colIdx];
			if (!header || header.trim() === "") continue;

			const ym = config.parseYearMonth(header);
			if (ym === null || !yearMonths.includes(ym)) continue;

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
						message: "数値以外の値です",
						value: rawValue as string | number,
					});
				} else if (!validateManhour(numValue)) {
					errors.push({
						row: rowIdx + 1,
						column: colIdx,
						field: "manhour",
						message: "工数は 0 以上 99,999,999 以下の整数で入力してください",
						value: numValue,
					});
				} else {
					monthlyValues.set(ym, numValue);
				}
			}
		}

		const importRow: BulkImportRow = { fixedValues, monthlyValues };

		// カスタム行バリデーション
		const rowErrors = config.validateRow(importRow, rowIdx + 1);
		errors.push(...rowErrors);

		// 重複キーコードの検出（あと勝ちマージ）
		const keyCode = fixedValues[0];
		if (keyCode != null) {
			const existingIdx = keyCodeIndexMap.get(keyCode);
			if (existingIdx !== undefined) {
				warnings.push({
					row: rowIdx + 1,
					field: "duplicate",
					message: `キーコード "${keyCode}" が重複しています（下の行の値で上書きされます）`,
					value: keyCode,
				});
				// あと勝ち: 既存行を上書き
				rows[existingIdx] = importRow;
			} else {
				keyCodeIndexMap.set(keyCode, rows.length);
				rows.push(importRow);
			}
		} else {
			rows.push(importRow);
		}
	}

	return { rows, yearMonths, errors, warnings };
}
