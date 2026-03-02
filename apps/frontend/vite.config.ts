import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const apiPort = env.VITE_API_PORT || "3009";

	return {
		base: "/ops/",
		plugins: [TanStackRouterVite(), react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						"vendor-router": ["@tanstack/react-router"],
						"vendor-query": ["@tanstack/react-query"],
						"vendor-table": ["@tanstack/react-table"],
						"vendor-form": ["@tanstack/react-form"],
						"vendor-radix": [
							"@radix-ui/react-alert-dialog",
							"@radix-ui/react-collapsible",
							"@radix-ui/react-dialog",
							"@radix-ui/react-label",
							"@radix-ui/react-select",
							"@radix-ui/react-separator",
							"@radix-ui/react-slot",
							"@radix-ui/react-switch",
							"@radix-ui/react-tooltip",
						],
					},
				},
			},
		},
		server: {
			proxy: {
				"/api/ops": {
					target: `http://localhost:${apiPort}`,
					changeOrigin: true,
				},
			},
		},
	};
});
