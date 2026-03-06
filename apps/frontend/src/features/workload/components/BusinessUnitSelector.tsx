import { useQuery } from "@tanstack/react-query";
import { Building2, Check } from "lucide-react";
import { useCallback, useMemo } from "react";
import { businessUnitsQueryOptions } from "@/features/workload/api/queries";

interface BusinessUnitSelectorProps {
	selectedCodes: string[];
	onChange: (codes: string[]) => void;
}

export function BusinessUnitSelector({
	selectedCodes,
	onChange,
}: BusinessUnitSelectorProps) {
	const { data: buData } = useQuery(businessUnitsQueryOptions());
	const businessUnits = useMemo(() => buData?.data ?? [], [buData?.data]);

	const toggleUnit = useCallback(
		(code: string) => {
			const next = selectedCodes.includes(code)
				? selectedCodes.filter((c) => c !== code)
				: [...selectedCodes, code];
			onChange(next);
		},
		[selectedCodes, onChange],
	);

	const selectAll = useCallback(() => {
		onChange(businessUnits.map((bu) => bu.businessUnitCode));
	}, [businessUnits, onChange]);

	const clearAll = useCallback(() => {
		onChange([]);
	}, [onChange]);

	const allSelected =
		businessUnits.length > 0 && selectedCodes.length === businessUnits.length;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<div className="flex items-center gap-1.5 mr-1">
				<Building2 className="h-4 w-4 text-muted-foreground" />
				<span className="text-xs font-medium text-muted-foreground">
					ビジネスユニット
				</span>
			</div>
			<button
				type="button"
				className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
					allSelected
						? "border-primary bg-primary/10 text-primary"
						: "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
				}`}
				onClick={allSelected ? clearAll : selectAll}
			>
				<div
					className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
						allSelected
							? "border-primary bg-primary text-primary-foreground"
							: "border-input"
					}`}
				>
					{allSelected && <Check className="h-2.5 w-2.5" />}
				</div>
				全選択
			</button>
			{businessUnits.map((bu) => {
				const selected = selectedCodes.includes(bu.businessUnitCode);
				return (
					<button
						key={bu.businessUnitCode}
						type="button"
						className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
							selected
								? "border-primary bg-primary/10 text-primary"
								: "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						}`}
						onClick={() => toggleUnit(bu.businessUnitCode)}
					>
						<div
							className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
								selected
									? "border-primary bg-primary text-primary-foreground"
									: "border-input"
							}`}
						>
							{selected && <Check className="h-2.5 w-2.5" />}
						</div>
						{bu.name}
					</button>
				);
			})}
		</div>
	);
}
