import { describe, expect, it } from "vitest";
import type {
	MasterEntity,
	SoftDeletableEntity,
} from "../base-entity";

describe("SoftDeletableEntity", () => {
	it("createdAt, updatedAt を必須フィールドとして持つ", () => {
		const entity: SoftDeletableEntity = {
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};
		expect(entity.createdAt).toBe("2024-01-01T00:00:00Z");
		expect(entity.updatedAt).toBe("2024-01-01T00:00:00Z");
	});

	it("deletedAt をオプショナル nullable フィールドとして持つ", () => {
		const entityWithNull: SoftDeletableEntity = {
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			deletedAt: null,
		};
		expect(entityWithNull.deletedAt).toBeNull();

		const entityWithString: SoftDeletableEntity = {
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			deletedAt: "2024-06-01T00:00:00Z",
		};
		expect(entityWithString.deletedAt).toBe("2024-06-01T00:00:00Z");

		const entityWithoutDeleted: SoftDeletableEntity = {
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};
		expect(entityWithoutDeleted.deletedAt).toBeUndefined();
	});
});

describe("MasterEntity", () => {
	it("SoftDeletableEntity のフィールドに加え name と displayOrder を持つ", () => {
		const entity: MasterEntity = {
			name: "テスト",
			displayOrder: 1,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};
		expect(entity.name).toBe("テスト");
		expect(entity.displayOrder).toBe(1);
		expect(entity.createdAt).toBe("2024-01-01T00:00:00Z");
		expect(entity.updatedAt).toBe("2024-01-01T00:00:00Z");
	});

	it("SoftDeletableEntity を拡張しているため deletedAt も使用可能", () => {
		const entity: MasterEntity = {
			name: "テスト",
			displayOrder: 0,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			deletedAt: "2024-06-01T00:00:00Z",
		};
		expect(entity.deletedAt).toBe("2024-06-01T00:00:00Z");
	});
});

describe("既存エンティティ型との互換性", () => {
	it("WorkType 構造が MasterEntity + 固有フィールドと互換", () => {
		const workType: MasterEntity & {
			workTypeCode: string;
			color: string | null;
		} = {
			workTypeCode: "WT-001",
			name: "開発",
			displayOrder: 1,
			color: "#FF0000",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};
		expect(workType.workTypeCode).toBe("WT-001");
		expect(workType.color).toBe("#FF0000");
	});

	it("BusinessUnit 構造が MasterEntity + 固有フィールドと互換", () => {
		const bu: MasterEntity & { businessUnitCode: string } = {
			businessUnitCode: "BU-001",
			name: "事業部A",
			displayOrder: 0,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};
		expect(bu.businessUnitCode).toBe("BU-001");
	});

	it("ProjectType 構造が MasterEntity + 固有フィールドと互換", () => {
		const pt: MasterEntity & { projectTypeCode: string } = {
			projectTypeCode: "PT-001",
			name: "受託開発",
			displayOrder: 2,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};
		expect(pt.projectTypeCode).toBe("PT-001");
	});
});
