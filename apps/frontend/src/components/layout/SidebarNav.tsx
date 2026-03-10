import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Briefcase,
	Building2,
	ChevronRight,
	Clock,
	FolderKanban,
	ListChecks,
	Palette,
	Play,
	Table,
	TrendingUp,
	Users,
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
		label: "案件管理",
		children: [
			{
				label: "案件一覧",
				href: "/projects",
				icon: Briefcase,
			},
			{
				label: "標準工数パターン",
				href: "/projects/standard-efforts",
				icon: TrendingUp,
			},
		],
	},
	{
		label: "間接作業管理",
		children: [
			{
				label: "間接工数計算",
				href: "/indirect/simulation",
				icon: Play,
			},
			{
				label: "月次間接工数",
				href: "/indirect/monthly-loads",
				icon: Table,
			},
		],
	},
	{
		label: "マスタ管理",
		children: [
			{
				label: "人員計画ケース",
				href: "/master/headcount-plans",
				icon: Users,
			},
			{
				label: "稼働時間",
				href: "/master/capacity-scenarios",
				icon: Clock,
			},
			{
				label: "間接作業ケース",
				href: "/master/indirect-work-cases",
				icon: ListChecks,
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
				label: "ビジネスユニット",
				href: "/master/business-units",
				icon: Building2,
			},
		],
	},
];

interface SidebarNavProps {
	collapsed: boolean;
}

const allHrefs = menuItems.flatMap((g) => g.children.map((c) => c.href));

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
							const isActive =
								currentPath.startsWith(item.href) &&
								!allHrefs.some(
									(h) =>
										h !== item.href &&
										h.length > item.href.length &&
										currentPath.startsWith(h),
								);
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
