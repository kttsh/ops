import { useQuery } from "@tanstack/react-query";
import { standardEffortMasterQueryOptions } from "@/features/case-study/api/queries";

interface StandardEffortPreviewProps {
	standardEffortId: number | null;
}

export function StandardEffortPreview({
	standardEffortId,
}: StandardEffortPreviewProps) {
	const { data, isLoading } = useQuery(
		standardEffortMasterQueryOptions(standardEffortId ?? 0),
	);

	if (!standardEffortId) {
		return (
			<p className="py-4 text-center text-xs text-muted-foreground">
				標準工数マスタを選択してください
			</p>
		);
	}

	if (isLoading) {
		return (
			<p className="py-4 text-center text-xs text-muted-foreground">
				読み込み中...
			</p>
		);
	}

	const detail = data?.data;
	if (!detail) return null;

	return (
		<div className="rounded-lg border bg-card p-3">
			<h4 className="mb-2 text-xs font-semibold">
				{detail.name} - 工数配分プレビュー
			</h4>
			<div className="max-h-64 overflow-y-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b">
							<th className="py-1 text-left font-medium text-muted-foreground">
								進捗率(%)
							</th>
							<th className="py-1 text-right font-medium text-muted-foreground">
								重み
							</th>
						</tr>
					</thead>
					<tbody>
						{detail.weights.map((w) => (
							<tr
								key={w.standardEffortWeightId}
								className="border-b last:border-0"
							>
								<td className="py-1">{w.progressRate}%</td>
								<td className="py-1 text-right">{Math.round(w.weight)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
