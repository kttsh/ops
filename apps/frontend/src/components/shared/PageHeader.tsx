import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
	label: string;
	href?: string;
	params?: Record<string, string>;
}

interface PageHeaderProps {
	breadcrumbs?: BreadcrumbItem[];
	title: string;
	description?: string;
	actions?: ReactNode;
}

export function PageHeader({
	breadcrumbs,
	title,
	description,
	actions,
}: PageHeaderProps) {
	return (
		<>
			{breadcrumbs && breadcrumbs.length > 0 && (
				<nav className="flex items-center gap-1 text-sm text-muted-foreground">
					{breadcrumbs.map((item, index) => {
						const isLast = index === breadcrumbs.length - 1;
						return (
							<span key={item.label} className="flex items-center gap-1">
								{index > 0 && <ChevronRight className="h-4 w-4" />}
								{isLast || !item.href ? (
									<span className="text-foreground font-medium">
										{item.label}
									</span>
								) : (
									<Link
										to={item.href}
										params={item.params}
										className="hover:text-foreground transition-colors"
									>
										{item.label}
									</Link>
								)}
							</span>
						);
					})}
				</nav>
			)}

			<div className={actions ? "flex items-center justify-between" : ""}>
				<div>
					<h2 className="text-2xl font-bold tracking-tight">{title}</h2>
					{description && (
						<p className="text-sm text-muted-foreground mt-1">{description}</p>
					)}
				</div>
				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>
		</>
	);
}
