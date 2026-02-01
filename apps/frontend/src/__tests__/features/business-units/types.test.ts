import { describe, expect, it } from "vitest";
import {
	businessUnitSearchSchema,
	createBusinessUnitSchema,
	updateBusinessUnitSchema,
} from "@/features/business-units/types";

describe("createBusinessUnitSchema", () => {
	it("正常値を受け入れる", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "BU-001",
			name: "テスト事業部",
			displayOrder: 1,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.businessUnitCode).toBe("BU-001");
			expect(result.data.name).toBe("テスト事業部");
			expect(result.data.displayOrder).toBe(1);
		}
	});

	it("displayOrderのデフォルト値が0", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "BU-001",
			name: "テスト事業部",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.displayOrder).toBe(0);
		}
	});

	it("空のbusinessUnitCodeを拒否する", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "",
			name: "テスト事業部",
		});
		expect(result.success).toBe(false);
	});

	it("21文字以上のbusinessUnitCodeを拒否する", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "A".repeat(21),
			name: "テスト事業部",
		});
		expect(result.success).toBe(false);
	});

	it("日本語を含むbusinessUnitCodeを拒否する", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "テスト",
			name: "テスト事業部",
		});
		expect(result.success).toBe(false);
	});

	it("英数字・ハイフン・アンダースコアのbusinessUnitCodeを受け入れる", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "BU_test-01",
			name: "テスト事業部",
		});
		expect(result.success).toBe(true);
	});

	it("空の名称を拒否する", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "BU-001",
			name: "",
		});
		expect(result.success).toBe(false);
	});

	it("101文字以上の名称を拒否する", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "BU-001",
			name: "A".repeat(101),
		});
		expect(result.success).toBe(false);
	});

	it("負の表示順を拒否する", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "BU-001",
			name: "テスト",
			displayOrder: -1,
		});
		expect(result.success).toBe(false);
	});

	it("小数の表示順を拒否する", () => {
		const result = createBusinessUnitSchema.safeParse({
			businessUnitCode: "BU-001",
			name: "テスト",
			displayOrder: 1.5,
		});
		expect(result.success).toBe(false);
	});
});

describe("updateBusinessUnitSchema", () => {
	it("正常値を受け入れる", () => {
		const result = updateBusinessUnitSchema.safeParse({
			name: "更新済み事業部",
			displayOrder: 5,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("更新済み事業部");
			expect(result.data.displayOrder).toBe(5);
		}
	});

	it("displayOrderは省略可能", () => {
		const result = updateBusinessUnitSchema.safeParse({
			name: "更新済み事業部",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.displayOrder).toBeUndefined();
		}
	});

	it("空の名称を拒否する", () => {
		const result = updateBusinessUnitSchema.safeParse({
			name: "",
		});
		expect(result.success).toBe(false);
	});

	it("101文字以上の名称を拒否する", () => {
		const result = updateBusinessUnitSchema.safeParse({
			name: "A".repeat(101),
		});
		expect(result.success).toBe(false);
	});
});

describe("businessUnitSearchSchema", () => {
	it("デフォルト値を提供する", () => {
		const result = businessUnitSearchSchema.parse({});
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(20);
		expect(result.search).toBe("");
		expect(result.includeDisabled).toBe(false);
	});

	it("指定した値を受け入れる", () => {
		const result = businessUnitSearchSchema.parse({
			page: 3,
			pageSize: 50,
			search: "テスト",
			includeDisabled: true,
		});
		expect(result.page).toBe(3);
		expect(result.pageSize).toBe(50);
		expect(result.search).toBe("テスト");
		expect(result.includeDisabled).toBe(true);
	});

	it("不正なpage値をフォールバックする", () => {
		const result = businessUnitSearchSchema.parse({
			page: -1,
		});
		expect(result.page).toBe(1);
	});

	it("不正なpageSize値をフォールバックする", () => {
		const result = businessUnitSearchSchema.parse({
			pageSize: 999,
		});
		expect(result.pageSize).toBe(20);
	});

	it("不正なincludeDisabled値をフォールバックする", () => {
		const result = businessUnitSearchSchema.parse({
			includeDisabled: "invalid",
		});
		expect(result.includeDisabled).toBe(false);
	});
});
