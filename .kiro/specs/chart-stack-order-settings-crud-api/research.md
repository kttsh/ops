# ギャップ分析: chart-stack-order-settings-crud-api

## 1. 現状調査

### 1.1 既存アセット

| 対象 | 状態 | 備考 |
|------|------|------|
| DBテーブル `chart_stack_order_settings` | 定義済み | PK: `chart_stack_order_setting_id` (IDENTITY), UQ: `(target_type, target_id)` |
| ルート `chartStackOrderSettings.ts` | **未実装** | `apps/backend/src/routes/` に存在しない |
| サービス `chartStackOrderSettingService.ts` | **未実装** | `apps/backend/src/services/` に存在しない |
| データ `chartStackOrderSettingData.ts` | **未実装** | `apps/backend/src/data/` に存在しない |
| 型定義 `chartStackOrderSetting.ts` | **未実装** | `apps/backend/src/types/` に存在しない |
| トランスフォーム `chartStackOrderSettingTransform.ts` | **未実装** | `apps/backend/src/transform/` に存在しない |
| テスト | **未実装** | `apps/backend/src/__tests__/` に存在しない |
| `index.ts` ルート登録 | **未登録** | トップレベルルートとして登録が必要 |

### 1.2 再利用可能な既存パターン

| パターン | 参照先 | 再利用度 |
|---------|--------|----------|
| 物理削除CRUD（ネステッド） | `indirectWorkTypeRatios`, `projectLoads` | 高（DELETE/findByIdロジック） |
| 一括upsert（MERGE文） | `indirectWorkTypeRatioData.bulkUpsert()` | 高（トランザクション+MERGE） |
| ページネーション付き一覧 | 全マスタ/エンティティルート | 高（query schema + COUNT + OFFSET/FETCH） |
| Zodバリデーション | `utils/validate.ts` | 完全再利用 |
| RFC 9457エラーハンドリング | `utils/errorHelper.ts` + グローバルonError | 完全再利用 |
| Transform（snake→camelCase） | 全Transform層 | パターン踏襲 |
| テスト構成（vitest + mock） | `__tests__/routes/projectLoads.test.ts` | パターン踏襲 |

### 1.3 アーキテクチャパターン

- **レイヤード構成**: routes → services → data + transform + types
- **依存方向**: 上位→下位のみ（逆方向禁止）
- **命名規則**: ファイル名 camelCase、DB snake_case、API camelCase
- **パスエイリアス**: `@/*` → `./src/*`

---

## 2. 要件の技術ニーズ分析

### 要件 → 技術要素マッピング

| 要件 | 技術要素 | ギャップ |
|------|---------|---------|
| Req 1: 一覧取得 | ページネーション・targetTypeフィルタ | **Missing**: 既存の物理削除テーブルにはページネーション実装なし（マスタ/エンティティのみ）。ただしパターンは確立済み |
| Req 2: 個別取得 | findById | **Missing**: 新規実装必要。パターンは既存 |
| Req 3: 新規作成 | INSERT + ユニーク制約チェック | **Missing**: 新規実装必要。`(target_type, target_id)` の重複チェックパターンは `projectLoads` の yearMonth 重複チェックと類似 |
| Req 4: 更新 | UPDATE + ユニーク制約チェック | **Missing**: 新規実装必要。excludeId パターンで自身を除外した重複チェック |
| Req 5: 削除 | 物理DELETE | **Missing**: パターン確立済み（`deleteById`） |
| Req 6: 一括upsert | MERGE + Transaction | **Missing**: `indirectWorkTypeRatios` のパターンを直接適用可能 |
| Req 7: バリデーション | Zod schema | **Missing**: 新規スキーマ定義必要 |
| Req 8: エラーハンドリング | RFC 9457 | 既存ユーティリティ完全再利用 |

### 複雑性シグナル

- **分類**: 標準的なCRUD + 一括upsert
- **アルゴリズムロジック**: なし
- **外部統合**: なし
- **ワークフロー**: なし
- **特殊要件**: `target_type` + `target_id` のポリモーフィック参照（外部キー制約なし）

---

## 3. 実装アプローチ

### Option B: 新規コンポーネント作成（推奨）

**根拠**: `chart_stack_order_settings` は独立したトップレベルリソースであり、既存コンポーネントの拡張対象がない。全ファイルを新規作成する必要がある。

**作成ファイル一覧:**

| レイヤー | ファイルパス | 参照パターン |
|---------|------------|-------------|
| Types | `types/chartStackOrderSetting.ts` | `types/indirectWorkTypeRatio.ts` |
| Transform | `transform/chartStackOrderSettingTransform.ts` | `transform/indirectWorkTypeRatioTransform.ts` |
| Data | `data/chartStackOrderSettingData.ts` | `data/indirectWorkTypeRatioData.ts` |
| Service | `services/chartStackOrderSettingService.ts` | `services/indirectWorkTypeRatioService.ts` |
| Route | `routes/chartStackOrderSettings.ts` | `routes/indirectWorkTypeRatios.ts` |
| Test | `__tests__/routes/chartStackOrderSettings.test.ts` | `__tests__/routes/projectLoads.test.ts` |
| Registration | `index.ts` に追加 | トップレベル: `app.route('/chart-stack-order-settings', ...)` |

**トレードオフ:**
- ✅ 責務が明確に分離される
- ✅ 既存コードに影響なし
- ✅ 独立してテスト可能
- ✅ 確立されたパターンの踏襲で実装リスクが低い
- ❌ 7ファイルの新規作成が必要（ただしすべてテンプレート的）

### 既存パターンとの差異

| 項目 | 既存の物理削除CRUD | 本実装の差異 |
|------|-------------------|-------------|
| URL構造 | ネステッド（`/parent/:id/child`） | **トップレベル**（`/chart-stack-order-settings`） |
| 一覧取得 | `findAll(parentId)` → 全件返却 | **ページネーション付き** + targetTypeフィルタ |
| 一括upsert | `bulkUpsert(parentId, items)` | parentId不要、`(targetType, targetId)` でMERGE |
| ユニーク制約 | 単一フィールド or 親ID+フィールド | `(target_type, target_id)` 複合ユニーク |

---

## 4. リスクと複雑性

### 工数見積: **S（1-3日）**
- 既存パターンをほぼそのまま踏襲可能
- 外部依存・新規技術なし
- 5エンドポイント + 一括upsert の標準的なCRUD

### リスク: **Low**
- 確立されたパターンの再現
- 技術的な不確実性なし
- アーキテクチャ変更不要

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ
- **Option B（新規コンポーネント作成）** を採用
- `indirectWorkTypeRatios` を主要な参照パターンとして使用（物理削除 + 一括upsert）
- ページネーションは既存マスタテーブルのパターンを適用

### 設計フェーズでの検討事項
1. **ページネーション実装の詳細**: 既存物理削除テーブルにはページネーションがないため、マスタテーブルのパターン（COUNT + OFFSET/FETCH NEXT）を適用する設計が必要
2. **targetTypeフィルタの設計**: WHERE句の動的構築パターン
3. **一括upsertのMERGE文**: `(target_type, target_id)` をキーとしたMERGE文の設計
4. **テスト戦略**: ルートテストの設計（mock service + Hono app.request()）

### Research Needed
- なし（すべて既存パターンで対応可能）
