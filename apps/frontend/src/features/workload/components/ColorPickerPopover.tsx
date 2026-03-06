import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerPopoverProps {
	/** 選択可能な色パレット（hex文字列配列） */
	colors: readonly string[];
	/** 現在選択されている色（hex文字列） */
	value: string;
	/** 色変更時のコールバック */
	onChange: (color: string) => void;
}

export function ColorPickerPopover({
	colors,
	value,
	onChange,
}: ColorPickerPopoverProps) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="h-6 w-6 rounded-full border border-border"
					style={{ backgroundColor: value }}
					aria-label="色を選択"
				/>
			</PopoverTrigger>
			<PopoverContent side="bottom" align="start" className="w-auto p-2">
				<div className="grid grid-cols-5 gap-1.5">
					{colors.map((color) => (
						<button
							key={color}
							type="button"
							className={cn(
								"h-5 w-5 rounded-full",
								value === color && "ring-2 ring-primary ring-offset-1",
							)}
							style={{ backgroundColor: color }}
							onClick={() => {
								onChange(color);
								setOpen(false);
							}}
							aria-label={color}
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
