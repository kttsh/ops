import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { FormTextField } from "@/components/shared/FormTextField";
import { QuerySelect } from "@/components/shared/QuerySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	businessUnitsForSelectQueryOptions,
	projectTypesForSelectQueryOptions,
} from "@/features/projects/api/queries";
import {
	createProjectSchema,
	PROJECT_STATUSES,
} from "@/features/projects/types";

type ProjectFormValues = {
	projectCode: string;
	name: string;
	businessUnitCode: string;
	projectTypeCode: string;
	startYearMonth: string;
	totalManhour: number;
	status: string;
	durationMonths: number | null;
};

interface ProjectFormProps {
	mode: "create" | "edit";
	defaultValues?: ProjectFormValues;
	onSubmit: (values: ProjectFormValues) => Promise<void>;
	isSubmitting: boolean;
}

export function ProjectForm({
	mode,
	defaultValues,
	onSubmit,
	isSubmitting,
}: ProjectFormProps) {
	const buQuery = useQuery(businessUnitsForSelectQueryOptions());
	const ptQuery = useQuery(projectTypesForSelectQueryOptions());

	const form = useForm({
		defaultValues: defaultValues ?? {
			projectCode: "",
			name: "",
			businessUnitCode: "",
			projectTypeCode: "",
			startYearMonth: "",
			totalManhour: 0,
			status: "",
			durationMonths: null as number | null,
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
			{/* 案件コード */}
			<form.Field
				name="projectCode"
				validators={{
					onChange:
						mode === "create"
							? createProjectSchema.shape.projectCode
							: undefined,
					onBlur:
						mode === "create"
							? createProjectSchema.shape.projectCode
							: undefined,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="案件コード"
						required={mode === "create"}
						disabled={mode === "edit"}
						placeholder="例: PRJ001"
					/>
				)}
			</form.Field>

			{/* 名称 */}
			<form.Field
				name="name"
				validators={{
					onChange: createProjectSchema.shape.name,
					onBlur: createProjectSchema.shape.name,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="名称"
						required
						placeholder="例: Webサイトリニューアル"
					/>
				)}
			</form.Field>

			{/* 事業部 */}
			<form.Field
				name="businessUnitCode"
				validators={{
					onChange: createProjectSchema.shape.businessUnitCode,
					onBlur: createProjectSchema.shape.businessUnitCode,
				}}
			>
				{(field) => (
					<FieldWrapper
						label="事業部"
						htmlFor={field.name}
						required
						errors={field.state.meta.errors}
					>
						<QuerySelect
							id={field.name}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
							placeholder="事業部を選択"
							queryResult={buQuery}
						/>
					</FieldWrapper>
				)}
			</form.Field>

			{/* プロジェクト種別 */}
			<form.Field name="projectTypeCode">
				{(field) => (
					<FieldWrapper label="種別" htmlFor={field.name}>
						<QuerySelect
							id={field.name}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
							placeholder="種別を選択（任意）"
							queryResult={ptQuery}
							allowEmpty
							emptyLabel="未選択"
						/>
					</FieldWrapper>
				)}
			</form.Field>

			{/* 開始年月 */}
			<form.Field
				name="startYearMonth"
				validators={{
					onChange: createProjectSchema.shape.startYearMonth,
					onBlur: createProjectSchema.shape.startYearMonth,
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="開始年月"
						required
						placeholder="例: 202601"
						inputProps={{ maxLength: 6 }}
					/>
				)}
			</form.Field>

			{/* 総工数 */}
			<form.Field
				name="totalManhour"
				validators={{
					onChange: ({ value }) => {
						if (typeof value !== "number" || Number.isNaN(value))
							return "総工数は数値で入力してください";
						if (value <= 0) return "総工数は正の数で入力してください";
						return undefined;
					},
					onBlur: ({ value }) => {
						if (typeof value !== "number" || Number.isNaN(value))
							return "総工数は数値で入力してください";
						if (value <= 0) return "総工数は正の数で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="総工数"
						required
						type="number"
						placeholder="例: 100"
						inputProps={{ min: 0, step: "0.1" }}
					/>
				)}
			</form.Field>

			{/* ステータス */}
			<form.Field
				name="status"
				validators={{
					onChange: createProjectSchema.shape.status,
					onBlur: createProjectSchema.shape.status,
				}}
			>
				{(field) => (
					<FieldWrapper
						label="ステータス"
						htmlFor={field.name}
						required
						errors={field.state.meta.errors}
					>
						<Select
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<SelectTrigger id={field.name}>
								<SelectValue placeholder="ステータスを選択" />
							</SelectTrigger>
							<SelectContent>
								{PROJECT_STATUSES.map((s) => (
									<SelectItem key={s.value} value={s.value}>
										{s.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FieldWrapper>
				)}
			</form.Field>

			{/* 期間月数 */}
			<form.Field
				name="durationMonths"
				validators={{
					onChange: ({ value }) => {
						if (value === null || value === undefined) return undefined;
						if (typeof value !== "number" || Number.isNaN(value))
							return "期間月数は数値で入力してください";
						if (!Number.isInteger(value))
							return "期間月数は整数で入力してください";
						if (value <= 0) return "期間月数は正の整数で入力してください";
						return undefined;
					},
					onBlur: ({ value }) => {
						if (value === null || value === undefined) return undefined;
						if (typeof value !== "number" || Number.isNaN(value))
							return "期間月数は数値で入力してください";
						if (!Number.isInteger(value))
							return "期間月数は整数で入力してください";
						if (value <= 0) return "期間月数は正の整数で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<FieldWrapper
						label="期間月数"
						htmlFor={field.name}
						errors={field.state.meta.errors}
					>
						<Input
							id={field.name}
							type="number"
							value={field.state.value ?? ""}
							onChange={(e) => {
								const val = e.target.value;
								field.handleChange(val === "" ? null : Number(val));
							}}
							onBlur={field.handleBlur}
							min={1}
							placeholder="例: 12"
						/>
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
