/**
 * 汎用フィールドマッパーユーティリティ
 *
 * DB Row（snake_case）から API Response（camelCase）への変換を
 * 宣言的なマッピング定義で行うファクトリ関数を提供する。
 */

/** 直接マッピング: Row のキー名を指定 */
type DirectMapping<TRow> = keyof TRow & string;

/** カスタム変換: Row の特定フィールドを変換関数で加工 */
interface TransformMapping<TRow, TKey extends keyof TRow, TValue> {
	field: TKey;
	transform: (value: TRow[TKey]) => TValue;
}

/** 計算フィールド: Row 全体から値を算出 */
interface ComputedMapping<TRow, TValue> {
	computed: (row: TRow) => TValue;
}

/** マッピングエントリの Union 型 */
type FieldMappingEntry<TRow, TValue> =
	| DirectMapping<TRow>
	| TransformMapping<TRow, keyof TRow, TValue>
	| ComputedMapping<TRow, TValue>;

/** マッピング定義全体: Response のすべてのキーを網羅 */
type FieldMapping<TRow, TResponse> = {
	[K in keyof TResponse]: FieldMappingEntry<TRow, TResponse[K]>;
};

function isTransformMapping<TRow, TValue>(
	entry: FieldMappingEntry<TRow, TValue>,
): entry is TransformMapping<TRow, keyof TRow, TValue> {
	return typeof entry === "object" && "field" in entry;
}

function isComputedMapping<TRow, TValue>(
	entry: FieldMappingEntry<TRow, TValue>,
): entry is ComputedMapping<TRow, TValue> {
	return typeof entry === "object" && "computed" in entry;
}

/**
 * マッピング定義から Row → Response 変換関数を生成する
 *
 * - DirectMapping: Row[key] の値を取得。Date なら .toISOString()、null/undefined なら null
 * - TransformMapping: transform 関数を適用
 * - ComputedMapping: computed 関数に Row 全体を渡す
 */
export function createFieldMapper<TRow, TResponse>(
	mapping: FieldMapping<TRow, TResponse>,
): (row: TRow) => TResponse {
	return (row: TRow): TResponse => {
		const result = {} as Record<string, unknown>;

		for (const [responseKey, entry] of Object.entries(mapping)) {
			if (
				isComputedMapping<TRow, unknown>(
					entry as FieldMappingEntry<TRow, unknown>,
				)
			) {
				result[responseKey] = (
					entry as ComputedMapping<TRow, unknown>
				).computed(row);
			} else if (
				isTransformMapping<TRow, unknown>(
					entry as FieldMappingEntry<TRow, unknown>,
				)
			) {
				const tm = entry as TransformMapping<TRow, keyof TRow, unknown>;
				result[responseKey] = tm.transform(row[tm.field]);
			} else {
				// DirectMapping: string key
				const rowKey = entry as string;
				const value = (row as Record<string, unknown>)[rowKey];

				if (value instanceof Date) {
					result[responseKey] = value.toISOString();
				} else if (value === null || value === undefined) {
					result[responseKey] = null;
				} else {
					result[responseKey] = value;
				}
			}
		}

		return result as TResponse;
	};
}
