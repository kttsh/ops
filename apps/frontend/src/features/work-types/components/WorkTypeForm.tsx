import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { FormTextField } from "@/components/shared/FormTextField";
import { Button } from "@/components/ui/button";
import {
	createWorkTypeSchema,
	updateWorkTypeSchema,
} from "@/features/work-types/types";
import { displayOrderValidators } from "@/lib/validators";

type WorkTypeFormValues = {
	workTypeCode: string;
	name: string;
	displayOrder: number;
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

			<form.Field name="displayOrder" validators={displayOrderValidators}>
				{(field) => (
					<FormTextField
						field={field}
						label="表示順"
						type="number"
						inputProps={{ min: 0 }}
					/>
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
