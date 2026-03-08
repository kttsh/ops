import { useForm } from "@tanstack/react-form";
import { Loader2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailRow } from "@/components/shared/DetailRow";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { MasterSheetState } from "@/hooks/useMasterSheet";
import { getErrorMessage } from "@/lib/form-utils";
import { formatDateTime } from "@/lib/format-utils";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";
import {
	useCreateCapacityScenario,
	useDeleteCapacityScenario,
	useRestoreCapacityScenario,
	useUpdateCapacityScenario,
} from "../api/mutations";
import type { CapacityScenario } from "../types";

function getEntityId(state: MasterSheetState<CapacityScenario>): number {
	if (state.mode === "view" || state.mode === "edit") {
		return state.entity.capacityScenarioId;
	}
	return 0;
}

interface CapacityScenarioDetailSheetProps {
	sheetState: MasterSheetState<CapacityScenario>;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	openEdit: () => void;
	openView: (updatedEntity?: CapacityScenario) => void;
	close: () => void;
	onMutationSuccess: () => void;
}

type ScenarioFormValues = {
	scenarioName: string;
	description: string;
	hoursPerPerson: number;
	isPrimary: boolean;
};

function ScenarioForm({
	mode,
	defaultValues,
	onSubmit,
	isSubmitting,
	onCancel,
}: {
	mode: "create" | "edit";
	defaultValues?: ScenarioFormValues;
	onSubmit: (values: ScenarioFormValues) => Promise<void>;
	isSubmitting: boolean;
	onCancel?: () => void;
}) {
	const form = useForm({
		defaultValues: defaultValues ?? {
			scenarioName: "",
			description: "",
			hoursPerPerson: 160.0,
			isPrimary: false,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			<form.Field
				name="scenarioName"
				validators={{
					onChange: ({ value }) => {
						if (!value || value.length === 0) return "名前を入力してください";
						if (value.length > 100)
							return "名前は100文字以内で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							シナリオ名
							<span className="text-destructive ml-1">*</span>
						</Label>
						<Input
							id={field.name}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							placeholder="例: 定時ベース"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field
				name="description"
				validators={{
					onChange: ({ value }) => {
						if (value && value.length > 500)
							return "説明は500文字以内で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>説明</Label>
						<Input
							id={field.name}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							placeholder="任意の説明"
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field
				name="hoursPerPerson"
				validators={{
					onChange: ({ value }) => {
						if (typeof value !== "number") return "数値を入力してください";
						if (value <= 0) return "0超〜744の範囲で入力してください";
						if (value > 744) return "0超〜744の範囲で入力してください";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>
							1人当たり月間労働時間（h）
							<span className="text-destructive ml-1">*</span>
						</Label>
						<Input
							id={field.name}
							type="text"
							inputMode="decimal"
							step="0.01"
							value={field.state.value}
							onChange={(e) => {
								const normalized = normalizeNumericInput(e.target.value, {
									allowDecimal: true,
								});
								field.handleChange(normalized === "" ? 0 : Number(normalized));
							}}
							onBlur={field.handleBlur}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-sm text-destructive">
								{getErrorMessage(field.state.meta.errors)}
							</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field name="isPrimary">
				{(field) => (
					<div className="flex items-center gap-3">
						<Switch
							id={field.name}
							checked={field.state.value}
							onCheckedChange={(checked) => field.handleChange(checked)}
						/>
						<Label htmlFor={field.name}>プライマリ</Label>
					</div>
				)}
			</form.Field>

			<div className="flex gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					{mode === "create" ? "作成" : "保存"}
				</Button>
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						キャンセル
					</Button>
				)}
			</div>
		</form>
	);
}

export function CapacityScenarioDetailSheet({
	sheetState,
	isOpen,
	onOpenChange,
	openEdit,
	openView,
	close,
	onMutationSuccess,
}: CapacityScenarioDetailSheetProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

	const entityId = getEntityId(sheetState);
	const createMutation = useCreateCapacityScenario();
	const updateMutation = useUpdateCapacityScenario();
	const deleteMutation = useDeleteCapacityScenario();
	const restoreMutation = useRestoreCapacityScenario();

	const handleCreate = async (values: ScenarioFormValues) => {
		try {
			await createMutation.mutateAsync(values);
			close();
			onMutationSuccess();
		} catch {
			// エラートーストは mutation hook で表示済み
		}
	};

	const handleUpdate = async (values: ScenarioFormValues) => {
		try {
			await updateMutation.mutateAsync({ id: entityId, input: values });
			close();
			onMutationSuccess();
		} catch {
			// エラートーストは mutation hook で表示済み
		}
	};

	const handleDelete = async () => {
		if (sheetState.mode !== "view" && sheetState.mode !== "edit") return;
		try {
			await deleteMutation.mutateAsync(entityId);
			setDeleteDialogOpen(false);
			close();
			onMutationSuccess();
		} catch {
			setDeleteDialogOpen(false);
		}
	};

	const handleRestore = async () => {
		if (sheetState.mode !== "view" && sheetState.mode !== "edit") return;
		try {
			await restoreMutation.mutateAsync(entityId);
			setRestoreDialogOpen(false);
			close();
			onMutationSuccess();
		} catch {
			setRestoreDialogOpen(false);
		}
	};

	const sheetTitle = () => {
		switch (sheetState.mode) {
			case "view":
				return "稼働時間シナリオ 詳細";
			case "edit":
				return "稼働時間シナリオ 編集";
			case "create":
				return "稼働時間シナリオ 新規登録";
			default:
				return "";
		}
	};

	const sheetDescription = () => {
		switch (sheetState.mode) {
			case "view":
				return "稼働時間シナリオの詳細を表示しています";
			case "edit":
				return "稼働時間シナリオ情報を編集します";
			case "create":
				return "新しい稼働時間シナリオを登録します";
			default:
				return "";
		}
	};

	return (
		<>
			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-lg overflow-y-auto"
				>
					<SheetHeader>
						<SheetTitle>{sheetTitle()}</SheetTitle>
						<SheetDescription>{sheetDescription()}</SheetDescription>
					</SheetHeader>

					<div className="mt-6">
						{sheetState.mode === "view" && (
							<div className="space-y-6">
								<div className="space-y-4">
									<DetailRow
										label="シナリオ名"
										value={sheetState.entity.scenarioName}
									/>
									<DetailRow
										label="説明"
										value={sheetState.entity.description ?? "-"}
									/>
									<DetailRow
										label="1人当たり月間労働時間"
										value={`${sheetState.entity.hoursPerPerson} 時間/人`}
									/>
									<div className="grid grid-cols-3 gap-4">
										<dt className="text-sm font-medium text-muted-foreground">
											プライマリ
										</dt>
										<dd className="col-span-2 text-sm">
											{sheetState.entity.isPrimary ? (
												<Badge variant="secondary">Primary</Badge>
											) : (
												"-"
											)}
										</dd>
									</div>
									<DetailRow
										label="更新日時"
										value={formatDateTime(sheetState.entity.updatedAt)}
									/>
								</div>
								<div className="flex gap-3 pt-4">
									<Button variant="outline" onClick={openEdit}>
										<Pencil className="h-4 w-4" />
										編集
									</Button>
									{sheetState.entity.deletedAt ? (
										<Button
											variant="outline"
											onClick={() => setRestoreDialogOpen(true)}
										>
											<RotateCcw className="h-4 w-4" />
											復元
										</Button>
									) : (
										<Button
											variant="destructive"
											onClick={() => setDeleteDialogOpen(true)}
										>
											<Trash2 className="h-4 w-4" />
											削除
										</Button>
									)}
								</div>
							</div>
						)}

						{sheetState.mode === "edit" && (
							<div className="space-y-4">
								<ScenarioForm
									mode="edit"
									defaultValues={{
										scenarioName: sheetState.entity.scenarioName,
										description: sheetState.entity.description ?? "",
										hoursPerPerson: sheetState.entity.hoursPerPerson,
										isPrimary: sheetState.entity.isPrimary,
									}}
									onSubmit={handleUpdate}
									isSubmitting={updateMutation.isPending}
									onCancel={() => openView()}
								/>
							</div>
						)}

						{sheetState.mode === "create" && (
							<ScenarioForm
								mode="create"
								onSubmit={handleCreate}
								isSubmitting={createMutation.isPending}
							/>
						)}
					</div>
				</SheetContent>
			</Sheet>

			{(sheetState.mode === "view" || sheetState.mode === "edit") && (
				<>
					<DeleteConfirmDialog
						open={deleteDialogOpen}
						onOpenChange={setDeleteDialogOpen}
						onConfirm={handleDelete}
						isDeleting={deleteMutation.isPending}
						entityLabel="シナリオ"
						entityName={sheetState.entity.scenarioName}
					/>
					<RestoreConfirmDialog
						open={restoreDialogOpen}
						onOpenChange={setRestoreDialogOpen}
						onConfirm={handleRestore}
						entityLabel="シナリオ"
						isLoading={restoreMutation.isPending}
					/>
				</>
			)}
		</>
	);
}
