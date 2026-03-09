import { describe, expect, it } from "vitest";
import type { Project } from "@/features/workload/types";
import {
	getDefaultCase,
	hasNonDefaultCaseSelection,
	initializeCaseSelection,
	syncCaseSelectionWithProjects,
} from "../case-selection";

// テストヘルパー: 最小限の Project を生成
function createProject(
	overrides: Partial<Project> & { projectId: number },
): Project {
	return {
		projectCode: `P${overrides.projectId}`,
		name: `案件${overrides.projectId}`,
		businessUnitCode: "BU001",
		businessUnitName: "事業部A",
		projectTypeCode: null,
		projectTypeName: null,
		startYearMonth: "202501",
		totalManhour: 100,
		status: "confirmed",
		durationMonths: 12,
		createdAt: "",
		updatedAt: "",
		deletedAt: null,
		cases: [],
		...overrides,
	};
}

describe("getDefaultCase", () => {
	it("isPrimary のケースを返す", () => {
		const cases = [
			{ projectCaseId: 10, caseName: "楽観", isPrimary: false },
			{ projectCaseId: 11, caseName: "標準", isPrimary: true },
			{ projectCaseId: 12, caseName: "悲観", isPrimary: false },
		];
		expect(getDefaultCase(cases)).toEqual(cases[1]);
	});

	it("isPrimary がない場合は最初のケースを返す", () => {
		const cases = [
			{ projectCaseId: 10, caseName: "楽観", isPrimary: false },
			{ projectCaseId: 11, caseName: "標準", isPrimary: false },
		];
		expect(getDefaultCase(cases)).toEqual(cases[0]);
	});

	it("ケースが空の場合は undefined を返す", () => {
		expect(getDefaultCase([])).toBeUndefined();
	});
});

describe("initializeCaseSelection", () => {
	it("各案件の isPrimary ケースをデフォルト選択する", () => {
		const projects = [
			createProject({
				projectId: 1,
				cases: [
					{ projectCaseId: 10, caseName: "楽観", isPrimary: false },
					{ projectCaseId: 11, caseName: "標準", isPrimary: true },
				],
			}),
			createProject({
				projectId: 2,
				cases: [{ projectCaseId: 20, caseName: "標準", isPrimary: true }],
			}),
		];
		const selected = new Set([1, 2]);
		const result = initializeCaseSelection(projects, selected);

		expect(result.get(1)).toBe(11);
		expect(result.get(2)).toBe(20);
		expect(result.size).toBe(2);
	});

	it("isPrimary なしの場合は最初のケースを選択する", () => {
		const projects = [
			createProject({
				projectId: 1,
				cases: [
					{ projectCaseId: 10, caseName: "A", isPrimary: false },
					{ projectCaseId: 11, caseName: "B", isPrimary: false },
				],
			}),
		];
		const result = initializeCaseSelection(projects, new Set([1]));
		expect(result.get(1)).toBe(10);
	});

	it("ケースが空の案件はエントリに含めない", () => {
		const projects = [createProject({ projectId: 1, cases: [] })];
		const result = initializeCaseSelection(projects, new Set([1]));
		expect(result.size).toBe(0);
	});

	it("選択されていない案件は含めない", () => {
		const projects = [
			createProject({
				projectId: 1,
				cases: [{ projectCaseId: 10, caseName: "標準", isPrimary: true }],
			}),
			createProject({
				projectId: 2,
				cases: [{ projectCaseId: 20, caseName: "標準", isPrimary: true }],
			}),
		];
		const result = initializeCaseSelection(projects, new Set([1]));
		expect(result.size).toBe(1);
		expect(result.has(2)).toBe(false);
	});
});

describe("hasNonDefaultCaseSelection", () => {
	const projects = [
		createProject({
			projectId: 1,
			cases: [
				{ projectCaseId: 10, caseName: "楽観", isPrimary: false },
				{ projectCaseId: 11, caseName: "標準", isPrimary: true },
			],
		}),
		createProject({
			projectId: 2,
			cases: [
				{ projectCaseId: 20, caseName: "標準", isPrimary: true },
				{ projectCaseId: 21, caseName: "悲観", isPrimary: false },
			],
		}),
	];

	it("全デフォルト時は false を返す", () => {
		const map = new Map([
			[1, 11],
			[2, 20],
		]);
		expect(hasNonDefaultCaseSelection(map, projects)).toBe(false);
	});

	it("1件でも非デフォルトケースが選択されていれば true を返す", () => {
		const map = new Map([
			[1, 10], // 非デフォルト
			[2, 20],
		]);
		expect(hasNonDefaultCaseSelection(map, projects)).toBe(true);
	});

	it("空 Map の場合は false を返す", () => {
		expect(hasNonDefaultCaseSelection(new Map(), projects)).toBe(false);
	});

	it("該当案件が存在しない場合は無視する", () => {
		const map = new Map([
			[999, 100], // 存在しない案件
		]);
		expect(hasNonDefaultCaseSelection(map, projects)).toBe(false);
	});
});

describe("syncCaseSelectionWithProjects", () => {
	const projects = [
		createProject({
			projectId: 1,
			cases: [
				{ projectCaseId: 10, caseName: "楽観", isPrimary: false },
				{ projectCaseId: 11, caseName: "標準", isPrimary: true },
			],
		}),
		createProject({
			projectId: 2,
			cases: [{ projectCaseId: 20, caseName: "標準", isPrimary: true }],
		}),
		createProject({
			projectId: 3,
			cases: [
				{ projectCaseId: 30, caseName: "A", isPrimary: false },
				{ projectCaseId: 31, caseName: "B", isPrimary: false },
			],
		}),
	];

	it("新規チェック案件にデフォルトケースを自動選択する", () => {
		const prev = new Map([[1, 10]]);
		const newSelected = new Set([1, 2]);
		const result = syncCaseSelectionWithProjects(prev, newSelected, projects);

		expect(result.get(1)).toBe(10); // 既存は維持
		expect(result.get(2)).toBe(20); // 新規はデフォルト（isPrimary）
	});

	it("チェック解除された案件のケース状態をクリアする", () => {
		const prev = new Map([
			[1, 10],
			[2, 20],
		]);
		const newSelected = new Set([1]); // 案件2をチェック解除
		const result = syncCaseSelectionWithProjects(prev, newSelected, projects);

		expect(result.size).toBe(1);
		expect(result.has(2)).toBe(false);
	});

	it("既に選択済みの案件のケース選択状態を維持する", () => {
		const prev = new Map([
			[1, 10], // 非デフォルト（楽観）を選択中
		]);
		const newSelected = new Set([1, 2]);
		const result = syncCaseSelectionWithProjects(prev, newSelected, projects);

		expect(result.get(1)).toBe(10); // カスタム選択を維持
	});

	it("再チェック時はデフォルトケースで再選択する", () => {
		// 最初に案件1を選択（カスタムケース）
		const prev = new Map<number, number>(); // チェック解除後
		const newSelected = new Set([1]); // 再チェック
		const result = syncCaseSelectionWithProjects(prev, newSelected, projects);

		expect(result.get(1)).toBe(11); // デフォルト（isPrimary）で復元
	});

	it("isPrimary なしの案件の新規チェック時は最初のケースを選択する", () => {
		const prev = new Map<number, number>();
		const newSelected = new Set([3]);
		const result = syncCaseSelectionWithProjects(prev, newSelected, projects);

		expect(result.get(3)).toBe(30); // 最初のケース
	});
});
