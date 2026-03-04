type FieldValidateFn<T> = (params: { value: T }) => string | undefined;

interface FieldValidators<T> {
	onChange: FieldValidateFn<T>;
	onBlur: FieldValidateFn<T>;
}

function validateDisplayOrder({
	value,
}: {
	value: number;
}): string | undefined {
	if (typeof value !== "number" || !Number.isInteger(value))
		return "表示順は整数で入力してください";
	if (value < 0) return "表示順は0以上で入力してください";
	return undefined;
}

/**
 * displayOrder フィールド用バリデータ
 * - 整数チェック: "表示順は整数で入力してください"
 * - 非負チェック: "表示順は0以上で入力してください"
 */
export const displayOrderValidators: FieldValidators<number> = {
	onChange: validateDisplayOrder,
	onBlur: validateDisplayOrder,
};
