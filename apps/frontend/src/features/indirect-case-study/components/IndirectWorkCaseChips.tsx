import { Loader2 } from "lucide-react";
import type { IndirectWorkCase } from "@/features/indirect-case-study/types";

interface IndirectWorkCaseChipsProps {
	cases: IndirectWorkCase[];
	selectedCaseId: number | null;
	onSelect: (caseId: number) => void;
	isLoading: boolean;
}

export function IndirectWorkCaseChips({
	cases,
	selectedCaseId,
	onSelect,
	isLoading,
}: IndirectWorkCaseChipsProps) {
	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-1">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				<span className="text-sm text-muted-foreground">
					ケース読み込み中...
				</span>
			</div>
		);
	}

	if (cases.length === 0) {
		return (
			<div className="py-1 text-sm text-muted-foreground">
				ケースがありません
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className="mr-1 text-xs font-medium text-muted-foreground">
				ケース
			</span>
			{cases.map((c) => {
				const selected = c.indirectWorkCaseId === selectedCaseId;
				return (
					<button
						key={c.indirectWorkCaseId}
						type="button"
						className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm ${
							selected
								? "border-primary bg-primary/10 text-primary"
								: "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						}`}
						onClick={() => onSelect(c.indirectWorkCaseId)}
					>
						{c.caseName}
						{c.isPrimary && (
							<span className="ml-1.5 rounded bg-primary/20 px-1 py-0.5 text-[10px] font-medium leading-none text-primary">
								主
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
