import { useState } from "react";
import { DetailRow } from "@/components/shared/DetailRow";
import { Button } from "@/components/ui/button";
import type {
	StandardEffortMasterDetail as StandardEffortMasterDetailType,
	UpdateStandardEffortMasterInput,
	WeightInput,
} from "@/features/standard-effort-masters/types";
import { PROGRESS_RATES } from "@/features/standard-effort-masters/types";
import { StandardEffortMasterForm } from "./StandardEffortMasterForm";
import { WeightDistributionChart } from "./WeightDistributionChart";

interface StandardEffortMasterDetailProps {
	data: StandardEffortMasterDetailType;
	buName: string;
	ptName: string;
	onSave: (values: UpdateStandardEffortMasterInput) => Promise<void>;
	isSaving?: boolean;
}

export function StandardEffortMasterDetail({
	data,
	buName,
	ptName,
	onSave,
	isSaving = false,
}: StandardEffortMasterDetailProps) {
	const [isEditing, setIsEditing] = useState(false);

	const handleSave = async (values: unknown) => {
		await onSave(values as UpdateStandardEffortMasterInput);
		setIsEditing(false);
	};

	if (isEditing) {
		const formWeights: WeightInput[] = PROGRESS_RATES.map((rate) => {
			const existing = data.weights.find((w) => w.progressRate === rate);
			return {
				progressRate: rate,
				weight: existing?.weight ?? 0,
			};
		});

		return (
			<div className="rounded-3xl border bg-white p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-medium">編集</h2>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(false)}
					>
						キャンセル
					</Button>
				</div>
				<StandardEffortMasterForm
					mode="edit"
					defaultValues={{
						businessUnitCode: data.businessUnitCode,
						projectTypeCode: data.projectTypeCode,
						name: data.name,
						weights: formWeights,
					}}
					onSubmit={handleSave}
					isSubmitting={isSaving}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="rounded-3xl border bg-white p-6 space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">基本情報</h2>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(true)}
						disabled={!!data.deletedAt}
					>
						編集
					</Button>
				</div>
				<DetailRow label="パターン名" value={data.name} />
				<DetailRow label="事業部" value={buName} />
				<DetailRow label="案件タイプ" value={ptName} />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 読み取り専用の重みテーブル */}
				<div className="rounded-3xl border p-6">
					<h3 className="text-sm font-medium mb-4">
						重み配分（進捗率ごと）
					</h3>
					<div className="max-h-[480px] overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-background">
								<tr>
									<th className="text-left px-3 py-2 font-medium text-muted-foreground">
										進捗率
									</th>
									<th className="text-right px-3 py-2 font-medium text-muted-foreground">
										重み
									</th>
								</tr>
							</thead>
							<tbody>
								{PROGRESS_RATES.map((rate) => {
									const w = data.weights.find(
										(w) => w.progressRate === rate,
									);
									return (
										<tr key={rate} className="border-t">
											<td className="px-3 py-1.5 text-muted-foreground tabular-nums">
												{rate}%
											</td>
											<td className="px-3 py-1.5 text-right tabular-nums">
												{w?.weight ?? 0}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				{/* エリアチャート */}
				<WeightDistributionChart weights={data.weights} />
			</div>
		</div>
	);
}
