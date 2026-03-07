import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

interface SidePanelProps {
	tab: "projects" | "indirect" | "settings";
	onTabChange: (tab: "projects" | "indirect" | "settings") => void;
	projectsContent: React.ReactNode;
	indirectContent: React.ReactNode;
	settingsContent: React.ReactNode;
	children: React.ReactNode;
}

const tabs = [
	{ value: "projects" as const, label: "案件" },
	{ value: "indirect" as const, label: "間接作業" },
	{ value: "settings" as const, label: "チャート設定" },
];

const SIDE_PANEL_ID = "side";
const MAIN_PANEL_ID = "main";

export function SidePanel({
	tab,
	onTabChange,
	projectsContent,
	indirectContent,
	settingsContent,
	children,
}: SidePanelProps) {
	const [isOpen, setIsOpen] = useState(true);
	const panelRef = usePanelRef();

	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id: "workload-side-panel",
		storage: localStorage,
	});

	const handleCollapse = () => {
		panelRef.current?.collapse();
	};

	const handleExpand = () => {
		panelRef.current?.expand();
	};

	const handleResize = (
		panelSize: { asPercentage: number; inPixels: number },
		_id: string | number | undefined,
	) => {
		setIsOpen(panelSize.asPercentage > 0);
	};

	return (
		<ResizablePanelGroup
			orientation="horizontal"
			defaultLayout={defaultLayout}
			onLayoutChanged={onLayoutChanged}
		>
			{/* サイドパネル */}
			<ResizablePanel
				id={SIDE_PANEL_ID}
				panelRef={panelRef}
				defaultSize="30"
				minSize="15"
				maxSize="50"
				collapsible
				collapsedSize={0}
				onResize={handleResize}
				className="flex flex-col bg-background"
			>
				{/* パネルヘッダー */}
				<div className="flex h-10 items-center justify-between border-b border-border px-3">
					<div className="flex gap-1">
						{tabs.map((t) => (
							<Button
								key={t.value}
								variant="ghost"
								size="sm"
								className={cn(
									"h-7 rounded-md px-3 text-xs",
									tab === t.value && "bg-accent text-accent-foreground",
								)}
								onClick={() => onTabChange(t.value)}
							>
								{t.label}
							</Button>
						))}
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={handleCollapse}
					>
						<PanelLeftClose className="h-4 w-4" />
					</Button>
				</div>

				{/* タブコンテンツ */}
				<div className="flex-1 overflow-y-auto p-4">
					{tab === "projects" && projectsContent}
					{tab === "indirect" && indirectContent}
					{tab === "settings" && settingsContent}
				</div>
			</ResizablePanel>

			<ResizableHandle withHandle />

			{/* メインエリア */}
			<ResizablePanel id={MAIN_PANEL_ID} defaultSize="70">
				<div className="flex h-full flex-col overflow-hidden">
					{/* パネル開くボタン */}
					{!isOpen && (
						<div className="flex h-10 items-center px-2 border-b border-border">
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={handleExpand}
							>
								<PanelLeftOpen className="h-4 w-4" />
							</Button>
						</div>
					)}
					<div className="flex-1 overflow-y-auto">{children}</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
