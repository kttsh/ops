# Research & Design Decisions

## Summary
- **Feature**: `frontend-common-utils`
- **Discovery Scope**: Extension（既存コードからの共通化抽出）
- **Key Findings**:
  - 共有コンポーネントは `components/shared/` に名前付きエクスポートで配置（barrel export なし）
  - `lib/` 配下は小さな単機能ファイルで構成（`utils.ts`, `form-utils.ts`, `toast-utils.ts`）
  - TanStack Form の validators は `{ onChange, onBlur }` 形式で `({ value }) => string | undefined` シグネチャ

## Research Log

### 既存の共有ユーティリティ構造
- **Context**: 新しい共通モジュールの配置先とエクスポートパターンを決定するため
- **Findings**:
  - `lib/utils.ts` — `cn()` 関数（Tailwind class merge）
  - `lib/form-utils.ts` — `getErrorMessage()` 関数
  - `lib/toast-utils.ts` — トースト通知ヘルパー群
  - `lib/api/client.ts` + `lib/api/types.ts` + `lib/api/index.ts` — API クライアント基盤
- **Implications**: 新規ユーティリティも同じ粒度で `lib/` 直下に配置する

### 共有コンポーネントパターン
- **Context**: `DetailRow` と `NotFoundState` の配置・API 設計の参考
- **Findings**:
  - `components/shared/LoadingState.tsx` — `interface Props` + `export function` パターン
  - `components/shared/EmptyState.tsx` — デフォルト props + `className` prop による拡張性
  - `components/shared/ErrorState.tsx` — オプショナルな `onRetry` コールバック
  - barrel export（index.ts）は使用されていない — 直接ファイルパスでインポート
- **Implications**: `DetailRow` と `NotFoundState` も同じパターンで実装する。`className` prop はオプショナルで追加

### TanStack Form Validator シグネチャ
- **Context**: `displayOrderValidators` の型定義を決定するため
- **Findings**:
  - validators prop: `{ onChange?: (params: { value: T }) => string | undefined, onBlur?: (params: { value: T }) => string | undefined }`
  - 既存コードでは onChange と onBlur に同一のロジックを設定
  - Zod スキーマを直接渡すパターンも存在するが、カスタムバリデーションは関数形式
- **Implications**: `displayOrderValidators` は `{ onChange, onBlur }` オブジェクトとして提供し、両方に同一関数を設定する

### テストパターン
- **Context**: ユニットテストの構成・命名規則を確認
- **Findings**:
  - Vitest（globals 有効: `describe`, `it`, `expect` を直接利用）
  - テスト配置: `src/__tests__/` にソース構造をミラー（例: `__tests__/features/work-types/api-client.test.ts`）
  - 日本語テスト名: `it("正常に作業種類一覧を取得する", ...)`
  - `@/` エイリアスはテストファイルでも使用可能
- **Implications**: 新規テストは `src/__tests__/lib/` 配下に配置

## Design Decisions

### Decision: formatDateTime の配置先
- **Context**: 既存の `lib/form-utils.ts` に追加するか、新ファイルを作るか
- **Alternatives Considered**:
  1. `lib/form-utils.ts` に追加 — フォーム以外でも使うため不適切
  2. `lib/format-utils.ts` を新規作成 — 日時フォーマット専用
  3. `lib/utils.ts` に追加 — `cn()` のみの純粋なユーティリティと混在
- **Selected Approach**: `lib/format-utils.ts` を新規作成
- **Rationale**: フォーマット系ユーティリティの名前空間を確保。将来 `formatYearMonth` 等を追加する際の拡張ポイント

### Decision: STALE_TIMES の配置先
- **Context**: 既存の `lib/api/index.ts` barrel に含めるか
- **Alternatives Considered**:
  1. `lib/api/client.ts` に追加 — API クライアントと密結合
  2. `lib/api/constants.ts` を新規作成 — 定数専用ファイル
- **Selected Approach**: `lib/api/constants.ts` を新規作成し、`lib/api/index.ts` からも re-export
- **Rationale**: 定数はクライアント実装とは独立。barrel export に追加することで既存のインポートパターンと整合

### Decision: NotFoundState のスコープ
- **Context**: `notFoundComponent`（TanStack Router）と `isError || !data` 時の両方で使うか
- **Alternatives Considered**:
  1. `notFoundComponent` のみ置換 — `isError` 時は既存のまま
  2. 両方を `NotFoundState` で置換 — 統一的な UI
- **Selected Approach**: 両方を `NotFoundState` で置換
- **Rationale**: 既存の実装では `notFoundComponent` と `isError || !data` 時の表示が同一構造であるため、統一して共通化する

## Risks & Mitigations
- **リスク1**: TanStack Form の validators 型が厳密で、共通バリデータの型が合わない可能性 → `displayOrderValidators` の型を TanStack Form の `FieldValidators` と互換にする
- **リスク2**: detail route の NotFound 表示でエンティティ固有のカスタマイズが必要になる可能性 → `backLabel` を optional prop で対応し、将来の拡張余地を残す
- **リスク3**: `STALE_TIMES` 置換時に値のマッピングミス → テストで各定数値を検証し、置換は機械的に実施

## References
- [TanStack Form Validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation) — バリデーション API
- [TanStack Router Not Found](https://tanstack.com/router/latest/docs/framework/react/guide/not-found-errors) — notFoundComponent パターン
