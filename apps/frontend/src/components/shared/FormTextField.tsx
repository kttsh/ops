import type { AnyFieldApi } from "@tanstack/react-form";
import type React from "react";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { Input } from "@/components/ui/input";

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
	type?: "text" | "number";
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
	const isNumeric = type === "number";

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
				inputMode={isNumeric ? "numeric" : undefined}
				value={field.state.value}
				onChange={(e) => {
					if (isNumeric) {
						const half = e.target.value.replace(/[０-９]/g, (ch) =>
							String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
						);
						const cleaned = half.replace(/[^0-9]/g, "");
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
