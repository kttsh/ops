import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createProjectTypeSchema,
	updateProjectTypeSchema,
} from "@/features/project-types/types";
import { getErrorMessage } from "@/lib/form-utils";

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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							案件タイプコード
							{mode === "create" && (
								<span className="text-destructive ml-1">*</span>
							)}
						</Label>
						<Input
							id={field.name}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							disabled={mode === "edit"}
							placeholder="例: TYPE001"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							名称
							<span className="text-destructive ml-1">*</span>
						</Label>
						<Input
							id={field.name}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							placeholder="例: 新規開発"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field
				name="displayOrder"
				validators={{
					onChange: ({ value }) => {
						if (typeof value !== "number" || !Number.isInteger(value))
							return "表示順は整数で入力してください";
						if (value < 0) return "表示順は0以上で入力してください";
						return undefined;
					},
					onBlur: ({ value }) => {
						if (typeof value !== "number" || !Number.isInteger(value))
							return "表示順は整数で入力してください";
						if (value < 0) return "表示順は0以上で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>表示順</Label>
						<Input
							id={field.name}
							type="number"
							value={field.state.value}
							onChange={(e) => field.handleChange(Number(e.target.value))}
							onBlur={field.handleBlur}
							min={0}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
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
