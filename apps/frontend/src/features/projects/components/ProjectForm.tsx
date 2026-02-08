import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getErrorMessage } from "@/lib/form-utils";

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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							案件コード
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
							placeholder="例: PRJ001"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
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
							placeholder="例: Webサイトリニューアル"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							事業部
							<span className="text-destructive ml-1">*</span>
						</Label>
						{buQuery.isLoading ? (
							<div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								読み込み中...
							</div>
						) : buQuery.isError ? (
							<div className="flex items-center gap-2 h-10">
								<p className="text-sm text-destructive">
									選択肢の取得に失敗しました
								</p>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => buQuery.refetch()}
								>
									再試行
								</Button>
							</div>
						) : (
							<Select
								value={field.state.value}
								onValueChange={(value) => field.handleChange(value)}
							>
								<SelectTrigger id={field.name}>
									<SelectValue placeholder="事業部を選択" />
								</SelectTrigger>
								<SelectContent>
									{buQuery.data?.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
				)}
			</form.Field>

			{/* プロジェクト種別 */}
			<form.Field name="projectTypeCode">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>種別</Label>
						{ptQuery.isLoading ? (
							<div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								読み込み中...
							</div>
						) : ptQuery.isError ? (
							<div className="flex items-center gap-2 h-10">
								<p className="text-sm text-destructive">
									選択肢の取得に失敗しました
								</p>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => ptQuery.refetch()}
								>
									再試行
								</Button>
							</div>
						) : (
							<Select
								value={field.state.value || undefined}
								onValueChange={(value) =>
									field.handleChange(value === "__none__" ? "" : value)
								}
							>
								<SelectTrigger id={field.name}>
									<SelectValue placeholder="種別を選択（任意）" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">未選択</SelectItem>
									{ptQuery.data?.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							開始年月
							<span className="text-destructive ml-1">*</span>
						</Label>
						<Input
							id={field.name}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							placeholder="例: 202601"
							maxLength={6}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							総工数
							<span className="text-destructive ml-1">*</span>
						</Label>
						<Input
							id={field.name}
							type="number"
							value={field.state.value}
							onChange={(e) => field.handleChange(Number(e.target.value))}
							onBlur={field.handleBlur}
							min={0}
							step="0.1"
							placeholder="例: 100"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
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
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							ステータス
							<span className="text-destructive ml-1">*</span>
						</Label>
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
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
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
					<div className="space-y-2">
						<Label htmlFor={field.name}>期間月数</Label>
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
