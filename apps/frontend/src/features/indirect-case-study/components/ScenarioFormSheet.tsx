import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
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
import { getErrorMessage } from "@/lib/form-utils";

type ScenarioFormValues = {
	scenarioName: string;
	description: string;
	hoursPerPerson: number;
	isPrimary: boolean;
};

interface ScenarioFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	defaultValues?: ScenarioFormValues;
	onSubmit: (values: ScenarioFormValues) => Promise<void>;
	isSubmitting: boolean;
}

export function ScenarioFormSheet({
	open,
	onOpenChange,
	mode,
	defaultValues,
	onSubmit,
	isSubmitting,
}: ScenarioFormSheetProps) {
	const form = useForm({
		defaultValues: defaultValues ?? {
			scenarioName: "",
			description: "",
			hoursPerPerson: 160.0,
			isPrimary: false,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
			onOpenChange(false);
		},
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>
						{mode === "create"
							? "キャパシティシナリオを作成"
							: "キャパシティシナリオを編集"}
					</SheetTitle>
					<SheetDescription>
						{mode === "create"
							? "新しいキャパシティシナリオを作成します。"
							: "キャパシティシナリオの情報を編集します。"}
					</SheetDescription>
				</SheetHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-6 mt-6"
				>
					<form.Field
						name="scenarioName"
						validators={{
							onChange: ({ value }) => {
								if (!value || value.length === 0)
									return "名前を入力してください";
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
									type="number"
									step="0.01"
									value={field.state.value}
									onChange={(e) => field.handleChange(Number(e.target.value))}
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
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							キャンセル
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
