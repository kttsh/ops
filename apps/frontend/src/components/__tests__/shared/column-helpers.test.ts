import { describe, expect, it } from "vitest";
import {
	createDateTimeColumn,
	createRestoreActionColumn,
	createSortableColumn,
	createStatusColumn,
} from "@/components/shared/column-helpers";

type TestEntity = {
	code: string;
	name: string;
	updatedAt: string;
	deletedAt?: string | null;
};

describe("createStatusColumn", () => {
	it("id が 'status' のカラム定義を返す", () => {
		const column = createStatusColumn<TestEntity>();
		expect(column.id).toBe("status");
	});

	it("デフォルトのヘッダーが 'ステータス' である", () => {
		const column = createStatusColumn<TestEntity>();
		expect(column.header).toBe("ステータス");
	});

	it("カスタムの id と header を設定できる", () => {
		const column = createStatusColumn<TestEntity>({
			id: "customStatus",
			header: "状態",
		});
		expect(column.id).toBe("customStatus");
		expect(column.header).toBe("状態");
	});

	it("cell 関数が存在する", () => {
		const column = createStatusColumn<TestEntity>();
		expect(typeof column.cell).toBe("function");
	});
});

describe("createRestoreActionColumn", () => {
	it("id が 'actions' のカラム定義を返す", () => {
		const column = createRestoreActionColumn<TestEntity, string>({
			idKey: "code",
		});
		expect(column.id).toBe("actions");
	});

	it("cell 関数が存在する", () => {
		const column = createRestoreActionColumn<TestEntity, string>({
			idKey: "code",
		});
		expect(typeof column.cell).toBe("function");
	});
});

describe("createDateTimeColumn", () => {
	it("指定された accessorKey を持つカラム定義を返す", () => {
		const column = createDateTimeColumn<TestEntity>({
			accessorKey: "updatedAt",
			label: "更新日時",
		});
		expect(column.accessorKey).toBe("updatedAt");
	});

	it("header 関数が存在する", () => {
		const column = createDateTimeColumn<TestEntity>({
			accessorKey: "updatedAt",
			label: "更新日時",
		});
		expect(typeof column.header).toBe("function");
	});

	it("cell 関数が存在する", () => {
		const column = createDateTimeColumn<TestEntity>({
			accessorKey: "updatedAt",
			label: "更新日時",
		});
		expect(typeof column.cell).toBe("function");
	});
});

describe("createSortableColumn", () => {
	it("指定された accessorKey を持つカラム定義を返す", () => {
		const column = createSortableColumn<TestEntity>({
			accessorKey: "name",
			label: "名称",
		});
		expect(column.accessorKey).toBe("name");
	});

	it("header 関数が存在する", () => {
		const column = createSortableColumn<TestEntity>({
			accessorKey: "name",
			label: "名称",
		});
		expect(typeof column.header).toBe("function");
	});
});
