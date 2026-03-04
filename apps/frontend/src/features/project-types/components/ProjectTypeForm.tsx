import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { FormTextField } from "@/components/shared/FormTextField";
import { Button } from "@/components/ui/button";
import {
	createProjectTypeSchema,
	updateProjectTypeSchema,
} from "@/features/project-types/types";
import { displayOrderValidators } from "@/lib/validators";

type ProjectTypeFormValues = {
	projectTypeCode: string;
	name: string;
	displayOrder: number;
};

interface ProjectTypeFormProps {
	mode: "create" | "edit";
	defaultValues?: ProjectTypeFormValues;
	onSubmit: (values: ProjectTypeFormValues) => Promise<void>;
	isSubmitting: boolean;
}

export function ProjectTypeForm({
	mode,
	defaultValues,
	onSubmit,
	isSubmitting,
}: ProjectTypeFormProps) {
	const form = useForm({
		defaultValues: defaultValues ?? {
			projectTypeCode: "",
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
				name="projectTypeCode"
				validators={{
					onChange:
						mode === "create"
							? createProjectTypeSchema.shape.projectTypeCode
							: undefined,
					onBlur:
						mode === "create"
							? createProjectTypeSchema.shape.projectTypeCode
							: undefined,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="案件タイプコード"
						required={mode === "create"}
						disabled={mode === "edit"}
						placeholder="例: TYPE001"
					/>
				)}
			</form.Field>

			<form.Field
				name="name"
				validators={{
					onChange:
						mode === "create"
							? createProjectTypeSchema.shape.name
							: updateProjectTypeSchema.shape.name,
					onBlur:
						mode === "create"
							? createProjectTypeSchema.shape.name
							: updateProjectTypeSchema.shape.name,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="名称"
						required
						placeholder="例: 新規開発"
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
