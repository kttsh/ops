import { GripVertical } from "lucide-react";
import {
	Group,
	Panel,
	Separator,
	type GroupProps,
	type SeparatorProps,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
	className,
	...props
}: GroupProps) => (
	<Group
		className={cn(
			"flex h-full w-full",
			className,
		)}
		{...props}
	/>
);

const ResizablePanel = Panel;

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: SeparatorProps & {
	withHandle?: boolean;
}) => (
	<Separator
		className={cn(
			"relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-[''] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-orientation=vertical]]:h-px [&[data-orientation=vertical]]:w-full [&[data-orientation=vertical]]:after:inset-x-0 [&[data-orientation=vertical]]:after:-top-1 [&[data-orientation=vertical]]:after:-bottom-1 [&[data-orientation=vertical]]:after:left-auto [&[data-orientation=vertical]]:after:right-auto",
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
				<GripVertical className="h-2.5 w-2.5" />
			</div>
		)}
	</Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
