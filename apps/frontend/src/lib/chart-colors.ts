/**
 * チャート用カラーパレット
 *
 * 各カテゴリ（案件・間接作業・キャパシティ）の
 * デフォルトカラーを一元管理する。
 */

/** 案件表示用カラー（10色） */
export const PROJECT_TYPE_COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
	"#14b8a6",
	"#f97316",
	"#6366f1",
	"#84cc16",
] as const;

/** 間接作業用グレーパレット（5色：薄→濃） */
export const INDIRECT_COLORS = [
	"#d1d5db",
	"#9ca3af",
	"#6b7280",
	"#4b5563",
	"#374151",
] as const;

/** キャパシティライン用ウォームパレット（4色） */
export const CAPACITY_COLORS = [
	"#dc2626",
	"#ea580c",
	"#d97706",
	"#b91c1c",
] as const;

/** 未分類エリア用カラー */
export const UNCLASSIFIED_COLOR = "#e5e7eb";
