import type { AnyFieldApi } from "@tanstack/react-form";
import type React from "react";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { Input } from "@/components/ui/input";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

interface FormTextFieldProps {
	/** TanStack Form の field オブジェクト（form.Field render prop から取得） */
	field: AnyFieldApi;
	/** フィールドラベル */
	label: string;
	/** 必須マーク表示 */
	required?: boolean;
	/** プレースホルダー */
	placeholder?: string;
	/** 無効状態 */
	disabled?: boolean;
	/** Input の type 属性 */
	type?: "text" | "number" | "decimal";
	/** Label 横のカスタムコンテンツ */
	labelSuffix?: React.ReactNode;
	/** Input の追加属性（min, max, step, maxLength 等） */
	inputProps?: React.ComponentPropsWithoutRef<typeof Input>;
}

export function FormTextField({
	field,
	label,
	required,
	placeholder,
	disabled,
	type = "text",
	labelSuffix,
	inputProps,
}: FormTextFieldProps) {
	const isNumeric = type === "number" || type === "decimal";
	const allowDecimal = type === "decimal";

	return (
		<FieldWrapper
			label={label}
			htmlFor={field.name}
			required={required}
			errors={field.state.meta.errors}
			labelSuffix={labelSuffix}
		>
			<Input
				id={field.name}
				type={isNumeric ? "text" : type}
				inputMode={
					isNumeric ? (allowDecimal ? "decimal" : "numeric") : undefined
				}
				value={field.state.value}
				onChange={(e) => {
					if (isNumeric) {
						const cleaned = normalizeNumericInput(e.target.value, {
							allowDecimal,
						});
						field.handleChange(cleaned === "" ? 0 : Number(cleaned));
					} else {
						field.handleChange(e.target.value);
					}
				}}
				onBlur={field.handleBlur}
				disabled={disabled}
				placeholder={placeholder}
				{...inputProps}
			/>
		</FieldWrapper>
	);
}
