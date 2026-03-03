import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NotFoundStateProps {
	entityName: string;
	backTo: string;
	backLabel?: string;
	className?: string;
}

export function NotFoundState({
	entityName,
	backTo,
	backLabel = "一覧に戻る",
	className,
}: NotFoundStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-16 space-y-4",
				className,
			)}
		>
			<p className="text-lg font-medium">
				{entityName}が見つかりません
			</p>
			<Link to={backTo} className="text-sm text-primary hover:underline">
				{backLabel}
			</Link>
		</div>
	);
}
