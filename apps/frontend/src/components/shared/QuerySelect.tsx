import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export const EMPTY_SENTINEL = "__none__";

/** sentinel 値 "__none__" を空文字に変換する */
export function convertSentinelValue(value: string): string {
	return value === EMPTY_SENTINEL ? "" : value;
}

interface SelectOption {
	value: string;
	label: string;
}

interface QuerySelectProps {
	/** 現在の選択値 */
	value: string | undefined;
	/** 値変更コールバック */
	onValueChange: (value: string) => void;
	/** プレースホルダーテキスト */
	placeholder?: string;
	/** Select の id 属性 */
	id?: string;
	/** TanStack Query の結果から必要なフィールド */
	queryResult: {
		isLoading: boolean;
		isError: boolean;
		data: SelectOption[] | undefined;
		refetch: () => void;
	};
	/** 「未選択」オプションを先頭に追加（任意フィールド用） */
	allowEmpty?: boolean;
	/** 「未選択」時のラベル */
	emptyLabel?: string;
	/** 無効状態 */
	disabled?: boolean;
}

export function QuerySelect({
	value,
	onValueChange,
	placeholder,
	id,
	queryResult,
	allowEmpty,
	emptyLabel = "未選択",
	disabled,
}: QuerySelectProps) {
	if (queryResult.isLoading) {
		return (
			<div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				読み込み中...
			</div>
		);
	}

	if (queryResult.isError) {
		return (
			<div className="flex items-center gap-2 h-10">
				<p className="text-sm text-destructive">
					選択肢の取得に失敗しました
				</p>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => queryResult.refetch()}
				>
					再試行
				</Button>
			</div>
		);
	}

	return (
		<Select
			value={value || undefined}
			onValueChange={(v) => onValueChange(convertSentinelValue(v))}
			disabled={disabled}
		>
			<SelectTrigger id={id}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{allowEmpty && (
					<SelectItem value={EMPTY_SENTINEL}>{emptyLabel}</SelectItem>
				)}
				{queryResult.data?.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
