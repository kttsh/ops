import { Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DebouncedSearchInput } from "@/features/business-units/components/DebouncedSearchInput";

interface DataTableToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	includeDisabled: boolean;
	onIncludeDisabledChange: (value: boolean) => void;
	newItemHref: string;
	searchPlaceholder?: string;
}

export function DataTableToolbar({
	search,
	onSearchChange,
	includeDisabled,
	onIncludeDisabledChange,
	newItemHref,
	searchPlaceholder = "コードまたは名称で検索...",
}: DataTableToolbarProps) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-1 items-center gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<DebouncedSearchInput
						value={search}
						onChange={onSearchChange}
						placeholder={searchPlaceholder}
						className="pl-9"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Switch
						id="include-disabled"
						checked={includeDisabled}
						onCheckedChange={onIncludeDisabledChange}
					/>
					<Label
						htmlFor="include-disabled"
						className="text-sm text-muted-foreground whitespace-nowrap"
					>
						削除済みを含む
					</Label>
				</div>
			</div>
			<Button asChild>
				<Link to={newItemHref}>
					<Plus className="h-4 w-4" />
					新規登録
				</Link>
			</Button>
		</div>
	);
}
