import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { FormTextField } from "@/components/shared/FormTextField";
import { Button } from "@/components/ui/button";
import {
	createBusinessUnitSchema,
	updateBusinessUnitSchema,
} from "@/features/business-units/types";
import { displayOrderValidators } from "@/lib/validators";

type BusinessUnitFormValues = {
	businessUnitCode: string;
	name: string;
	displayOrder: number;
};

interface BusinessUnitFormProps {
	mode: "create" | "edit";
	defaultValues?: BusinessUnitFormValues;
	onSubmit: (values: BusinessUnitFormValues) => Promise<void>;
	isSubmitting: boolean;
}

export function BusinessUnitForm({
	mode,
	defaultValues,
	onSubmit,
	isSubmitting,
}: BusinessUnitFormProps) {
	const form = useForm({
		defaultValues: defaultValues ?? {
			businessUnitCode: "",
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
				name="businessUnitCode"
				validators={{
					onChange:
						mode === "create"
							? createBusinessUnitSchema.shape.businessUnitCode
							: undefined,
					onBlur:
						mode === "create"
							? createBusinessUnitSchema.shape.businessUnitCode
							: undefined,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="ビジネスユニットコード"
						required={mode === "create"}
						disabled={mode === "edit"}
						placeholder="例: BU001"
					/>
				)}
			</form.Field>

			<form.Field
				name="name"
				validators={{
					onChange:
						mode === "create"
							? createBusinessUnitSchema.shape.name
							: updateBusinessUnitSchema.shape.name,
					onBlur:
						mode === "create"
							? createBusinessUnitSchema.shape.name
							: updateBusinessUnitSchema.shape.name,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="名称"
						required
						placeholder="例: 開発部"
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

			<div className="flex gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					{mode === "create" ? "登録" : "保存"}
				</Button>
			</div>
		</form>
	);
}
