import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
	isDeleted: boolean;
	activeLabel?: string;
	deletedLabel?: string;
}

export function StatusBadge({
	isDeleted,
	activeLabel = "アクティブ",
	deletedLabel = "削除済み",
}: StatusBadgeProps) {
	return isDeleted ? (
		<Badge variant="destructive">{deletedLabel}</Badge>
	) : (
		<Badge variant="success">{activeLabel}</Badge>
	);
}
