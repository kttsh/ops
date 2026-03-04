import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Upload } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";
import { Button } from "@/components/ui/button";
import type { ProjectCase } from "@/features/case-study";
import {
	ApiError,
	projectCaseQueryOptions,
	projectLoadsQueryOptions,
	useDeleteProjectCase,
} from "@/features/case-study";
import { useProjectLoadExcelExport } from "@/features/case-study/hooks/useProjectLoadExcelExport";
import { useProjectLoadExcelImport } from "@/features/case-study/hooks/useProjectLoadExcelImport";
import type { Project } from "@/features/projects";
import { CaseFormSheet } from "./CaseFormSheet";
import { CaseSidebar } from "./CaseSidebar";
import { generateMonthRange, WorkloadCard } from "./WorkloadCard";
import { WorkloadChart } from "./WorkloadChart";

interface CaseStudySectionProps {
	projectId: number;
	project: Project;
}

export function CaseStudySection({
	projectId,
	project,
}: CaseStudySectionProps) {
	// ケース選択状態
	const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

	// チャートデータ（編集中のリアルタイム反映用）
	const [chartData, setChartData] = useState<
		Array<{ yearMonth: string; manhour: number }>
	>([]);

	// フォーム Sheet 状態
	const [formSheet, setFormSheet] = useState<{
		open: boolean;
		mode: "create" | "edit";
		editCaseId: number | null;
	}>({ open: false, mode: "create", editCaseId: null });

	// 削除ダイアログ
	const [caseToDelete, setCaseToDelete] = useState<ProjectCase | null>(null);
	const deleteMutation = useDeleteProjectCase();

	// インポートダイアログ
	const [importDialogOpen, setImportDialogOpen] = useState(false);

	// Excel エクスポート
	const { exportToExcel, isExporting } = useProjectLoadExcelExport();

	// Excel インポート
	const { parseFile, confirmImport, isImporting } = useProjectLoadExcelImport({
		projectCaseId: selectedCaseId ?? 0,
	});

	// 選択ケースの詳細
	const { data: caseData } = useQuery({
		...projectCaseQueryOptions(projectId, selectedCaseId ?? 0),
		enabled: selectedCaseId != null && selectedCaseId > 0,
	});
	const selectedCase = caseData?.data ?? null;

	// 月別工数
	const { data: loadsData } = useQuery({
		...projectLoadsQueryOptions(selectedCaseId ?? 0),
		enabled: selectedCaseId != null && selectedCaseId > 0,
	});
	const projectLoads = loadsData?.data ?? [];

	// チャート用データ（編集中はeditedを使い、それ以外はAPIデータ）
	const displayChartData = useMemo(() => {
		if (chartData.length > 0) return chartData;
		return projectLoads.map((pl) => ({
			yearMonth: pl.yearMonth,
			manhour: pl.manhour,
		}));
	}, [chartData, projectLoads]);

	const handleWorkloadsChange = useCallback(
		(workloads: Array<{ yearMonth: string; manhour: number }>) => {
			setChartData(workloads);
		},
		[],
	);

	const handleSelectCase = useCallback((caseId: number) => {
		setSelectedCaseId(caseId);
		setChartData([]);
	}, []);

	const handleNewCase = useCallback(() => {
		setFormSheet({ open: true, mode: "create", editCaseId: null });
	}, []);

	const handleEditCase = useCallback((caseId: number) => {
		setFormSheet({ open: true, mode: "edit", editCaseId: caseId });
	}, []);

	const handleDeleteCase = useCallback((pc: ProjectCase) => {
		setCaseToDelete(pc);
	}, []);

	const handleConfirmDelete = async () => {
		if (!caseToDelete) return;
		try {
			await deleteMutation.mutateAsync({
				projectId,
				projectCaseId: caseToDelete.projectCaseId,
			});
			if (selectedCaseId === caseToDelete.projectCaseId) {
				setSelectedCaseId(null);
				setChartData([]);
			}
			setCaseToDelete(null);
		} catch (err) {
			if (err instanceof ApiError && err.problemDetails.status === 409) {
				toast.error("他のデータから参照されているため削除できません", {
					duration: Infinity,
				});
			}
			setCaseToDelete(null);
		}
	};

	const handleFormSuccess = useCallback(() => {
		setFormSheet({ open: false, mode: "create", editCaseId: null });
	}, []);

	// エクスポート用の年月範囲
	const yearMonths = useMemo(() => {
		if (!selectedCase) return [];
		return generateMonthRange(selectedCase, projectLoads);
	}, [selectedCase, projectLoads]);

	const handleExport = useCallback(async () => {
		if (!selectedCase) return;
		await exportToExcel({
			caseName: selectedCase.caseName,
			loads: projectLoads.map((pl) => ({
				yearMonth: pl.yearMonth,
				manhour: pl.manhour,
			})),
			yearMonths,
		});
	}, [selectedCase, projectLoads, yearMonths, exportToExcel]);

	return (
		<>
			<div className="rounded-3xl border overflow-hidden hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
				<div className="flex" style={{ minHeight: "400px" }}>
					{/* サイドバー */}
					<div className="w-64 shrink-0 border-r border-border overflow-y-auto p-3">
						<CaseSidebar
							projectId={projectId}
							selectedCaseId={selectedCaseId}
							onSelectCase={handleSelectCase}
							onNewCase={handleNewCase}
							onEditCase={handleEditCase}
							onDeleteCase={handleDeleteCase}
						/>
					</div>

					{/* メインエリア */}
					<div className="flex-1 overflow-y-auto p-6 space-y-6">
						{!selectedCase ? (
							<div className="flex h-full items-center justify-center">
								<p className="text-sm text-muted-foreground">
									ケースを選択してください
								</p>
							</div>
						) : (
							<>
								{/* Excel エクスポート・インポートボタン */}
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setImportDialogOpen(true)}
									>
										<Upload className="h-4 w-4" />
										インポート
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleExport}
										disabled={isExporting}
									>
										{isExporting ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Download className="h-4 w-4" />
										)}
										エクスポート
									</Button>
								</div>
								<WorkloadCard
									projectCase={selectedCase}
									projectLoads={projectLoads}
									onWorkloadsChange={handleWorkloadsChange}
								/>
								<WorkloadChart data={displayChartData} />
							</>
						)}
					</div>
				</div>
			</div>

			{/* ケース作成・編集 Sheet */}
			<CaseFormSheet
				open={formSheet.open}
				onOpenChange={(open) =>
					!open &&
					setFormSheet({ open: false, mode: "create", editCaseId: null })
				}
				mode={formSheet.mode}
				projectId={projectId}
				project={project}
				editCaseId={formSheet.editCaseId}
				onSuccess={handleFormSuccess}
			/>

			{/* 削除確認ダイアログ */}
			<DeleteConfirmDialog
				open={caseToDelete !== null}
				onOpenChange={(open) => !open && setCaseToDelete(null)}
				onConfirm={handleConfirmDelete}
				isDeleting={deleteMutation.isPending}
				entityLabel="ケース"
				entityName={caseToDelete?.caseName ?? ""}
			/>

			{/* Excel インポートダイアログ */}
			<ExcelImportDialog
				open={importDialogOpen}
				onOpenChange={setImportDialogOpen}
				title="案件工数インポート"
				description="Excel ファイルから案件工数データを一括インポートします。エクスポートしたファイルをそのまま使用できます。"
				onFileParsed={parseFile}
				onConfirm={confirmImport}
				isImporting={isImporting}
			/>
		</>
	);
}
