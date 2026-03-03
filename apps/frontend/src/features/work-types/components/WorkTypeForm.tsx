import { useForm } from "@tanstack/react-form";
import { Loader2, X } from "lucide-react";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { FormTextField } from "@/components/shared/FormTextField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	createWorkTypeSchema,
	updateWorkTypeSchema,
} from "@/features/work-types/types";
import { displayOrderValidators } from "@/lib/validators";

type WorkTypeFormValues = {
	workTypeCode: string;
	name: string;
	displayOrder: number;
	color: string | null;
};

interface WorkTypeFormProps {
	mode: "create" | "edit";
	defaultValues?: WorkTypeFormValues;
	onSubmit: (values: WorkTypeFormValues) => Promise<void>;
	isSubmitting: boolean;
}

export function WorkTypeForm({
	mode,
	defaultValues,
	onSubmit,
	isSubmitting,
}: WorkTypeFormProps) {
	const form = useForm({
		defaultValues: defaultValues ?? {
			workTypeCode: "",
			name: "",
			displayOrder: 0,
			color: null as string | null,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-6 max-w-md"
		>
			<form.Field
				name="workTypeCode"
				validators={{
					onChange:
						mode === "create"
							? createWorkTypeSchema.shape.workTypeCode
							: undefined,
					onBlur:
						mode === "create"
							? createWorkTypeSchema.shape.workTypeCode
							: undefined,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="作業種類コード"
						required={mode === "create"}
						disabled={mode === "edit"}
						placeholder="例: WT001"
					/>
				)}
			</form.Field>

			<form.Field
				name="name"
				validators={{
					onChange:
						mode === "create"
							? createWorkTypeSchema.shape.name
							: updateWorkTypeSchema.shape.name,
					onBlur:
						mode === "create"
							? createWorkTypeSchema.shape.name
							: updateWorkTypeSchema.shape.name,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="名称"
						required
						placeholder="例: 設計作業"
					/>
				)}
			</form.Field>

			<form.Field
				name="displayOrder"
				validators={displayOrderValidators}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="表示順"
						type="number"
						inputProps={{ min: 0 }}
					/>
				)}
			</form.Field>

			<form.Field
				name="color"
				validators={{
					onChange: ({ value }) => {
						if (value === null || value === undefined) return undefined;
						if (!/^#[0-9A-Fa-f]{6}$/.test(value))
							return "カラーコードは #RRGGBB 形式で入力してください";
						return undefined;
					},
					onBlur: ({ value }) => {
						if (value === null || value === undefined) return undefined;
						if (!/^#[0-9A-Fa-f]{6}$/.test(value))
							return "カラーコードは #RRGGBB 形式で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<FieldWrapper
						label="カラー"
						htmlFor={field.name}
						errors={field.state.meta.errors}
						labelSuffix={
							field.state.value ? (
								<span
									className="inline-block w-3 h-3 rounded-full border border-border ml-2 align-middle"
									style={{ backgroundColor: field.state.value }}
								/>
							) : undefined
						}
					>
						<div className="flex items-center gap-2">
							<input
								type="color"
								value={field.state.value ?? "#000000"}
								onChange={(e) => field.handleChange(e.target.value)}
								className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5"
							/>
							<Input
								id={field.name}
								value={field.state.value ?? ""}
								onChange={(e) => {
									const v = e.target.value;
									field.handleChange(v === "" ? null : v);
								}}
								onBlur={field.handleBlur}
								placeholder="#RRGGBB"
								className="flex-1"
							/>
							{field.state.value && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => field.handleChange(null)}
									title="カラーをクリア"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					</FieldWrapper>
				)}
			</form.Field>

			<div className="flex gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					{mode === "create" ? "登録" : "保存"}
				</Button>
			</div>
		</form>
	);
}
