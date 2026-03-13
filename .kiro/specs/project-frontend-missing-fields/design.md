# 設計ドキュメント: project-frontend-missing-fields

## 概要

**目的**: 案件（Project）のフロントエンドUIに不足している7フィールド（年度、通称・略称、客先名、オーダー番号、算出根拠、備考、地域）を追加し、バックエンドAPIとの完全な整合性を実現する。

**ユーザー**: 事業部リーダー・プロジェクトマネージャーが案件情報の入力・閲覧・一覧確認のワークフローで使用する。

**影響**: 既存の案件UIコンポーネント（型定義・フォーム・テーブル・詳細画面）を拡張する。バックエンド変更は不要。

### ゴール
- フロントエンドの `Project` 型・Zodスキーマを7フィールドに対応させる
- 案件フォーム（作成・編集）で7フィールドの入力を可能にする
- 案件一覧テーブルに年度・客先名・オーダー番号の3列を追加する
- 案件詳細画面に7フィールドすべてを表示する

### 非ゴール
- バックエンドAPIの変更（実装済み）
- バルクExport/Import機能の変更（実装済み）
- フォームのセクション分割やレイアウト大幅変更
- `FormTextareaField` 共有コンポーネントの新規作成（将来の必要時に対応）

## アーキテクチャ

### 既存アーキテクチャ分析

案件機能は `features/projects/` 配下にfeature-firstで構成されている。変更対象:

| レイヤー | ファイル | 現在の責務 |
|---------|---------|-----------|
| 型定義 | `features/projects/types/index.ts` | `Project`型、Zodスキーマ、入力型 |
| UIコンポーネント | `features/projects/components/ProjectForm.tsx` | 作成・編集フォーム |
| UIコンポーネント | `features/projects/components/columns.tsx` | テーブル列定義 |
| ルート | `routes/projects/$projectId/index.tsx` | 詳細画面 |
| ルート | `routes/projects/$projectId/edit.tsx` | 編集画面（フォーム呼び出し元） |
| ルート | `routes/projects/new.tsx` | 新規作成画面（フォーム呼び出し元） |

### アーキテクチャ統合

- **選択パターン**: 既存コンポーネント拡張（Option A）
- **ドメイン境界**: `features/projects/` 内で完結。feature間依存なし
- **既存パターン保持**: `FormTextField` + `FieldWrapper` + Zodバリデーション + `DetailRow`
- **新規コンポーネント**: `components/ui/textarea.tsx`（shadcn/ui Textarea）のみ
- **ステアリング準拠**: feature-first構成、`@/` エイリアス、Zod中心の型定義

### 技術スタック

| レイヤー | 選択 / バージョン | 本フィーチャーでの役割 | 備考 |
|---------|------------------|---------------------|------|
| フロントエンド | React 19 + TanStack Form | フォームフィールド追加・バリデーション | 既存パターン踏襲 |
| フロントエンド | TanStack Table | テーブル列定義追加 | 既存パターン踏襲 |
| フロントエンド | Zod v3 | フォームバリデーションスキーマ | 既存パターン踏襲 |
| UIプリミティブ | shadcn/ui（Textarea） | 複数行テキスト入力 | **新規追加** |

## 要件トレーサビリティ

| 要件 | サマリー | コンポーネント | インターフェース |
|------|---------|--------------|----------------|
| 1.1-1.6 | 型定義・Zodスキーマ拡張 | ProjectTypes | Project型、createProjectSchema、updateProjectSchema |
| 2.1-2.7 | フォームフィールド追加 | ProjectForm, Textarea | ProjectFormValues、フォームフィールド |
| 3.1-3.5 | テーブル3列追加 | ProjectColumns | ColumnDef拡張 |
| 4.1-4.3 | 詳細画面7フィールド表示 | ProjectDetailCard | props型拡張 |
| 5.1-5.3 | 互換性保証 | EditPage, NewPage | handleSubmit型、defaultValues |

## コンポーネントとインターフェース

### コンポーネントサマリー

| コンポーネント | ドメイン/レイヤー | 意図 | 要件カバレッジ | 主要依存 | コントラクト |
|--------------|----------------|------|-------------|---------|------------|
| ProjectTypes | 型定義 | 7フィールドの型・スキーマ定義 | 1.1-1.6 | Zod (P0) | — |
| Textarea | UIプリミティブ | 複数行テキスト入力 | 2.4 | — | — |
| ProjectForm | UIコンポーネント | フォームに7入力フィールド追加 | 2.1-2.7 | ProjectTypes (P0), Textarea (P0) | State |
| ProjectColumns | UIコンポーネント | テーブルに3列追加 | 3.1-3.5 | ProjectTypes (P0) | — |
| ProjectDetailCard | ルートコンポーネント | 詳細画面に7フィールド表示 | 4.1-4.3 | ProjectTypes (P0) | — |
| EditPage | ルートコンポーネント | 編集画面のデータ受け渡し | 5.1-5.3 | ProjectForm (P0) | — |
| NewPage | ルートコンポーネント | 新規作成画面のデータ受け渡し | 5.1-5.3 | ProjectForm (P0) | — |

### 型定義レイヤー

#### ProjectTypes

| フィールド | 詳細 |
|----------|------|
| 意図 | Project型とZodスキーマに7フィールドを追加し、フロントエンド全体の型安全性を確保する |
| 要件 | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 |

**責務と制約**
- `Project` インターフェースにバックエンドAPIレスポンスと一致する7フィールドを追加
- `createProjectSchema` と `updateProjectSchema` にバリデーションルールを追加
- `ProjectFormValues` 型は `ProjectForm.tsx` 内のローカル型だが、同様に拡張が必要

**コントラクト**

##### Project 型拡張

```typescript
// 追加フィールド（既存の Project インターフェースに追加）
interface Project extends SoftDeletableEntity {
  // ... 既存フィールド ...
  fiscalYear: number | null;
  nickname: string | null;
  customerName: string | null;
  orderNumber: string | null;
  calculationBasis: string | null;
  remarks: string | null;
  region: string | null;
}
```

##### createProjectSchema 拡張

```typescript
// 追加フィールド（既存スキーマの z.object 内に追加）
fiscalYear: z
  .number({ error: "年度は数値で入力してください" })
  .int("年度は整数で入力してください")
  .nullable()
  .optional(),
nickname: z.string().max(120, "通称・略称は120文字以内で入力してください").optional(),
customerName: z.string().max(120, "客先名は120文字以内で入力してください").optional(),
orderNumber: z.string().max(120, "オーダー番号は120文字以内で入力してください").optional(),
calculationBasis: z.string().max(500, "算出根拠は500文字以内で入力してください").optional(),
remarks: z.string().max(500, "備考は500文字以内で入力してください").optional(),
region: z.string().max(100, "地域は100文字以内で入力してください").optional(),
```

##### updateProjectSchema 拡張

```typescript
// 追加フィールド（既存スキーマの z.object 内に追加）
fiscalYear: z.number().int().nullable().optional(),
nickname: z.string().max(120).nullable().optional(),
customerName: z.string().max(120).nullable().optional(),
orderNumber: z.string().max(120).nullable().optional(),
calculationBasis: z.string().max(500).nullable().optional(),
remarks: z.string().max(500).nullable().optional(),
region: z.string().max(100).nullable().optional(),
```

##### ProjectFormValues 型拡張

```typescript
// ProjectForm.tsx 内のローカル型に追加
type ProjectFormValues = {
  // ... 既存フィールド ...
  fiscalYear: number | null;
  nickname: string;
  customerName: string;
  orderNumber: string;
  calculationBasis: string;
  remarks: string;
  region: string;
};
```

**実装ノート**
- フォーム値は文字列フィールドを `string`（空文字列をデフォルト）、数値フィールドを `number | null` で管理する
- API送信時に空文字列を `undefined` に変換する（既存の `projectTypeCode` パターンと同様）

### UIプリミティブレイヤー

#### Textarea

| フィールド | 詳細 |
|----------|------|
| 意図 | shadcn/ui 準拠の複数行テキスト入力コンポーネント |
| 要件 | 2.4 |

**責務と制約**
- `<textarea>` のスタイルラッパー
- `Input` コンポーネントと同じスタイリングパターン（`cn()` でクラス名マージ）
- `forwardRef` でref転送対応

**配置**: `apps/frontend/src/components/ui/textarea.tsx`

**実装ノート**
- shadcn/ui の標準 Textarea パターンに従う（20行未満のシンプルなコンポーネント）
- 詳細は `research.md` の「Textarea の導入方法」を参照

### UIコンポーネントレイヤー

#### ProjectForm

| フィールド | 詳細 |
|----------|------|
| 意図 | 案件フォームに7入力フィールドを追加する |
| 要件 | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7 |

**責務と制約**
- 既存8フィールドの後に7フィールドを追加
- `calculationBasis` と `remarks` は `Textarea` + `FieldWrapper` で実装
- その他のフィールドは既存の `FormTextField` パターンを踏襲
- `fiscalYear` は `durationMonths` と同じ nullable 数値入力パターン

**依存**
- Inbound: EditPage, NewPage — フォーム値の受け渡し (P0)
- Outbound: ProjectTypes — Zodスキーマによるバリデーション (P0)
- Outbound: Textarea — 複数行テキスト入力 (P0)
- Outbound: FormTextField, FieldWrapper — 既存共有コンポーネント (P0)

**コントラクト**: State [x]

##### State 管理

フォームのデフォルト値（7フィールド分）:

```typescript
// useForm defaultValues に追加
fiscalYear: null as number | null,
nickname: "",
customerName: "",
orderNumber: "",
calculationBasis: "",
remarks: "",
region: "",
```

編集モード時のデフォルト値マッピング（`defaultValues` prop から）:

```typescript
// editページ側の defaultValues
fiscalYear: project.fiscalYear,        // number | null → そのまま
nickname: project.nickname ?? "",       // string | null → 空文字列に変換
customerName: project.customerName ?? "",
orderNumber: project.orderNumber ?? "",
calculationBasis: project.calculationBasis ?? "",
remarks: project.remarks ?? "",
region: project.region ?? "",
```

**フィールド配置順序（既存フィールドの後）**:

| # | フィールド | 入力タイプ | バリデーション |
|---|-----------|----------|--------------|
| 1 | fiscalYear | 数値入力（nullable） | 任意、整数 |
| 2 | nickname | テキスト入力 | 任意、最大120文字 |
| 3 | customerName | テキスト入力 | 任意、最大120文字 |
| 4 | orderNumber | テキスト入力 | 任意、最大120文字 |
| 5 | calculationBasis | テキストエリア | 任意、最大500文字 |
| 6 | remarks | テキストエリア | 任意、最大500文字 |
| 7 | region | テキスト入力 | 任意、最大100文字 |

**実装ノート**
- `fiscalYear` の入力パターンは既存の `durationMonths` を参照（`normalizeNumericInput` + `null` 変換）
- Textarea フィールドは `FieldWrapper` でラップし、`field.state.meta.errors` をエラー表示に使用
- 送信時の空文字列→`undefined` 変換は呼び出し元（EditPage, NewPage）の `handleSubmit` で行う

#### ProjectColumns

| フィールド | 詳細 |
|----------|------|
| 意図 | テーブルに年度・客先名・オーダー番号の3列を追加する |
| 要件 | 3.1, 3.2, 3.3, 3.4, 3.5 |

**責務と制約**
- `name` 列の直後に `fiscalYear` → `customerName` → `orderNumber` の順で3列を挿入
- 空値は `—`（emダッシュ）で表示（既存の `projectTypeName` パターンと同様）
- 各列に `SortableHeader` を適用

**列定義**:

| accessorKey | ヘッダーラベル | セル表示 | ソート |
|-------------|-------------|---------|------|
| `fiscalYear` | 年度 | `row.original.fiscalYear ?? "—"` | SortableHeader |
| `customerName` | 客先名 | `row.original.customerName ?? "—"` | SortableHeader |
| `orderNumber` | オーダー番号 | `row.original.orderNumber ?? "—"` | SortableHeader |

**実装ノート**
- 挿入位置: `projectTypeName` 列の直後、`startYearMonth` 列の前

### ルートコンポーネントレイヤー

#### ProjectDetailCard

| フィールド | 詳細 |
|----------|------|
| 意図 | 詳細画面に7フィールドの表示を追加する |
| 要件 | 4.1, 4.2, 4.3 |

**責務と制約**
- `ProjectDetailCard` のインラインprops型に7フィールドを追加
- 各フィールドを `DetailRow` コンポーネントで表示
- 空値は `"—"` で表示（既存パターンと同様）

**フィールド表示順序（既存フィールドの後、ステータスの前）**:

| # | ラベル | 値の表示 |
|---|------|---------|
| 1 | 年度 | `project.fiscalYear ?? "—"` |
| 2 | 通称・略称 | `project.nickname ?? "—"` |
| 3 | 客先名 | `project.customerName ?? "—"` |
| 4 | オーダー番号 | `project.orderNumber ?? "—"` |
| 5 | 算出根拠 | `project.calculationBasis ?? "—"` |
| 6 | 備考 | `project.remarks ?? "—"` |
| 7 | 地域 | `project.region ?? "—"` |

#### EditPage / NewPage

| フィールド | 詳細 |
|----------|------|
| 意図 | フォーム呼び出し元の型・データ受け渡しを7フィールドに対応させる |
| 要件 | 5.1, 5.2, 5.3 |

**責務と制約**
- `handleSubmit` の `values` 型に7フィールドを追加
- EditPage: `defaultValues` に `project` から7フィールドをマッピング（`?? ""` で null→空文字列変換）
- NewPage/EditPage: `mutateAsync` 呼び出し時に空文字列を `undefined` に変換（既存の `projectTypeCode` パターン: `values.xxx || undefined`）

**実装ノート**
- `handleSubmit` の値変換パターン:
  - 文字列フィールド: `values.nickname || undefined`（空文字列→undefined）
  - 数値フィールド: `values.fiscalYear ?? undefined`（null→undefined）

## データモデル

### ドメインモデル

DB・APIのデータモデル変更は不要（バックエンド実装済み）。フロントエンドの型定義のみ変更。

**フロントエンド Project 型の7フィールド追加**:

| フィールド | 型 | null許容 | 備考 |
|-----------|-----|---------|------|
| `fiscalYear` | `number` | `null` | 整数（年度） |
| `nickname` | `string` | `null` | 最大120文字 |
| `customerName` | `string` | `null` | 最大120文字 |
| `orderNumber` | `string` | `null` | 最大120文字 |
| `calculationBasis` | `string` | `null` | 最大500文字 |
| `remarks` | `string` | `null` | 最大500文字 |
| `region` | `string` | `null` | 最大100文字 |

## エラーハンドリング

### エラー戦略

既存のフォームバリデーションパターンを踏襲する。新規のエラーカテゴリは不要。

### エラーカテゴリ

**ユーザーエラー（バリデーション）**:
- 文字数超過 → Zodスキーマによるフィールドレベルバリデーション → エラーメッセージをフィールド下に表示
- `fiscalYear` に非整数値 → Zodスキーマバリデーション → エラーメッセージ表示

**APIエラー**: 既存のエラーハンドリング（`ApiError` + `toast`）がそのまま適用される。変更不要。

## テスト戦略

### TypeScript型チェック
- `pnpm --filter frontend build` でTypeScriptコンパイルエラーがないことを確認

### 既存テスト
- `pnpm test` で既存テストがすべてパスすることを確認

### 手動確認項目
- 案件新規作成フォームで7フィールドが入力可能であること
- 案件編集フォームで7フィールドの既存値が初期表示されること
- 文字数制約超過時にバリデーションエラーが表示されること
- 案件一覧テーブルに年度・客先名・オーダー番号の3列が表示されること
- 案件詳細画面に7フィールドが表示されること
- 空値のフィールドが「—」で表示されること
