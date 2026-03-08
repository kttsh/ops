import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useMemo } from "react";
import { businessUnitsQueryOptions } from "@/features/workload/api/queries";

interface BusinessUnitSingleSelectorProps {
	/** 現在選択中のBUコード */
	selectedCode: string;
	/** BU選択変更時のコールバック */
	onChange: (code: string) => void;
}

export function BusinessUnitSingleSelector({
	selectedCode,
	onChange,
}: BusinessUnitSingleSelectorProps) {
	const { data: buData } = useQuery(businessUnitsQueryOptions());
	const businessUnits = useMemo(() => buData?.data ?? [], [buData?.data]);

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<div className="flex items-center gap-1.5 mr-1">
				<Building2 className="h-4 w-4 text-muted-foreground" />
				<span className="text-xs font-medium text-muted-foreground">
					ビジネスユニット
				</span>
			</div>
			{businessUnits.map((bu) => {
				const selected = bu.businessUnitCode === selectedCode;
				return (
					<button
						key={bu.businessUnitCode}
						type="button"
						className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm ${
							selected
								? "border-primary bg-primary/10 text-primary"
								: "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						}`}
						onClick={() => onChange(bu.businessUnitCode)}
					>
						{bu.name}
					</button>
				);
			})}
		</div>
	);
}
