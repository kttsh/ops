import type React from "react";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/form-utils";

interface FieldWrapperProps {
	/** フィールドラベルテキスト */
	label: string;
	/** HTML id / htmlFor 属性 */
	htmlFor?: string;
	/** 必須マーク表示 */
	required?: boolean;
	/** TanStack Form の field.state.meta.errors */
	errors?: unknown[];
	/** Label 横のカスタムコンテンツ（カラープレビュー等） */
	labelSuffix?: React.ReactNode;
	/** フィールド入力コンテンツ */
	children: React.ReactNode;
	/** 追加 CSS クラス */
	className?: string;
}

export function FieldWrapper({
	label,
	htmlFor,
	required,
	errors,
	labelSuffix,
	children,
	className,
}: FieldWrapperProps) {
	const hasErrors = errors && errors.length > 0;

	return (
		<div className={className ? `space-y-2 ${className}` : "space-y-2"}>
			<Label htmlFor={htmlFor}>
				{label}
				{required && <span className="text-destructive ml-1">*</span>}
				{labelSuffix}
			</Label>
			{children}
			{hasErrors && (
				<p className="text-sm text-destructive">{getErrorMessage(errors)}</p>
			)}
		</div>
	);
}
