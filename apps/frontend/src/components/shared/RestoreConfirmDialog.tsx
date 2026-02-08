import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RestoreConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	entityLabel: string;
	isLoading: boolean;
}

export function RestoreConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	entityLabel,
	isLoading,
}: RestoreConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{entityLabel}を復元しますか？</AlertDialogTitle>
					<AlertDialogDescription>
						削除済みの{entityLabel}
						を復元します。復元後は再びアクティブな状態になります。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>キャンセル</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isLoading}>
						{isLoading ? "復元中..." : "復元"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
