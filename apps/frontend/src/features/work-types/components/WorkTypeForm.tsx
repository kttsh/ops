import { useForm } from "@tanstack/react-form";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createWorkTypeSchema,
	updateWorkTypeSchema,
} from "@/features/work-types/types";

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

function getErrorMessage(errors: unknown[]): string | undefined {
	if (errors.length === 0) return undefined;
	const first = errors[0];
	if (typeof first === "string") return first;
	if (first && typeof first === "object" && "message" in first) {
		return String((first as { message: string }).message);
	}
	return String(first);
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
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							作業種類コード
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
							placeholder="例: WT001"
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
							? createWorkTypeSchema.shape.name
							: updateWorkTypeSchema.shape.name,
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
							placeholder="例: 設計作業"
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

			<form.Field
				name="color"
				validators={{
					onChange: ({ value }) => {
						if (value === null || value === undefined) return undefined;
						if (!/^#[0-9A-Fa-f]{6}$/.test(value))
							return "カラーコードは #RRGGBB 形式で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							カラー
							{field.state.value && (
								<span
									className="inline-block w-3 h-3 rounded-full border border-border ml-2 align-middle"
									style={{ backgroundColor: field.state.value }}
								/>
							)}
						</Label>
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
