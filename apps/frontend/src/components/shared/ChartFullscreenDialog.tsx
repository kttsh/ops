import { Maximize2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ChartFullscreenDialogProps {
	/** Dialog に表示するタイトル */
	title?: string;
	/** フルスクリーン表示するチャートコンテンツ */
	children: React.ReactNode;
}

export function ChartFullscreenDialog({
	title,
	children,
}: ChartFullscreenDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				aria-label="グラフを全画面表示"
				onClick={() => setOpen(true)}
			>
				<Maximize2 className="h-4 w-4" />
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className="max-w-none w-[95vw] h-[90vh] flex flex-col"
					aria-label="全画面表示を閉じる"
				>
					{title && (
						<DialogHeader>
							<DialogTitle>{title}</DialogTitle>
						</DialogHeader>
					)}
					<div className="flex-1 min-h-0">{children}</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
