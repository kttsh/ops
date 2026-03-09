import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { FieldWrapper } from "@/components/shared/FieldWrapper";
import { FormTextField } from "@/components/shared/FormTextField";
import { QuerySelect } from "@/components/shared/QuerySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	businessUnitsForSelectQueryOptions,
	projectTypesForSelectQueryOptions,
} from "@/features/standard-effort-masters/api/queries";
import type {
	CreateStandardEffortMasterInput,
	UpdateStandardEffortMasterInput,
	WeightInput,
} from "@/features/standard-effort-masters/types";
import {
	createStandardEffortMasterSchema,
	DEFAULT_WEIGHTS,
	PROGRESS_RATES,
	updateStandardEffortMasterSchema,
} from "@/features/standard-effort-masters/types";
import { WeightDistributionChart } from "./WeightDistributionChart";

type StandardEffortMasterFormValues = {
	businessUnitCode: string;
	projectTypeCode: string;
	name: string;
	weights: WeightInput[];
};

interface StandardEffortMasterFormProps {
	mode: "create" | "edit";
	defaultValues?: StandardEffortMasterFormValues;
	onSubmit: (
		values: CreateStandardEffortMasterInput | UpdateStandardEffortMasterInput,
	) => Promise<void>;
	isSubmitting?: boolean;
}

export function StandardEffortMasterForm({
	mode,
	defaultValues,
	onSubmit,
	isSubmitting = false,
}: StandardEffortMasterFormProps) {
	const buQuery = useQuery(businessUnitsForSelectQueryOptions());
	const ptQuery = useQuery(projectTypesForSelectQueryOptions());

	const form = useForm({
		defaultValues: defaultValues ?? {
			businessUnitCode: "",
			projectTypeCode: "",
			name: "",
			weights: DEFAULT_WEIGHTS,
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
			className="space-y-6"
		>
			<div className="space-y-6">
				<div className="grid grid-cols-2 gap-6 max-w-2xl">
					{/* ビジネスユニット */}
					<form.Field
						name="businessUnitCode"
						validators={{
							onChange: createStandardEffortMasterSchema.shape.businessUnitCode,
							onBlur: createStandardEffortMasterSchema.shape.businessUnitCode,
						}}
					>
						{(field) => (
							<FieldWrapper
								label="ビジネスユニット"
								htmlFor={field.name}
								required
								errors={field.state.meta.errors}
							>
								<QuerySelect
									id={field.name}
									value={field.state.value}
									onValueChange={(value) => field.handleChange(value)}
									placeholder="ビジネスユニットを選択"
									queryResult={buQuery}
									disabled={mode === "edit"}
								/>
							</FieldWrapper>
						)}
					</form.Field>

					{/* 案件タイプ */}
					<form.Field
						name="projectTypeCode"
						validators={{
							onChange: createStandardEffortMasterSchema.shape.projectTypeCode,
							onBlur: createStandardEffortMasterSchema.shape.projectTypeCode,
						}}
					>
						{(field) => (
							<FieldWrapper
								label="案件タイプ"
								htmlFor={field.name}
								required
								errors={field.state.meta.errors}
							>
								<QuerySelect
									id={field.name}
									value={field.state.value}
									onValueChange={(value) => field.handleChange(value)}
									placeholder="案件タイプを選択"
									queryResult={ptQuery}
									disabled={mode === "edit"}
								/>
							</FieldWrapper>
						)}
					</form.Field>
				</div>

				{/* パターン名 */}
				<div className="max-w-md">
					<form.Field
						name="name"
						validators={{
							onChange:
								mode === "create"
									? createStandardEffortMasterSchema.shape.name
									: updateStandardEffortMasterSchema.shape.name,
							onBlur:
								mode === "create"
									? createStandardEffortMasterSchema.shape.name
									: updateStandardEffortMasterSchema.shape.name,
						}}
					>
						{(field) => (
							<FormTextField
								field={field}
								label="パターン名"
								required
								placeholder="例: Sカーブ標準"
							/>
						)}
					</form.Field>
				</div>
			</div>

			{/* 重みテーブル + チャート */}
			<div className="grid grid-cols-1 gap-6">
				{/* 重みテーブル */}
				<div className="rounded-3xl border bg-card p-6">
					<h3 className="text-sm font-medium mb-4">重み配分（進捗率ごと）</h3>
					<div className="overflow-x-hidden">
						<table className="table-fixed w-full">
							<thead>
								<tr>
									<th className="text-[11px] font-medium text-muted-foreground text-center px-1 py-2" />
									{PROGRESS_RATES.map((rate) => (
										<th
											key={rate}
											className="text-[11px] font-medium text-muted-foreground text-center px-1 py-2"
										>
											{rate}%
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className="text-[11px] font-medium text-muted-foreground px-1 py-1.5">
										重み
									</td>
									{PROGRESS_RATES.map((rate, i) => (
										<td key={rate} className="px-1 py-1.5">
											<form.Field name={`weights[${i}].weight`}>
												{(field) => (
													<Input
														type="text"
														inputMode="numeric"
														value={field.state.value}
														onChange={(e) => {
															const half = e.target.value.replace(
																/[０-９]/g,
																(ch) =>
																	String.fromCharCode(
																		ch.charCodeAt(0) - 0xfee0,
																	),
															);
															const cleaned = half.replace(/[^0-9]/g, "");
															field.handleChange(
																cleaned === "" ? 0 : Number(cleaned),
															);
														}}
														onBlur={field.handleBlur}
														className="w-full min-w-0 h-7 text-xs text-right tabular-nums px-1"
													/>
												)}
											</form.Field>
										</td>
									))}
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* エリアチャート */}
				<form.Subscribe selector={(state) => state.values.weights}>
					{(weights) => <WeightDistributionChart weights={weights} />}
				</form.Subscribe>
			</div>

			<div className="flex gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					{mode === "create" ? "登録" : "保存"}
				</Button>
			</div>
		</form>
	);
}
