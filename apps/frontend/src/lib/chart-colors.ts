/**
 * チャート用カラーパレット
 *
 * 各カテゴリ（案件・間接作業・キャパシティ）の
 * デフォルトカラーを一元管理する。
 */

/** 案件表示用カラー（10色・淡いトーン） */
export const PROJECT_TYPE_COLORS = [
	"#B9DEFA",
	"#B7FFB7",
	"#FFFF99",
	"#FFB3B3",
	"#D4B8FF",
	"#FFB8D4",
	"#A8E8E0",
	"#FFD4A8",
	"#B8BBFF",
	"#D4F0A0",
] as const;

/** 間接作業用グレーパレット（5色：薄→濃） */
export const INDIRECT_COLORS = [
	"#d1d5db",
	"#9ca3af",
	"#6b7280",
	"#4b5563",
	"#374151",
] as const;

/** キャパシティライン用ウォームパレット（4色・柔らかいトーン） */
export const CAPACITY_COLORS = [
	"#E88888",
	"#F49E02",
	"#F0C060",
	"#D09090",
] as const;

/** 未分類エリア用カラー */
export const UNCLASSIFIED_COLOR = "#e5e7eb";
