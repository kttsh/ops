# Gap Analysis: backend-common-utils

## 1. 現状調査

### 1.1 既存アセット

#### ユーティリティ層 (`apps/backend/src/utils/`)
| ファイル | 内容 | 関連度 |
|---------|------|--------|
| `errorHelper.ts` | RFC 9457 Problem Details レスポンス生成 (`problemResponse`, `getProblemType`, `getStatusTitle`) | 間接（HTTPException パターンを理解するために参照） |
| `validate.ts` | Hono + Zod バリデーションミドルウェア (`validate` 関数) | 間接（バリデーションパイプラインの理解に必要） |

#### 型定義層 (`apps/backend/src/types/`)
| ファイル | 内容 | 関連度 |
|---------|------|--------|
| `pagination.ts` | `paginationQuerySchema` + `PaginationQuery` 型 | **直接**（拡張候補、includeDisabled ヘルパーの配置先候補） |
| `problemDetail.ts` | RFC 9457 型定義 | 間接 |
| `common.ts` | **存在しない** | **Gap**: 新規作成が必要 |

#### ルート層 (`apps/backend/src/routes/`)
- 24 ルートファイルが存在（`index.ts` で個別にマウント）
- `parseIntParam` を持つファイル: **14 ファイル**
- ページネーション応答パターンを持つファイル: **12 ファイル**
- Location ヘッダーを設定するファイル: **7 ファイル**

### 1.2 検出された規約・パターン

| 規約 | 内容 |
|------|------|
| インポートパス | `@/` エイリアス（`./src/` にマップ） |
| エラー処理 | `HTTPException` → グローバルエラーハンドラで RFC 9457 変換 |
| バリデーション | `@hono/zod-validator` ラッパー (`validate` 関数) |
| テスト配置 | `__tests__/` にソース構造をミラー |
| テストパターン | Service 層を `vi.mock()` でモック、`app.request()` で HTTP テスト |
| テスト記述 | 日本語テスト名、`describe`/`test` 構造 |

### 1.3 統合ポイント

- **HTTPException**: `hono/http-exception` からインポート。`parseIntParam` がスローし、グローバルエラーハンドラが捕捉
- **Hono Context**: `c.json()` でレスポンス生成、`c.header()` でヘッダー設定、`c.req.param()` でパスパラメータ取得
- **Zod スキーマ**: `paginationQuerySchema.extend({...})` パターンで各エンティティの一覧クエリスキーマを構成

---

## 2. 要件実現性分析

### 2.1 要件→アセットマッピング

| 要件 | 必要なアセット | 既存 | ギャップ |
|------|--------------|------|---------|
| Req 1: parseIntParam 統一 | `utils/parseParams.ts` | なし | **Missing**: 新規ファイル作成、14 ファイルの import 変更 |
| Req 2: ページネーション応答ヘルパー | `utils/responseHelper.ts` | なし | **Missing**: 新規ファイル作成、12 ファイルの呼び出し変更 |
| Req 3: Location ヘッダーヘルパー | `utils/responseHelper.ts` (同上) | なし | **Missing**: Req 2 と同一ファイルに配置可能 |
| Req 4: yearMonthSchema | `types/common.ts` | なし | **Missing**: 新規ファイル作成、7 ファイルの import 変更 |
| Req 5: businessUnitCodeSchema | `types/common.ts` (同上) | なし | **Missing**: Req 4 と同一ファイルに配置 |
| Req 6: colorCodeSchema | `types/common.ts` (同上) | なし | **Missing**: Req 4 と同一ファイルに配置 |
| Req 7: includeDisabled フィルタ | `types/common.ts` or `types/pagination.ts` | `pagination.ts` 部分的 | **Gap**: `paginationQuerySchema` は存在するが `includeDisabled` ヘルパーなし |
| Req 8: テスト・互換性 | テストインフラ | 充実 | **Low Gap**: 既存テスト 68 ファイルが回帰テストとして機能 |

### 2.2 シグネチャ統一の分析

#### parseIntParam の 2 バリアント

| バリアント | シグネチャ | ファイル数 | 用途 |
|-----------|----------|----------|------|
| A | `(value: string, name: string): number` | 6 | コード系パスパラメータ（常に存在） |
| B | `(value: string \| undefined, name: string): number` | 8 | ID 系パスパラメータ（`c.req.param()` が undefined を返す可能性） |

**統一方針**: バリアント B（`string | undefined`）に統一。バリアント A の呼び出し元は `string` を渡すため、上位互換。

#### yearMonthSchema のバリエーション

| 実装パターン | ファイル | バリデーション |
|-------------|---------|-------------|
| `regex(/^\d{6}$/)` + `refine(month 1-12)` | monthlyHeadcountPlan.ts, monthlyCapacity.ts | 最も厳密 |
| `regex(/^\d{6}$/)` のみ | monthlyIndirectWorkLoad.ts | 月範囲チェックなし |
| `.length(6)` + `regex(/^\d{6}$/)` + `refine` | chartView.ts | 冗長な length チェック |
| `.regex(/^\d{6}$/)` (インライン) | projectLoad.ts, chartData.ts, capacityScenario.ts | 最小限 |

**統一方針**: 最も厳密なバリアント（`regex` + `refine` で月範囲チェック）に統一。既存の緩いバリデーションを厳格化するが、正当な入力は常に 01-12 の月を持つため後方互換性に影響なし。

#### businessUnitCodeSchema のバリエーション

| パターン | ファイル | バリデーション |
|---------|---------|-------------|
| `z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/)` | businessUnit.ts | 最も厳密 |
| `z.string().min(1).max(20)` | monthlyHeadcountPlan.ts, monthlyCapacity.ts, monthlyIndirectWorkLoad.ts | regex なし |
| `z.string().max(20).optional()` | フィルタパラメータ（project.ts 等） | フィルタ用（optional） |

**統一方針**: 基本スキーマは最も厳密なバリアント（regex 付き）。フィルタ用は `.optional()` を付与したバリアントも提供。

### 2.3 複雑性シグナル

- **複雑性レベル**: 低〜中（Extract Method パターンの繰り返し）
- **ビジネスロジック**: なし（純粋なインフラリファクタリング）
- **外部依存**: なし（既存の Hono / Zod のみ）
- **データモデル変更**: なし
- **API 契約変更**: なし

### 2.4 制約

- **Zod バージョン**: Backend は Zod v4（`zod` パッケージ）。`z.coerce` や `.regex()` 等の API が利用可能
- **HTTPException**: `hono/http-exception` からインポート。共通ユーティリティも同じインポートパスを使用する必要あり
- **テスト回帰**: 既存の 24+ ルートテストが回帰テストとして機能。共通モジュール変更後も全テストがパスする必要あり

---

## 3. 実装アプローチ選択肢

### Option A: 既存ファイルの拡張

**概要**: `types/pagination.ts` に共通スキーマを追加、`utils/errorHelper.ts` にヘルパーを追加

**対象変更**:
- `pagination.ts` → yearMonthSchema, businessUnitCodeSchema, colorCodeSchema, includeDisabled を追加
- `errorHelper.ts` → parseIntParam を追加
- 14+ ルートファイルの import 変更

**トレードオフ**:
- ✅ 新規ファイルなし、既存の import パスに近い
- ❌ `pagination.ts` が「ページネーション」以上の責務を持ち、名前と内容の乖離
- ❌ `errorHelper.ts` に HTTPException スロー関数を追加すると、「エラーレスポンス生成」という責務からズレる
- ❌ ファイル肥大化のリスク

### Option B: 新規コンポーネント作成（推奨）

**概要**: 責務ごとに新規ユーティリティファイルを作成

**対象変更**:
- 新規: `utils/parseParams.ts`（parseIntParam）
- 新規: `utils/responseHelper.ts`（buildPaginatedResponse, setLocationHeader）
- 新規: `types/common.ts`（yearMonthSchema, businessUnitCodeSchema, colorCodeSchema, includeDisabledFilterSchema）
- 14+ ルートファイル、7+ 型ファイルの import 変更

**トレードオフ**:
- ✅ 責務が明確に分離される（パラメータ解析、レスポンス構築、共通スキーマ）
- ✅ 既存ファイルの責務を変更しない
- ✅ テストファイルも責務別に配置可能
- ✅ `types/common.ts` という名前が共通スキーマの配置先として直感的
- ❌ 新規ファイル 3 つ + テスト 3 つを追加

### Option C: ハイブリッドアプローチ

**概要**: includeDisabled のみ `pagination.ts` に追加、他は新規ファイル

**対象変更**:
- `pagination.ts` → `includeDisabledFilterSchema` と `paginationWithFilterSchema` を追加
- 新規: `utils/parseParams.ts`, `utils/responseHelper.ts`, `types/common.ts`

**トレードオフ**:
- ✅ `includeDisabled` はページネーションと常にセットで使われるため、`pagination.ts` に配置するのが意味的に適切
- ✅ `common.ts` はドメインスキーマ（yearMonth, businessUnitCode, colorCode）に集中
- ❌ `includeDisabled` の配置先が直感的でない可能性

---

## 4. 工数・リスク評価

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **S（1〜3日）** | 既存パターンの Extract Method。ビジネスロジック変更なし。変更は機械的 |
| **リスク** | **Low** | 既存テスト 68 ファイルが回帰保証。API 契約変更なし。TypeScript strict mode による型安全性 |

### リスク詳細

| リスク | 影響 | 対策 |
|--------|------|------|
| yearMonthSchema 統一時のバリデーション厳格化 | 低: 正当な入力は常に月 01-12 を持つ | 統一前に全型テストを実行し、パース結果を確認 |
| businessUnitCodeSchema の regex 追加 | 低: 既存データが regex に合致しない可能性 | DB の既存データを確認（Research Needed） |
| import パス変更の漏れ | 低: TypeScript コンパイルで検出可能 | `tsc --noEmit` でビルドチェック |

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option B（新規コンポーネント作成）

**理由**:
- 責務の分離が最も明確
- リファクタリング計画書の Phase 1 の記述と一致（`utils/parseParams.ts`, `utils/responseHelper.ts`, `types/common.ts` の作成を明記）
- 既存ファイルへの影響を最小化

### 設計フェーズで決定すべき事項

1. **includeDisabled の配置先**: `types/common.ts` vs `types/pagination.ts` の拡張
2. **buildPaginatedResponse の型パラメータ設計**: ジェネリック型 `<T>` を使うか、`unknown[]` で受けるか
3. **setLocationHeader の API 設計**: `(c, basePath, id)` vs `(c, fullPath)` のシグネチャ選択
4. **yearMonthSchema 統一後のエラーメッセージ**: 全ファイルで統一するメッセージの最終文言

### Research Needed

- [ ] `businessUnitCodeSchema` に regex パターンを適用した場合、既存 DB データが全件合致するか確認
- [ ] `colorCodeSchema` のエラーメッセージを日本語化するか英語のまま統一するか（現状は英語）
