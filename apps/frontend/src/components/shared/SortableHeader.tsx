import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableHeaderProps {
	column: {
		getIsSorted: () => false | "asc" | "desc";
		toggleSorting: (desc: boolean) => void;
	};
	label: string;
	className?: string;
}

export function SortableHeader({
	column,
	label,
	className = "-ml-3 h-8",
}: SortableHeaderProps) {
	const sorted = column.getIsSorted();

	return (
		<Button
			variant="ghost"
			size="sm"
			className={className}
			onClick={() => column.toggleSorting(sorted === "asc")}
		>
			{label}
			{sorted === "asc" ? (
				<ArrowUp className="ml-1 h-3 w-3" />
			) : sorted === "desc" ? (
				<ArrowDown className="ml-1 h-3 w-3" />
			) : (
				<ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
			)}
		</Button>
	);
}
