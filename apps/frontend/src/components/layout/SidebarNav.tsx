import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Briefcase,
	Building2,
	Calculator,
	ChevronRight,
	FolderKanban,
	Palette,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const menuItems = [
	{
		label: "ダッシュボード",
		children: [
			{
				label: "山積ダッシュボード",
				href: "/workload",
				icon: BarChart3,
			},
		],
	},
	{
		label: "マスタ管理",
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
];

interface SidebarNavProps {
	collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	const content = (
		<nav className={cn("flex flex-col gap-2 p-4", collapsed && "px-2")}>
			{menuItems.map((group, groupIndex) => (
				<div key={group.label}>
					{collapsed ? (
						groupIndex > 0 && <Separator className="my-2" />
					) : (
						<p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{group.label}
						</p>
					)}
					<div className="flex flex-col gap-1">
						{group.children.map((item) => {
							const isActive = currentPath.startsWith(item.href);
							const linkElement = (
								<Link
									key={item.href}
									to={item.href}
									className={cn(
										"flex items-center rounded-xl text-sm font-medium transition-colors duration-150",
										collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
										isActive
											? "bg-primary/10 text-primary"
											: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
									)}
								>
									<item.icon className="h-4 w-4 shrink-0" />
									{!collapsed && item.label}
									{!collapsed && isActive && (
										<ChevronRight className="ml-auto h-4 w-4" />
									)}
								</Link>
							);

							if (collapsed) {
								return (
									<Tooltip key={item.href}>
										<TooltipTrigger asChild>{linkElement}</TooltipTrigger>
										<TooltipContent side="right">{item.label}</TooltipContent>
									</Tooltip>
								);
							}

							return linkElement;
						})}
					</div>
				</div>
			))}
		</nav>
	);

	if (collapsed) {
		return <TooltipProvider delayDuration={0}>{content}</TooltipProvider>;
	}

	return content;
}
