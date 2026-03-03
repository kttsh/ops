import { cn } from "@/lib/utils";

interface DetailRowProps {
	label: string;
	value: string;
	className?: string;
}

export function DetailRow({ label, value, className }: DetailRowProps) {
	return (
		<div className={cn("grid grid-cols-3 gap-4", className)}>
			<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
			<dd className="col-span-2 text-sm">{value}</dd>
		</div>
	);
}
