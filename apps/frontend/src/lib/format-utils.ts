/**
 * 日時文字列を ja-JP ロケールでフォーマットする
 * @param dateStr - ISO 8601 形式の日時文字列
 * @returns "yyyy/MM/dd HH:mm" 形式の文字列
 */
export function formatDateTime(dateStr: string): string {
	return new Date(dateStr).toLocaleString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}
