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

interface DeleteConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	entityLabel: string;
	entityName: string;
	isDeleting: boolean;
}

export function DeleteConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	entityLabel,
	entityName,
	isDeleting,
}: DeleteConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{entityLabel}を削除しますか？</AlertDialogTitle>
					<AlertDialogDescription>
						「{entityName}
						」を削除します。この操作は論理削除のため、後から復元できます。
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						キャンセル
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isDeleting}
						className="bg-destructive text-white hover:bg-destructive/90"
					>
						{isDeleting ? "削除中..." : "削除"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
