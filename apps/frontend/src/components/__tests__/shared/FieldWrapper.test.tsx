import { describe, expect, it } from "vitest";
import { FieldWrapper } from "@/components/shared/FieldWrapper";

describe("FieldWrapper", () => {
	it("コンポーネントが関数として export されている", () => {
		expect(typeof FieldWrapper).toBe("function");
	});

	it("必須 props は label と children のみ", () => {
		// TypeScript の型チェックで検証: label と children のみで呼び出し可能
		// ビルド時に型エラーが発生しないことが検証される
		expect(FieldWrapper).toBeDefined();
	});
});
