/**
 * TanStack Query staleTime 定数
 * データ更新頻度に応じたカテゴリ別キャッシュ時間
 */
export const STALE_TIMES = {
	/** 1分 — 頻繁に更新されるデータ */
	SHORT: 60_000,
	/** 2分 — 一覧/詳細クエリ */
	STANDARD: 120_000,
	/** 5分 — 関連データ/月次データ */
	MEDIUM: 300_000,
	/** 30分 — マスタデータ */
	LONG: 1_800_000,
} as const;
