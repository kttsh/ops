import { BarChart3, LayoutDashboard, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
	value: "chart" | "table" | "both";
	onChange: (value: "chart" | "table" | "both") => void;
}

const options = [
	{ value: "chart" as const, label: "チャート", icon: BarChart3 },
	{ value: "table" as const, label: "テーブル", icon: Table2 },
	{ value: "both" as const, label: "両方", icon: LayoutDashboard },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
	return (
		<div className="inline-flex rounded-lg border border-input bg-input-bg p-0.5">
			{options.map((opt) => (
				<Button
					key={opt.value}
					variant="ghost"
					size="sm"
					className={cn(
						"h-7 gap-1.5 rounded-md px-3 text-xs",
						value === opt.value && "bg-accent text-accent-foreground shadow-sm",
					)}
					onClick={() => onChange(opt.value)}
				>
					<opt.icon className="h-3.5 w-3.5" />
					{opt.label}
				</Button>
			))}
		</div>
	);
}
