import { Loader2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface CaseSelectProps<T> {
	/** 選択肢となるケース一覧 */
	items: T[];
	/** 現在の選択ID（0は未選択） */
	selectedId: number;
	/** 選択変更コールバック */
	onSelect: (id: number) => void;
	/** ケースからIDを取得する関数 */
	getId: (item: T) => number;
	/** ケースから表示名を取得する関数 */
	getLabel: (item: T) => string;
	/** ケースがプライマリかを判定する関数 */
	getIsPrimary: (item: T) => boolean;
	/** ケースが0件時のプレースホルダーテキスト */
	emptyLabel: string;
	/** ローディング中かどうか */
	isLoading?: boolean;
	/** 無効化 */
	disabled?: boolean;
}

export function CaseSelect<T>({
	items,
	selectedId,
	onSelect,
	getId,
	getLabel,
	getIsPrimary,
	emptyLabel,
	isLoading = false,
	disabled = false,
}: CaseSelectProps<T>) {
	const isEmpty = items.length === 0;
	const isDisabled = disabled || isEmpty || isLoading;

	if (isLoading) {
		return (
			<div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span>読み込み中...</span>
			</div>
		);
	}

	if (isEmpty) {
		return (
			<div className="flex h-10 items-center text-sm text-amber-600">
				{emptyLabel}
			</div>
		);
	}

	const selectedExists = items.some((item) => getId(item) === selectedId);
	const value = selectedExists ? String(selectedId) : undefined;

	return (
		<Select
			value={value}
			onValueChange={(val) => onSelect(Number(val))}
			disabled={isDisabled}
		>
			<SelectTrigger className="h-9">
				<SelectValue placeholder="選択してください" />
			</SelectTrigger>
			<SelectContent>
				{items.map((item) => {
					const id = getId(item);
					const label = getLabel(item);
					const isPrimary = getIsPrimary(item);
					return (
						<SelectItem key={id} value={String(id)}>
							{isPrimary ? `★ ${label}` : label}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
