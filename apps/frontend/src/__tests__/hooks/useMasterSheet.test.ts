import { describe, expect, it } from "vitest";
import {
	createMasterSheetActions,
	type MasterSheetState,
} from "@/hooks/useMasterSheet";

type TestEntity = {
	code: string;
	name: string;
};

describe("MasterSheetState", () => {
	describe("初期状態", () => {
		it("closed 状態で開始する", () => {
			const initial: MasterSheetState<TestEntity> = { mode: "closed" };
			expect(initial.mode).toBe("closed");
		});
	});

	describe("createMasterSheetActions", () => {
		it("openView: closed → view に遷移し entity を保持する", () => {
			const entity: TestEntity = { code: "T001", name: "テスト" };
			const state = createMasterSheetActions<TestEntity>({ mode: "closed" });
			const next = state.openView(entity);
			expect(next).toEqual({ mode: "view", entity });
		});

		it("openCreate: closed → create に遷移する", () => {
			const state = createMasterSheetActions<TestEntity>({ mode: "closed" });
			const next = state.openCreate();
			expect(next).toEqual({ mode: "create" });
		});

		it("switchToEdit: view → edit に遷移し entity を維持する", () => {
			const entity: TestEntity = { code: "T001", name: "テスト" };
			const state = createMasterSheetActions<TestEntity>({
				mode: "view",
				entity,
			});
			const next = state.switchToEdit();
			expect(next).toEqual({ mode: "edit", entity });
		});

		it("switchToView: edit → view に遷移する（entity 維持）", () => {
			const entity: TestEntity = { code: "T001", name: "テスト" };
			const state = createMasterSheetActions<TestEntity>({
				mode: "edit",
				entity,
			});
			const next = state.switchToView();
			expect(next).toEqual({ mode: "view", entity });
		});

		it("switchToView: updatedEntity を渡すと新しい entity で view に遷移する", () => {
			const entity: TestEntity = { code: "T001", name: "テスト" };
			const updated: TestEntity = { code: "T001", name: "更新後" };
			const state = createMasterSheetActions<TestEntity>({
				mode: "edit",
				entity,
			});
			const next = state.switchToView(updated);
			expect(next).toEqual({ mode: "view", entity: updated });
		});

		it("close: view → closed に遷移する", () => {
			const entity: TestEntity = { code: "T001", name: "テスト" };
			const state = createMasterSheetActions<TestEntity>({
				mode: "view",
				entity,
			});
			const next = state.close();
			expect(next).toEqual({ mode: "closed" });
		});

		it("close: create → closed に遷移する", () => {
			const state = createMasterSheetActions<TestEntity>({
				mode: "create",
			});
			const next = state.close();
			expect(next).toEqual({ mode: "closed" });
		});

		it("close: edit → closed に遷移する", () => {
			const entity: TestEntity = { code: "T001", name: "テスト" };
			const state = createMasterSheetActions<TestEntity>({
				mode: "edit",
				entity,
			});
			const next = state.close();
			expect(next).toEqual({ mode: "closed" });
		});
	});

	describe("isOpen 導出", () => {
		function isOpen(state: MasterSheetState<TestEntity>): boolean {
			return state.mode !== "closed";
		}

		it("closed の場合 false", () => {
			expect(isOpen({ mode: "closed" })).toBe(false);
		});

		it("view の場合 true", () => {
			expect(
				isOpen({
					mode: "view",
					entity: { code: "T001", name: "テスト" },
				}),
			).toBe(true);
		});

		it("edit の場合 true", () => {
			expect(
				isOpen({
					mode: "edit",
					entity: { code: "T001", name: "テスト" },
				}),
			).toBe(true);
		});

		it("create の場合 true", () => {
			expect(isOpen({ mode: "create" })).toBe(true);
		});
	});
});
