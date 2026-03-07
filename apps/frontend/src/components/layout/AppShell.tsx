import { useRouterState } from "@tanstack/react-router";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const { collapsed, toggle } = useSidebarState();
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	return (
		<div className="flex h-screen">
			{/* Desktop sidebar */}
			<aside
				className={cn(
					"hidden lg:flex lg:flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-in-out",
					collapsed ? "lg:w-16" : "lg:w-64",
				)}
			>
				<div className="flex h-14 items-center px-6">
					{!collapsed && (
						<h1 className="text-lg font-bold text-sidebar-foreground">
							操業管理システム
						</h1>
					)}
				</div>
				<Separator />
				<SidebarNav collapsed={collapsed} />
				<div className="mt-auto border-t border-border p-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggle}
						className={cn("h-9 w-9", !collapsed && "ml-2")}
					>
						{collapsed ? (
							<PanelLeftOpen className="h-4 w-4" />
						) : (
							<PanelLeftClose className="h-4 w-4" />
						)}
					</Button>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Mobile header */}
				<header className="flex h-14 items-center gap-4 border-b border-border px-4 lg:hidden">
					<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon">
								<Menu className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-72 p-0">
							<SheetHeader className="p-6 pb-0">
								<SheetTitle>操業管理システム</SheetTitle>
							</SheetHeader>
							<SidebarNav collapsed={false} />
						</SheetContent>
					</Sheet>
					<h1 className="text-lg font-bold">操業管理システム</h1>
				</header>

				{/* Page content */}
				<main className="flex-1 overflow-y-auto">
					<div
						className={cn(
							"",
							currentPath.startsWith("/workload") ||
								currentPath.startsWith("/master/indirect-capacity-settings") ||
								currentPath.startsWith("/master/headcount-plans") ||
								currentPath.startsWith("/master/capacity-scenarios") ||
								currentPath.startsWith("/master/indirect-work-cases")
								? "h-full"
								: currentPath.startsWith("/master")
									? "h-full px-6 py-8"
									: "mx-auto max-w-4xl px-6 py-8",
						)}
					>
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
