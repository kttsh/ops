import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
	title?: string;
	message?: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorState({
	title = "エラーが発生しました",
	message = "データの取得に失敗しました。再度お試しください。",
	onRetry,
	className,
}: ErrorStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-16 space-y-3",
				className,
			)}
		>
			<AlertCircle className="h-12 w-12 text-destructive" />
			<p className="text-lg font-medium text-foreground">{title}</p>
			<p className="text-sm text-muted-foreground">{message}</p>
			{onRetry && (
				<Button variant="outline" onClick={onRetry} className="mt-2">
					再試行
				</Button>
			)}
		</div>
	);
}
