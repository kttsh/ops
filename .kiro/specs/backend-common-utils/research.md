# Research & Design Decisions: backend-common-utils

## Summary
- **Feature**: `backend-common-utils`
- **Discovery Scope**: Extension（既存システムから共通ユーティリティを抽出）
- **Key Findings**:
  - `parseIntParam` は 14 ファイルに 2 バリアント（`string` / `string | undefined`）で散在。`string | undefined` への統一が上位互換
  - `yearMonthSchema` は 7 ファイルに 4 バリエーション。最も厳密な regex + refine パターンへの統一が安全
  - 既存テスト 68 ファイルが完全な回帰テスト基盤として機能。新規共通モジュールのテスト追加のみで品質保証が可能

## Research Log

### parseIntParam シグネチャ統一

- **Context**: 14 ルートファイルに 2 つの異なるシグネチャが混在
- **Sources Consulted**: 全 14 ルートファイルの実装を直接調査
- **Findings**:
  - バリアント A（`string`）: 6 ファイル — コード系パスパラメータ（projects.ts, standardEffortMasters.ts 等）
  - バリアント B（`string | undefined`）: 8 ファイル — ID 系パスパラメータ（projectLoads.ts, monthlyCapacities.ts 等）
  - 全実装で `HTTPException(422)` をスロー。エラーメッセージは統一されている
  - バリアント A の呼び出し元は常に `string` を渡すため、B に統一しても影響なし
- **Implications**: `string | undefined` を受け付ける単一関数に統一。TypeScript の型互換性により呼び出し元の変更不要

### yearMonthSchema バリエーション分析

- **Context**: 7 型ファイルに異なるバリデーション強度の実装が散在
- **Sources Consulted**: chartView.ts, monthlyIndirectWorkLoad.ts, chartData.ts, capacityScenario.ts, monthlyHeadcountPlan.ts, projectLoad.ts, monthlyCapacity.ts
- **Findings**:
  - 最も厳密: `regex(/^\d{6}$/)` + `refine(月 01-12)`（monthlyHeadcountPlan.ts, monthlyCapacity.ts）
  - 中間: `regex(/^\d{6}$/)` のみ（monthlyIndirectWorkLoad.ts 等）
  - 冗長: `.length(6)` + `regex` + `refine`（chartView.ts）
  - 最小限: インライン regex のみ（projectLoad.ts 等）
- **Implications**: 最も厳密なバリアントに統一。正当な YYYYMM データは常に月 01-12 を持つため、バリデーション厳格化による破壊的変更なし

### includeDisabled フィルタの配置先

- **Context**: `z.coerce.boolean().default(false)` が 10 ファイルに重複
- **Sources Consulted**: 10 型ファイル、pagination.ts
- **Findings**:
  - 全件同一定義: `"filter[includeDisabled]": z.coerce.boolean().default(false)`
  - 常に `paginationQuerySchema.extend({...})` の中で使用
  - `pagination.ts` は現在 `paginationQuerySchema` と `PaginationQuery` 型のみを定義
- **Implications**: `types/common.ts` に配置。ページネーションとの結合は呼び出し側で `paginationQuerySchema.extend({ ...commonFilters })` とする

### 既存ユーティリティ層の構造

- **Context**: 新規ユーティリティの配置先と命名規約の確認
- **Sources Consulted**: utils/errorHelper.ts, utils/validate.ts
- **Findings**:
  - 2 ファイルとも「1 ファイル = 1 責務」パターン
  - `errorHelper.ts`: エラーレスポンス生成
  - `validate.ts`: バリデーションミドルウェア
  - テストは `__tests__/utils/` に配置
- **Implications**: `parseParams.ts`（パラメータ解析）、`responseHelper.ts`（レスポンス構築）を同パターンで追加

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 新規ファイル作成（Option B） | 責務別に utils/parseParams.ts, utils/responseHelper.ts, types/common.ts を新規作成 | 責務分離が明確、既存ファイルへの影響なし | 新規ファイル 3 + テスト 3 の追加 | リファクタリング計画書の記述と完全一致 |
| 既存ファイル拡張（Option A） | pagination.ts, errorHelper.ts に追加 | 新規ファイルなし | 責務の混在、ファイル名と内容の乖離 | 不採用 |

## Design Decisions

### Decision: parseIntParam のシグネチャ統一

- **Context**: 2 つのバリアント（`string` vs `string | undefined`）の統一
- **Alternatives Considered**:
  1. `string | undefined` に統一（バリアント B）
  2. オーバーロードで両方サポート
- **Selected Approach**: `string | undefined` に統一
- **Rationale**: TypeScript の型互換性により `string` は `string | undefined` のサブタイプ。呼び出し元の変更不要
- **Trade-offs**: シンプルさ優先。オーバーロードは不要な複雑さ
- **Follow-up**: 全 14 ルートファイルで import 変更後、既存テスト実行で確認

### Decision: 共通 Zod スキーマの配置先

- **Context**: yearMonthSchema, businessUnitCodeSchema, colorCodeSchema, includeDisabledFilterSchema の配置先
- **Alternatives Considered**:
  1. `types/common.ts` に全て配置
  2. `types/pagination.ts` を拡張して includeDisabled を追加
  3. ドメイン別に分割（`types/dateSchemas.ts`, `types/codeSchemas.ts` 等）
- **Selected Approach**: `types/common.ts` に全て配置
- **Rationale**: Phase 1 の規模（スキーマ 4 種）では 1 ファイルで十分。ファイル肥大化した場合は将来分割可能
- **Trade-offs**: 将来的に共通スキーマが増えた場合の分割コスト vs 現時点のシンプルさ
- **Follow-up**: Phase 2 以降で `common.ts` が肥大化した場合にドメイン別分割を検討

### Decision: buildPaginatedResponse の型設計

- **Context**: 12 ルートファイルのページネーション応答構築を共通化
- **Alternatives Considered**:
  1. ジェネリック関数 `<T>(params): PaginatedResponse<T>`
  2. `unknown[]` で受ける非ジェネリック関数
- **Selected Approach**: ジェネリック関数
- **Rationale**: TypeScript strict mode でのエンドツーエンド型安全性を維持。Hono の `c.json()` に渡す際に正確な型推論が効く
- **Trade-offs**: 型パラメータの明示が必要だが、多くの場合は型推論で省略可能
- **Follow-up**: なし

## Risks & Mitigations
- yearMonthSchema 統一による月範囲バリデーション厳格化 → 正当データは常に 01-12 のため影響なし。型テストで確認
- businessUnitCodeSchema regex 追加 → 既存 DB データが regex に合致するか実装時に確認
- import パス変更漏れ → `tsc --noEmit` + 既存テスト全実行で検出

## References
- [Hono HTTPException](https://hono.dev/docs/api/exception) — parseIntParam のエラースロー方式
- [Zod v4 Documentation](https://zod.dev/) — スキーマ定義の API リファレンス
- リファクタリング計画書 `docs/refactoring-plan.md` Phase 1 セクション 1-1, 1-2
