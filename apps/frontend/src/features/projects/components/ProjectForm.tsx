import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
	businessUnitsForSelectQueryOptions,
	projectTypesForSelectQueryOptions,
} from "@/features/projects/api/queries";
import {
	createProjectSchema,
	PROJECT_STATUSES,
} from "@/features/projects/types";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

type ProjectFormValues = {
	projectCode: string;
	name: string;
	businessUnitCode: string;
	projectTypeCode: string;
	startYearMonth: string;
	totalManhour: number;
	status: string;
	durationMonths: number | null;
	fiscalYear: number | null;
	nickname: string;
	customerName: string;
	orderNumber: string;
	calculationBasis: string;
	remarks: string;
	region: string;
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
			fiscalYear: null as number | null,
			nickname: "",
			customerName: "",
			orderNumber: "",
			calculationBasis: "",
			remarks: "",
			region: "",
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
						type="decimal"
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
							type="text"
							inputMode="numeric"
							value={field.state.value ?? ""}
							onChange={(e) => {
								const val = normalizeNumericInput(e.target.value);
								field.handleChange(val === "" ? null : Number(val));
							}}
							onBlur={field.handleBlur}
							min={1}
							placeholder="例: 12"
						/>
					</FieldWrapper>
				)}
			</form.Field>

			{/* 年度 */}
			<form.Field
				name="fiscalYear"
				validators={{
					onChange: ({ value }) => {
						if (value === null || value === undefined) return undefined;
						if (typeof value !== "number" || Number.isNaN(value))
							return "年度は数値で入力してください";
						if (!Number.isInteger(value)) return "年度は整数で入力してください";
						return undefined;
					},
					onBlur: ({ value }) => {
						if (value === null || value === undefined) return undefined;
						if (typeof value !== "number" || Number.isNaN(value))
							return "年度は数値で入力してください";
						if (!Number.isInteger(value)) return "年度は整数で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<FieldWrapper
						label="年度"
						htmlFor={field.name}
						errors={field.state.meta.errors}
					>
						<Input
							id={field.name}
							type="text"
							inputMode="numeric"
							value={field.state.value ?? ""}
							onChange={(e) => {
								const val = normalizeNumericInput(e.target.value);
								field.handleChange(val === "" ? null : Number(val));
							}}
							onBlur={field.handleBlur}
							placeholder="例: 2026"
						/>
					</FieldWrapper>
				)}
			</form.Field>

			{/* 通称・略称 */}
			<form.Field
				name="nickname"
				validators={{
					onChange: z
						.string()
						.max(120, "通称・略称は120文字以内で入力してください"),
					onBlur: z
						.string()
						.max(120, "通称・略称は120文字以内で入力してください"),
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="通称・略称"
						placeholder="例: Webリニューアル"
					/>
				)}
			</form.Field>

			{/* 客先名 */}
			<form.Field
				name="customerName"
				validators={{
					onChange: z
						.string()
						.max(120, "客先名は120文字以内で入力してください"),
					onBlur: z.string().max(120, "客先名は120文字以内で入力してください"),
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="客先名"
						placeholder="例: 株式会社サンプル"
					/>
				)}
			</form.Field>

			{/* オーダー番号 */}
			<form.Field
				name="orderNumber"
				validators={{
					onChange: z
						.string()
						.max(120, "オーダー番号は120文字以内で入力してください"),
					onBlur: z
						.string()
						.max(120, "オーダー番号は120文字以内で入力してください"),
				}}
			>
				{(field) => (
					<FormTextField
						field={field}
						label="オーダー番号"
						placeholder="例: ORD-2026-001"
					/>
				)}
			</form.Field>

			{/* 算出根拠 */}
			<form.Field
				name="calculationBasis"
				validators={{
					onChange: z
						.string()
						.max(500, "算出根拠は500文字以内で入力してください"),
					onBlur: z
						.string()
						.max(500, "算出根拠は500文字以内で入力してください"),
				}}
			>
				{(field) => (
					<FieldWrapper
						label="算出根拠"
						htmlFor={field.name}
						errors={field.state.meta.errors}
					>
						<Textarea
							id={field.name}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							placeholder="算出根拠を入力"
							rows={3}
						/>
					</FieldWrapper>
				)}
			</form.Field>

			{/* 備考 */}
			<form.Field
				name="remarks"
				validators={{
					onChange: z.string().max(500, "備考は500文字以内で入力してください"),
					onBlur: z.string().max(500, "備考は500文字以内で入力してください"),
				}}
			>
				{(field) => (
					<FieldWrapper
						label="備考"
						htmlFor={field.name}
						errors={field.state.meta.errors}
					>
						<Textarea
							id={field.name}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							placeholder="備考を入力"
							rows={3}
						/>
					</FieldWrapper>
				)}
			</form.Field>

			{/* 地域 */}
			<form.Field
				name="region"
				validators={{
					onChange: z.string().max(100, "地域は100文字以内で入力してください"),
					onBlur: z.string().max(100, "地域は100文字以内で入力してください"),
				}}
			>
				{(field) => (
					<FormTextField field={field} label="地域" placeholder="例: 関東" />
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
