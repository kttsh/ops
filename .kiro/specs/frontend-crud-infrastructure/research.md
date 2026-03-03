# Research & Design Decisions

## Summary
- **Feature**: `frontend-crud-infrastructure`
- **Discovery Scope**: Extension（既存システムのリファクタリング）
- **Key Findings**:
  - 全 feature の CRUD パターンは 95% 以上同一構造。差異は ID 型（string/number）、ページネーション有無、staleTime の3点のみ
  - Phase 1 で導入済みの共有ユーティリティ（`lib/api/client.ts`, `constants.ts`, `types.ts`, `StatusBadge`, `SortableHeader`）がファクトリの基盤として十分
  - Projects feature のみ Select クエリ（`fetchBusinessUnitsForSelect`, `fetchProjectTypesForSelect`）を持つ。これはファクトリのスコープ外として個別に残す

## Research Log

### ID 型の差異パターン
- **Context**: ファクトリのジェネリクス設計において、ID 型の扱いが重要
- **Findings**:
  - string ID（work-types, business-units, project-types）: `encodeURIComponent()` で URL エンコード
  - number ID（projects）: 直接 URL 補間
  - string ID は `as const` で型推論が効く
- **Implications**: ジェネリクス `TId extends string | number` で統一可能。URL 構築時に `typeof id === "string"` で分岐するか、一律 `encodeURIComponent(String(id))` で処理

### ページネーションパラメータの差異
- **Context**: fetchList のパラメータ構築ロジックが2パターン存在
- **Findings**:
  - パターン A（work-types, project-types）: `includeDisabled` フィルタのみ
  - パターン B（business-units, projects）: `page[number]`, `page[size]` + `includeDisabled`
- **Implications**: `buildSearchParams` をファクトリ設定で制御。ページネーション付きの場合は `page` / `pageSize` を自動追加

### Mutation キャッシュ無効化パターン
- **Context**: 4つの Mutation Hook が全 feature で 100% 同一
- **Findings**:
  - create: `lists()` 無効化
  - update: `lists()` + `detail(id)` 無効化
  - delete: `lists()` 無効化
  - restore: `lists()` 無効化
  - 追加の `onSuccess` コールバックは現時点で未使用だが、トースト通知統一（Phase 4）で必要になる
- **Implications**: 完全にパターン化可能。`onSuccess` 拡張ポイントを設けておくと Phase 4 との親和性が高い

### カラム定義の共通パターン
- **Context**: columns.tsx の中で抽象化可能な部分を特定
- **Findings**:
  - ステータスカラム: `deletedAt` → Badge（3 feature で同一）。ただし Projects は独自の business status カラムを持つ
  - 復元アクションカラム: `onRestore` コールバック付き（4 feature で同一構造）
  - 日時カラム: `formatDateTime` + `SortableHeader`（4 feature で同一）
  - ソータブルカラム: `SortableHeader` のみ（多数）
  - リンクカラムは feature 固有のルートパスとパラメータ名を持つため、汎用化の効果が薄い
- **Implications**: ステータス・復元・日時・ソータブルの4ヘルパーが高効果。リンクカラムは各 feature で個別定義のまま

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| ファクトリ関数 | 設定オブジェクトを受け取り、型付きオブジェクトを返す純粋関数 | シンプル、テスト容易、Tree-shaking 対応 | 設定の型定義が複雑化する可能性 | 採用 |
| クラスベース | BaseCrudClient クラスを継承 | OOP パターンとの親和性 | React Hooks との相性が悪い、Tree-shaking 不利 | 不採用 |
| HOC パターン | Higher-Order Component で Mutation を注入 | React 的なアプローチ | 型推論が複雑化、Hooks ベースの方が現代的 | 不採用 |

## Design Decisions

### Decision: ファクトリ関数パターンの採用
- **Context**: CRUD ボイラープレートの抽象化手法の選択
- **Alternatives Considered**:
  1. クラスベース（BaseCrudClient 継承）
  2. ファクトリ関数（設定オブジェクト → 型付き返却値）
  3. コード生成（codegen でファイル自動生成）
- **Selected Approach**: ファクトリ関数
- **Rationale**: React Hooks エコシステムとの親和性が最も高く、Tree-shaking 対応、テスト容易性に優れる。TypeScript のジェネリクスによる型推論がクラスより直感的
- **Trade-offs**: 設定型が複雑になるが、TypeScript の型推論で呼び出し側の負荷は最小

### Decision: URL エンコーディングの統一
- **Context**: string ID は `encodeURIComponent` を使い、number ID は直接補間している
- **Selected Approach**: 一律 `encodeURIComponent(String(id))` で統一
- **Rationale**: number を String 化して encodeURIComponent しても結果は同一（数字はエンコード不要文字）。分岐ロジックを排除できる

### Decision: カラムヘルパーのスコープ
- **Context**: リンクカラムの汎用化の是非
- **Selected Approach**: リンクカラムはスコープ外とし、ステータス・復元・日時・ソータブルの4つに絞る
- **Rationale**: リンクカラムはルートパス・パラメータ名・表示値が feature ごとに異なり、汎用化しても設定の記述量が個別定義と大差ない

## Risks & Mitigations
- **型互換性の破壊**: ファクトリの戻り値型が既存の関数型と一致しない場合、インポート元でコンパイルエラーが発生 → 各 feature の re-export で型を維持し、段階的に移行
- **Select クエリの混在**: Projects の Select クエリはファクトリスコープ外 → feature 内で個別定義を残し、CRUD 部分のみファクトリ化
- **テスト互換性**: ファクトリ化によりモック対象が変化する可能性 → 既存テストの mock パスを確認し、必要に応じて調整

## References
- [TanStack Query - Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) — 階層的キー構造のベストプラクティス
- [TanStack Query - queryOptions](https://tanstack.com/query/latest/docs/framework/react/guides/query-options) — queryOptions ヘルパーの公式パターン
