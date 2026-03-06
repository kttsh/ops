import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export function SidePanel({
	tab,
	onTabChange,
	projectsContent,
	indirectContent,
	settingsContent,
	children,
}: SidePanelProps) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<div className="flex h-full">
			{/* サイドパネル */}
			<div
				className={cn(
					"flex flex-col border-r border-border bg-background transition-all duration-200 ease-in-out",
					isOpen ? "w-[600px]" : "w-0 overflow-hidden",
				)}
			>
				{isOpen && (
					<>
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
								onClick={() => setIsOpen(false)}
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
					</>
				)}
			</div>

			{/* メインエリア */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* パネル開くボタン */}
				{!isOpen && (
					<div className="flex h-10 items-center px-2 border-b border-border">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={() => setIsOpen(true)}
						>
							<PanelLeftOpen className="h-4 w-4" />
						</Button>
					</div>
				)}
				<div className="flex-1 overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}
