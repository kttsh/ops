import { Link, useRouterState } from "@tanstack/react-router";
import {
	Briefcase,
	Building2,
	Calculator,
	FolderKanban,
	LayoutDashboard,
	Menu,
	Palette,
	Settings,
	HelpCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const menuItems = [
	{
		label: "GENERAL",
		children: [
			{
				label: "山積ダッシュボード",
				href: "/workload",
				icon: LayoutDashboard,
			},
		],
	},
	{
		label: "MANAGEMENT",
		children: [
			{
				label: "ビジネスユニット",
				href: "/master/business-units",
				icon: Building2,
			},
			{
				label: "案件",
				href: "/master/projects",
				icon: Briefcase,
			},
			{
				label: "案件タイプ",
				href: "/master/project-types",
				icon: FolderKanban,
			},
			{
				label: "作業種類",
				href: "/master/work-types",
				icon: Palette,
			},
			{
				label: "間接作業・キャパシティ",
				href: "/master/indirect-capacity-settings",
				icon: Calculator,
			},
		],
	},
    {
        label: "SUPPORT",
        children: [
            {
                label: "設定",
                href: "/settings",
                icon: Settings,
                disabled: true
            },
            {
                label: "ヘルプ",
                href: "/help",
                icon: HelpCircle,
                disabled: true
            }
        ]
    }
];

function SidebarNav() {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	return (
		<nav className="flex flex-col gap-6 px-4">
			{menuItems.map((group) => (
				<div key={group.label}>
					<p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						{group.label}
					</p>
					<div className="flex flex-col gap-1">
						{group.children.map((item) => {
							const isActive = currentPath.startsWith(item.href) && !item.disabled;
                            if (item.disabled) {
                                return (
                                    <div
                                        key={item.href}
                                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </div>
                                )
                            }
							return (
								<Link
									key={item.href}
									to={item.href}
									className={cn(
										"group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
										isActive
											? "bg-primary/5 text-primary font-semibold"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									<item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
									{item.label}
                                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
								</Link>
							);
						})}
					</div>
				</div>
			))}
		</nav>
	);
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	return (
		<div className="flex h-screen bg-background text-foreground font-sans">
			{/* Desktop sidebar */}
			<aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-sidebar-border bg-sidebar pt-6 pb-4">
				<div className="flex items-center gap-3 px-7 mb-8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
					    <LayoutDashboard className="h-5 w-5" />
                    </div>
					<h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
						操業管理システム
					</h1>
				</div>
				
                <div className="flex-1 overflow-y-auto custom-scrollbar">
				    <SidebarNav />
                </div>

			</aside>

			{/* Main content */}
			<div className="flex flex-1 flex-col overflow-hidden bg-background">

				{/* Mobile header */}
				<header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:hidden">
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
							<SidebarNav />
						</SheetContent>
					</Sheet>
					<h1 className="text-lg font-bold">操業管理システム</h1>
				</header>

				{/* Page content */}
				<main className="flex-1 overflow-y-auto px-6 pt-6 pb-6 lg:px-8 lg:pt-8 lg:pb-8">
					<div
						className={cn(
							"animate-in fade-in slide-in-from-bottom-2 duration-500 h-full",
							currentPath.startsWith("/workload") ||
								currentPath.startsWith("/master/indirect-capacity-settings")
								? ""
								: "mx-auto max-w-6xl"
						)}
					>
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
