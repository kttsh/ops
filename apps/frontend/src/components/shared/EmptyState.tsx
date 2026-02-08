import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: ReactNode;
	title?: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({
	icon,
	title = "データがありません",
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-16 space-y-3",
				className,
			)}
		>
			<div className="text-muted-foreground">
				{icon ?? <Inbox className="h-12 w-12" />}
			</div>
			<p className="text-lg font-medium text-foreground">{title}</p>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}
