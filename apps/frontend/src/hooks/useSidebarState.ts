import { useCallback, useState } from "react";

const STORAGE_KEY = "sidebar-collapsed";

export type UseSidebarStateReturn = {
	collapsed: boolean;
	toggle: () => void;
};

export function useSidebarState(): UseSidebarStateReturn {
	const [collapsed, setCollapsed] = useState<boolean>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) === "true";
		} catch {
			return false;
		}
	});

	const toggle = useCallback(() => {
		setCollapsed((prev) => {
			const next = !prev;
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch {
				// localStorage unavailable — silent fallback
			}
			return next;
		});
	}, []);

	return { collapsed, toggle };
}
