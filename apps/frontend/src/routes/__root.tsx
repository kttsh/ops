import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";

type RouterContext = {
	queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
});

function RootComponent() {
	return (
		<AppShell>
			<Outlet />
			<Toaster position="top-right" richColors closeButton />
		</AppShell>
	);
}
