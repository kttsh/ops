import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createBusinessUnitSchema,
	updateBusinessUnitSchema,
} from "@/features/business-units/types";
import { getErrorMessage } from "@/lib/form-utils";

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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							ビジネスユニットコード
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
							placeholder="例: BU001"
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
							? createBusinessUnitSchema.shape.name
							: updateBusinessUnitSchema.shape.name,
					onBlur:
						mode === "create"
							? createBusinessUnitSchema.shape.name
							: updateBusinessUnitSchema.shape.name,
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
							placeholder="例: 開発部"
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
