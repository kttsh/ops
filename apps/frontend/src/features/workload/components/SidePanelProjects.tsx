import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Check, Pencil, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { projectsQueryOptions } from "@/features/workload/api/queries";
import { ProjectEditSheet } from "@/features/workload/components/ProjectEditSheet";

interface SidePanelProjectsProps {
	businessUnitCodes: string[];
	selectedProjectIds: Set<number>;
	onSelectionChange: (ids: Set<number>) => void;
	selectedCaseIds: Map<number, number>;
	onCaseChange: (projectId: number, projectCaseId: number) => void;
}

type SortKey = "name" | "manhour" | "duration" | "start";

const collator = new Intl.Collator("ja-JP");

export function SidePanelProjects({
	businessUnitCodes,
	selectedProjectIds,
	onSelectionChange,
	selectedCaseIds,
	onCaseChange,
}: SidePanelProjectsProps) {
	const [searchText, setSearchText] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("name");
	const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

	const { data } = useQuery(projectsQueryOptions(businessUnitCodes));
	const projects = useMemo(() => data?.data ?? [], [data?.data]);

	const filtered = useMemo(() => {
		let result = projects;
		if (searchText.trim()) {
			const lower = searchText.toLowerCase();
			result = result.filter((p) =>
				(p.name ?? "").toLowerCase().includes(lower),
			);
		}

		result = [...result].sort((a, b) => {
			switch (sortKey) {
				case "name":
					return collator.compare(a.name ?? "", b.name ?? "");
				case "manhour":
					return (b.totalManhour ?? 0) - (a.totalManhour ?? 0);
				case "duration":
					return (b.durationMonths ?? 0) - (a.durationMonths ?? 0);
				case "start":
					return (a.startYearMonth ?? "").localeCompare(b.startYearMonth ?? "");
				default:
					return 0;
			}
		});

		return result;
	}, [projects, searchText, sortKey]);

	const toggleProject = useCallback(
		(id: number) => {
			const next = new Set(selectedProjectIds);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			onSelectionChange(next);
		},
		[selectedProjectIds, onSelectionChange],
	);

	const selectAll = useCallback(() => {
		onSelectionChange(new Set(projects.map((p) => p.projectId)));
	}, [projects, onSelectionChange]);

	const clearAll = useCallback(() => {
		onSelectionChange(new Set());
	}, [onSelectionChange]);

	return (
		<div className="space-y-3">
			{/* 検索 */}
			<div className="relative">
				<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
				<Input
					placeholder="案件名で検索..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					className="h-8 pl-8 text-sm"
				/>
			</div>

			{/* アクション */}
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					className="h-7 text-xs"
					onClick={selectAll}
				>
					全選択
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 text-xs"
					onClick={clearAll}
				>
					全解除
				</Button>
				<div className="ml-auto flex items-center gap-1">
					<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
					{(["name", "manhour", "duration", "start"] as SortKey[]).map(
						(key) => (
							<Button
								key={key}
								variant="ghost"
								size="sm"
								className={`h-6 px-2 text-xs ${sortKey === key ? "bg-accent" : ""}`}
								onClick={() => setSortKey(key)}
							>
								{
									{
										name: "名前",
										manhour: "工数",
										duration: "期間",
										start: "開始日",
									}[key]
								}
							</Button>
						),
					)}
				</div>
			</div>

			{/* 案件リスト */}
			<div className="space-y-1">
				{filtered.map((project) => {
					const selected = selectedProjectIds.has(project.projectId);
					return (
						<div
							key={project.projectId}
							className="rounded-lg border border-border bg-white p-3 text-sm transition-colors hover:bg-accent"
						>
							<div className="flex w-full items-start gap-3">
								<button
									type="button"
									className="flex flex-1 items-start gap-3 text-left"
									onClick={() => toggleProject(project.projectId)}
								>
									<div
										className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
											selected
												? "border-primary bg-primary text-primary-foreground"
												: "border-input"
										}`}
									>
										{selected && <Check className="h-3 w-3" />}
									</div>
									<div className="flex-1 min-w-0">
										<p className="truncate font-medium">{project.name}</p>
										<div className="mt-1.5 flex flex-wrap gap-1.5">
											{project.businessUnitName && (
												<Badge variant="secondary" className="text-xs">
													{project.businessUnitName}
												</Badge>
											)}
											{project.projectTypeName && (
												<Badge variant="outline" className="text-xs">
													{project.projectTypeName}
												</Badge>
											)}
										</div>
										<div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
											{project.startYearMonth && (
												<span>
													{project.startYearMonth.slice(0, 4)}/
													{project.startYearMonth.slice(4, 6)}
													{project.durationMonths != null &&
														` (${project.durationMonths}ヶ月)`}
												</span>
											)}
											{project.totalManhour != null && (
												<span>
													{project.totalManhour.toLocaleString("ja-JP")}H
												</span>
											)}
										</div>
									</div>
								</button>
								<button
									type="button"
									className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
									onClick={(e) => {
										e.stopPropagation();
										setEditingProjectId(project.projectId);
									}}
								>
									<Pencil className="h-3.5 w-3.5" />
								</button>
							</div>
							{/* ケースセレクタ: 選択中かつケースが2件以上の場合のみ表示 */}
							{selected && project.cases.length >= 2 && (
								<div className="mt-2 pl-7">
									<Select
										value={String(selectedCaseIds.get(project.projectId) ?? "")}
										onValueChange={(value) =>
											onCaseChange(project.projectId, Number(value))
										}
									>
										<SelectTrigger className="h-7 text-xs">
											<SelectValue placeholder="ケースを選択" />
										</SelectTrigger>
										<SelectContent>
											{project.cases.map((c) => (
												<SelectItem
													key={c.projectCaseId}
													value={String(c.projectCaseId)}
												>
													{c.caseName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>
					);
				})}
				{filtered.length === 0 && (
					<p className="py-4 text-center text-sm text-muted-foreground">
						案件が見つかりません
					</p>
				)}
			</div>

			<ProjectEditSheet
				projectId={editingProjectId}
				open={editingProjectId != null}
				onOpenChange={(open) => {
					if (!open) setEditingProjectId(null);
				}}
			/>
		</div>
	);
}
