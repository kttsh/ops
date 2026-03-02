# Requirements Document

## Introduction

リファクタリング計画書 Phase 1 の 1-1（Backend 共通ユーティリティ）および 1-2（Backend 共通 Zod スキーマ）を対象とする。14 ルートファイルに散在する `parseIntParam` 関数、12 ファイルに重複するページネーション応答構築、7 ファイルで手動構築される Location ヘッダー、および 7〜10 ファイルに重複する Zod スキーマ定義を共通モジュールに集約し、既存の振る舞いを一切変えずに重複コードを解消する。

### 対象コードスメル

| ID | スメル | 影響ファイル数 | 推定重複行数 |
|----|--------|---------------|-------------|
| B-R1 | `parseIntParam` 関数の重複 | 14 | ~110 |
| B-R2 | ページネーション応答のボイラープレート | 12 | ~96 |
| B-R4 | Location ヘッダーの手動構築 | 7 | ~14 |
| B-TY1 | Zod スキーマの重複定義 | 7〜10 | ~200 |

## Requirements

### Requirement 1: パスパラメータのパースユーティリティ統一

**Objective:** As a バックエンド開発者, I want パスパラメータのパース関数を単一の共通モジュールから利用したい, so that 14 ファイルにわたる重複実装を解消し、シグネチャとエラーメッセージを統一できる

#### Acceptance Criteria

1. The Backend shall `utils/parseParams.ts` モジュールにて `parseIntParam` 関数を単一定義として提供する
2. The `parseIntParam` shall `string | undefined` 型の入力を受け付け、`undefined` または空文字の場合に HTTPException(422) をスローする
3. The `parseIntParam` shall 入力値が正の整数でない場合（NaN、0以下）に HTTPException(422) をスローする
4. When `parseIntParam` が正常な正の整数文字列を受け取った場合, the Backend shall パースされた number 型の値を返す
5. The Backend shall 既存の 14 ルートファイル（projects.ts, projectCases.ts, monthlyCapacities.ts, monthlyIndirectWorkLoads.ts, chartViewProjectItems.ts, monthlyHeadcountPlans.ts, indirectWorkTypeRatios.ts, projectLoads.ts, chartColorSettings.ts, chartStackOrderSettings.ts, chartColorPalettes.ts, chartViewIndirectWorkItems.ts, standardEffortMasters.ts, projectChangeHistory.ts）からローカル定義の `parseIntParam` を削除し、共通モジュールからの import に置き換える
6. The Backend shall リファクタリング前後で全既存エンドポイントのレスポンス（正常系・異常系）が同一であることを保証する

### Requirement 2: ページネーション応答ヘルパー

**Objective:** As a バックエンド開発者, I want ページネーション応答の組み立てを共通ヘルパー関数で行いたい, so that 12 ファイルに重複する `{ data, meta: { pagination } }` 構造の構築コードを解消できる

#### Acceptance Criteria

1. The Backend shall `utils/responseHelper.ts` モジュールにて `buildPaginatedResponse` 関数を提供する
2. The `buildPaginatedResponse` shall 入力として `items`（データ配列）、`totalCount`（総件数）、`page`（現在ページ番号）、`pageSize`（ページサイズ）を受け取る
3. The `buildPaginatedResponse` shall `{ data, meta: { pagination: { currentPage, pageSize, totalItems, totalPages } } }` 構造のオブジェクトを返す
4. The `buildPaginatedResponse` shall `totalPages` を `Math.ceil(totalCount / pageSize)` で算出する
5. The Backend shall 既存の 12 ルートファイル（projects.ts, standardEffortMasters.ts, projectCases.ts, chartStackOrderSettings.ts, chartColorSettings.ts, workTypes.ts, projectTypes.ts, indirectWorkCases.ts, headcountPlanCases.ts, chartViews.ts, capacityScenarios.ts, businessUnits.ts）の一覧エンドポイントを `buildPaginatedResponse` の呼び出しに置き換える
6. The Backend shall リファクタリング前後で API レスポンスの JSON 構造が完全に同一であることを保証する

### Requirement 3: Location ヘッダー設定ヘルパー

**Objective:** As a バックエンド開発者, I want リソース作成時の Location ヘッダー設定を共通ヘルパーで行いたい, so that 7 ファイルに散在する手動構築を解消できる

#### Acceptance Criteria

1. The Backend shall `utils/responseHelper.ts` モジュール（または適切なモジュール）にて `setLocationHeader` 関数を提供する
2. The `setLocationHeader` shall Hono の Context オブジェクト、ベースパス（例: `/projects`）、リソース識別子を受け取り、`Location` ヘッダーを設定する
3. The Backend shall 既存の 7 ルートファイル（projects.ts, workTypes.ts, projectTypes.ts, indirectWorkCases.ts, chartViews.ts, capacityScenarios.ts, businessUnits.ts）の POST ハンドラにおける `c.header("Location", ...)` を `setLocationHeader` の呼び出しに置き換える
4. The Backend shall リファクタリング前後で POST レスポンスの Location ヘッダー値が同一であることを保証する

### Requirement 4: 共通 yearMonthSchema の集約

**Objective:** As a バックエンド開発者, I want `yearMonthSchema` を単一の共通モジュールから利用したい, so that 7 ファイルにわたる重複定義とバリデーションルールの不統一を解消できる

#### Acceptance Criteria

1. The Backend shall `types/common.ts` モジュールにて `yearMonthSchema` を単一定義として提供する
2. The `yearMonthSchema` shall 6 桁の文字列（YYYYMM 形式）のみを受け付ける
3. The `yearMonthSchema` shall 月部分（5〜6 桁目）が 01〜12 の範囲であることを検証する
4. If 入力が YYYYMM 形式に合致しない場合, the `yearMonthSchema` shall 明確なエラーメッセージ付きでバリデーションエラーを返す
5. The Backend shall 既存の 7 型ファイル（chartView.ts, monthlyIndirectWorkLoad.ts, chartData.ts, capacityScenario.ts, monthlyHeadcountPlan.ts, projectLoad.ts, monthlyCapacity.ts）からローカル定義の yearMonthSchema を削除し、共通モジュールからの import に置き換える
6. The Backend shall リファクタリング前後で各エンドポイントのバリデーション挙動（正常値の受理・異常値の拒否）が同一であることを保証する

### Requirement 5: 共通 businessUnitCodeSchema の集約

**Objective:** As a バックエンド開発者, I want `businessUnitCodeSchema` を共通モジュールから利用したい, so that 4 ファイル以上にわたる重複定義とバリデーションルールの不統一を解消できる

#### Acceptance Criteria

1. The Backend shall `types/common.ts` モジュールにて `businessUnitCodeSchema` を単一定義として提供する
2. The `businessUnitCodeSchema` shall 1〜20 文字の文字列を受け付け、`/^[a-zA-Z0-9_-]+$/` パターンに合致することを検証する
3. The Backend shall 既存の型ファイル（businessUnit.ts, monthlyHeadcountPlan.ts, monthlyCapacity.ts, monthlyIndirectWorkLoad.ts）およびフィルタパラメータとして使用している箇所からローカル定義を削除し、共通スキーマからの import に置き換える
4. The Backend shall リファクタリング前後でバリデーション挙動が同一であることを保証する

### Requirement 6: 共通 colorCodeSchema の集約

**Objective:** As a バックエンド開発者, I want `colorCodeSchema` を共通モジュールから利用したい, so that 2 ファイルにわたる重複定義とエラーメッセージの不統一を解消できる

#### Acceptance Criteria

1. The Backend shall `types/common.ts` モジュールにて `colorCodeSchema` を単一定義として提供する
2. The `colorCodeSchema` shall `#` プレフィックス付き 6 桁の 16 進数カラーコード（`/^#[0-9A-Fa-f]{6}$/`）のみを受け付ける
3. If 入力がカラーコード形式に合致しない場合, the `colorCodeSchema` shall 明確なエラーメッセージを返す
4. The Backend shall 既存の 2 型ファイル（chartColorPalette.ts, chartColorSetting.ts）からローカル定義を削除し、共通スキーマからの import に置き換える
5. The Backend shall リファクタリング前後でバリデーション挙動が同一であることを保証する

### Requirement 7: 共通 includeDisabled フィルタヘルパーの集約

**Objective:** As a バックエンド開発者, I want `includeDisabled` フィルタ定義を共通ヘルパーとして利用したい, so that 10 ファイルに重複する同一パターンを解消できる

#### Acceptance Criteria

1. The Backend shall `types/common.ts` モジュール（または `types/pagination.ts` の拡張）にて `includeDisabledFilterSchema`（`z.coerce.boolean().default(false)`）を単一定義として提供する
2. The Backend shall ページネーション + includeDisabled の組み合わせを簡潔に利用できるヘルパー（例: `paginationWithFilterSchema` や `withIncludeDisabledFilter()` 関数）を提供する
3. The Backend shall 既存の 10 型ファイル（businessUnit.ts, chartView.ts, capacityScenario.ts, projectCase.ts, indirectWorkCase.ts, project.ts, standardEffortMaster.ts, projectType.ts, workType.ts, headcountPlanCase.ts）からローカルの `"filter[includeDisabled]"` 定義を削除し、共通定義からの import に置き換える
4. The Backend shall リファクタリング前後で各一覧エンドポイントのフィルタ挙動が同一であることを保証する

### Requirement 8: 後方互換性と品質保証

**Objective:** As a プロジェクトオーナー, I want リファクタリングが既存の外部 API 契約を一切変更しないことを保証したい, so that 利用側に影響を与えることなくコード品質を改善できる

#### Acceptance Criteria

1. The Backend shall リファクタリング対象の全エンドポイントについて、既存テストがすべてパスすることを保証する
2. The Backend shall 新規作成する共通ユーティリティおよび共通スキーマに対してユニットテストを提供する
3. The Backend shall TypeScript strict mode で型エラーが発生しないことを保証する
4. The Backend shall 既存の API レスポンス形式（JSON 構造、HTTP ステータスコード、ヘッダー）を一切変更しない
5. The Backend shall 既存のバリデーションエラーメッセージを統一する場合、統一後のメッセージが既存のいずれかのバリアントと同等以上の明確さを持つことを保証する
