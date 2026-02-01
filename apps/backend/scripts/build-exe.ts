import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

await build({
	entryPoints: [path.resolve(root, "src/index.ts")],
	bundle: true,
	platform: "node",
	target: "node20",
	format: "cjs",
	outfile: path.resolve(root, "bin/backend.cjs"),
	minify: true,
	sourcemap: false,
	alias: {
		"@": path.resolve(root, "src"),
	},
	banner: {
		js: "#!/usr/bin/env node",
	},
});

console.log("Build complete: bin/backend.cjs");
