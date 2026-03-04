import { AlertCircle, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ValidationError } from "@/lib/excel-utils";

// ============================================================
// Types
// ============================================================

export interface ImportPreviewData {
	/** プレビュー用ヘッダー（年月リスト） */
	headers: string[];
	/** プレビュー用行データ */
	rows: ImportPreviewRow[];
	/** バリデーションエラー */
	errors: ValidationError[];
	/** 総件数 */
	totalRecords: number;
}

export interface ImportPreviewRow {
	label: string;
	values: (number | null)[];
	/** この行にエラーがあるか */
	hasError: boolean;
}

export interface ExcelImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** ダイアログタイトル */
	title: string;
	/** ダイアログ説明文 */
	description: string;
	/** ファイル解析関数（feature hook から注入） */
	onFileParsed: (file: File) => Promise<ImportPreviewData>;
	/** インポート確定関数 */
	onConfirm: (data: ImportPreviewData) => Promise<void>;
	/** インポート中フラグ */
	isImporting: boolean;
}

type ImportDialogStep = "file-select" | "preview";

const MAX_PREVIEW_ROWS = 50;
const ACCEPTED_EXTENSIONS = ".xlsx,.xls";

// ============================================================
// Component
// ============================================================

export function ExcelImportDialog({
	open,
	onOpenChange,
	title,
	description,
	onFileParsed,
	onConfirm,
	isImporting,
}: ExcelImportDialogProps) {
	const [step, setStep] = useState<ImportDialogStep>("file-select");
	const [previewData, setPreviewData] = useState<ImportPreviewData | null>(
		null,
	);
	const [isParsing, setIsParsing] = useState(false);
	const [parseError, setParseError] = useState<string | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const resetState = useCallback(() => {
		setStep("file-select");
		setPreviewData(null);
		setIsParsing(false);
		setParseError(null);
		setIsDragOver(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, []);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				resetState();
			}
			onOpenChange(nextOpen);
		},
		[onOpenChange, resetState],
	);

	const processFile = useCallback(
		async (file: File) => {
			// ファイル形式チェック
			const ext = file.name.split(".").pop()?.toLowerCase();
			if (ext !== "xlsx" && ext !== "xls") {
				setParseError(".xlsx または .xls ファイルを選択してください");
				return;
			}

			setIsParsing(true);
			setParseError(null);

			try {
				const data = await onFileParsed(file);
				setPreviewData(data);
				setStep("preview");
			} catch (err) {
				setParseError(
					err instanceof Error
						? err.message
						: "ファイルの読み込みに失敗しました",
				);
			} finally {
				setIsParsing(false);
			}
		},
		[onFileParsed],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) processFile(file);
		},
		[processFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file) processFile(file);
		},
		[processFile],
	);

	const handleConfirm = useCallback(async () => {
		if (!previewData) return;
		await onConfirm(previewData);
		handleOpenChange(false);
	}, [previewData, onConfirm, handleOpenChange]);

	const handleBack = useCallback(() => {
		setStep("file-select");
		setPreviewData(null);
		setParseError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, []);

	const hasErrors = (previewData?.errors.length ?? 0) > 0;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{step === "file-select" && (
					<FileSelectStep
						isDragOver={isDragOver}
						isParsing={isParsing}
						parseError={parseError}
						fileInputRef={fileInputRef}
						onFileSelect={handleFileSelect}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					/>
				)}

				{step === "preview" && previewData && (
					<PreviewStep
						previewData={previewData}
						hasErrors={hasErrors}
						isImporting={isImporting}
						onBack={handleBack}
						onConfirm={handleConfirm}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ============================================================
// File Select Step
// ============================================================

function FileSelectStep({
	isDragOver,
	isParsing,
	parseError,
	fileInputRef,
	onFileSelect,
	onDragOver,
	onDragLeave,
	onDrop,
}: {
	isDragOver: boolean;
	isParsing: boolean;
	parseError: string | null;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
}) {
	return (
		<div className="flex-1 flex flex-col items-center justify-center py-8">
			<button
				type="button"
				className={`w-full border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-default ${
					isDragOver
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-muted-foreground/50"
				}`}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				onClick={() => fileInputRef.current?.click()}
			>
				{isParsing ? (
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
						<p className="text-sm text-muted-foreground">
							ファイルを解析しています...
						</p>
					</div>
				) : (
					<div className="flex flex-col items-center gap-3">
						<FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
						<div className="space-y-1">
							<p className="text-sm font-medium">
								Excel ファイルをドラッグ＆ドロップ
							</p>
							<p className="text-xs text-muted-foreground">
								または下のボタンからファイルを選択
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
						>
							<Upload className="h-4 w-4" />
							ファイルを選択
						</Button>
						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPTED_EXTENSIONS}
							onChange={onFileSelect}
							className="hidden"
						/>
						<p className="text-xs text-muted-foreground">
							対応形式: .xlsx, .xls
						</p>
					</div>
				)}
			</button>

			{parseError && (
				<div className="mt-4 flex items-center gap-2 text-sm text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<span>{parseError}</span>
				</div>
			)}
		</div>
	);
}

// ============================================================
// Preview Step
// ============================================================

function PreviewStep({
	previewData,
	hasErrors,
	isImporting,
	onBack,
	onConfirm,
}: {
	previewData: ImportPreviewData;
	hasErrors: boolean;
	isImporting: boolean;
	onBack: () => void;
	onConfirm: () => void;
}) {
	const { headers, rows, errors, totalRecords } = previewData;
	const displayRows = rows.slice(0, MAX_PREVIEW_ROWS);
	const hasMoreRows = rows.length > MAX_PREVIEW_ROWS;

	// 行番号→エラー一覧のマップ
	const errorsByRow = new Map<number, ValidationError[]>();
	for (const err of errors) {
		const list = errorsByRow.get(err.row) ?? [];
		list.push(err);
		errorsByRow.set(err.row, list);
	}

	// ヘッダーエラー
	const headerErrors = errors.filter((e) => e.row === 0);

	return (
		<div className="flex-1 flex flex-col gap-4 min-h-0">
			{/* サマリー */}
			<div className="flex items-center justify-between text-sm">
				<span className="text-muted-foreground">{totalRecords} 件のデータ</span>
				{hasErrors && (
					<span className="flex items-center gap-1 text-destructive">
						<AlertCircle className="h-4 w-4" />
						{errors.length} 件のエラー
					</span>
				)}
			</div>

			{/* ヘッダーエラー表示 */}
			{headerErrors.length > 0 && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
					<p className="text-sm font-medium text-destructive mb-1">
						ヘッダーエラー
					</p>
					{headerErrors.map((err, i) => (
						<p key={i} className="text-xs text-destructive">
							{err.message}
						</p>
					))}
				</div>
			)}

			{/* プレビューテーブル */}
			<div className="flex-1 overflow-auto border rounded-lg min-h-0">
				<TooltipProvider>
					<table className="w-full text-sm">
						<thead className="bg-muted/50 sticky top-0">
							<tr>
								<th className="text-left px-3 py-2 font-medium border-b whitespace-nowrap">
									#
								</th>
								<th className="text-left px-3 py-2 font-medium border-b whitespace-nowrap">
									ラベル
								</th>
								{headers.map((h) => (
									<th
										key={h}
										className="text-right px-3 py-2 font-medium border-b whitespace-nowrap"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{displayRows.map((row, rowIdx) => {
								const rowNum = rowIdx + 1;
								const rowErrs = errorsByRow.get(rowNum) ?? [];
								return (
									<tr
										key={rowIdx}
										className={
											row.hasError ? "bg-destructive/5" : "hover:bg-muted/30"
										}
									>
										<td className="px-3 py-1.5 border-b text-muted-foreground tabular-nums">
											{rowNum}
										</td>
										<td className="px-3 py-1.5 border-b whitespace-nowrap">
											{row.hasError && rowErrs.length > 0 ? (
												<Tooltip>
													<TooltipTrigger asChild>
														<span className="flex items-center gap-1 text-destructive">
															<AlertCircle className="h-3.5 w-3.5 shrink-0" />
															{row.label}
														</span>
													</TooltipTrigger>
													<TooltipContent side="right" className="max-w-xs">
														{rowErrs.map((err, i) => (
															<p key={i}>{err.message}</p>
														))}
													</TooltipContent>
												</Tooltip>
											) : (
												row.label
											)}
										</td>
										{row.values.map((val, colIdx) => {
											const cellErr = rowErrs.find(
												(e) => e.column === colIdx + 1,
											);
											return (
												<td
													key={colIdx}
													className={`px-3 py-1.5 border-b text-right tabular-nums ${
														cellErr ? "text-destructive font-medium" : ""
													}`}
												>
													{cellErr ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="cursor-help underline decoration-destructive decoration-dotted">
																	{val ?? 0}
																</span>
															</TooltipTrigger>
															<TooltipContent>
																<p>{cellErr.message}</p>
															</TooltipContent>
														</Tooltip>
													) : (
														(val ?? 0).toLocaleString()
													)}
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</TooltipProvider>
			</div>

			{hasMoreRows && (
				<p className="text-xs text-muted-foreground text-center">
					{MAX_PREVIEW_ROWS} 件まで表示しています（全 {rows.length} 件）
				</p>
			)}

			{/* フッター */}
			<DialogFooter>
				<Button variant="outline" onClick={onBack} disabled={isImporting}>
					戻る
				</Button>
				<Button onClick={onConfirm} disabled={hasErrors || isImporting}>
					{isImporting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							インポート中...
						</>
					) : (
						`${totalRecords} 件をインポート`
					)}
				</Button>
			</DialogFooter>
		</div>
	);
}
