import { describe, expect, it } from "vitest";
import { FormTextField } from "@/components/shared/FormTextField";

describe("FormTextField", () => {
	it("コンポーネントが関数として export されている", () => {
		expect(typeof FormTextField).toBe("function");
	});
});
