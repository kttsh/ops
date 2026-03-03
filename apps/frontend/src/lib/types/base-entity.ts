/** ソフトデリート対応エンティティの共通タイムスタンプ */
export interface SoftDeletableEntity {
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
}

/** マスターデータエンティティの共通フィールド */
export interface MasterEntity extends SoftDeletableEntity {
	name: string;
	displayOrder: number;
}
