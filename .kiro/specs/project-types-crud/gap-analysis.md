# ギャップ分析レポート: project-types-crud

## 1. 現状調査

### 1.1 既存アセット

`business-units-crud` が完全に実装済みであり、同一ドメイン（マスタテーブル CRUD）のリファレンス実装として利用可能。

| レイヤー | 既存ファイル | 再利用可能性 |
|---------|------------|------------|
| Routes | `routes/businessUnits.ts` | パターン流用（新規ファイル作成） |
| Services | `services/businessUnitService.ts` | パターン流用（新規ファイル作成） |
| Data | `data/businessUnitData.ts` | パターン流用（新規ファイル作成） |
| Transform | `transform/businessUnitTransform.ts` | パターン流用（新規ファイル作成） |
| Types | `types/businessUnit.ts` | パターン流用（新規ファイル作成） |
| Types/共通 | `types/pagination.ts` | **そのまま再利用** |
| Types/共通 | `types/problemDetail.ts` | **そのまま再利用** |
| Utils | `utils/errorHelper.ts` | **そのまま再利用** |
| Utils | `utils/validate.ts` | **そのまま再利用** |
| Database | `database/client.ts` | **そのまま再利用** |
| テスト | `__tests__/` 配下各ファイル | パターン流用（新規テスト作成） |

### 1.2 既存の規約・パターン

- **3層アーキテクチャ**: Routes → Services → Data（+ Transform）
- **Zod バリデーション**: `validate()` ミドルウェア + RFC 9457 エラー形式
- **ソフトデリート**: `deleted_at` による論理削除 + `filter[includeDisabled]` + 復元アクション
- **ページネーション**: `page[number]` / `page[size]` ブラケット記法（JSON:API 互換）
- **ルーティング登録**: `index.ts` で `app.route('/path', handler)` 方式
- **テスト**: 全層 vitest + モック（Routes は Hono test client）

### 1.3 統合ポイント

- `src/index.ts` にルート登録の追加が必要
- DB接続（`getPool()`）は共通で再利用
- エラーハンドリング（グローバルエラーハンドラ）は既存のものがそのまま適用される

---

## 2. 要件実現可能性分析

### 2.1 要件 → 技術要素マッピング

| 要件 | 技術要素 | 既存アセット | ギャップ |
|------|---------|------------|--------|
| Req 1: 一覧取得 | GET + ページネーション + soft-delete フィルタ | `paginationQuerySchema`, `validate()` | project_types 用スキーマ・クエリ |
| Req 2: 単一取得 | GET + 404 エラー | `errorHelper`, `problemResponse()` | project_types 用データ取得 |
| Req 3: 新規作成 | POST + 201 + Location + 409 重複 | 同上パターン | project_types 用 create スキーマ・ロジック |
| Req 4: 更新 | PUT + 200 + 404/422 | 同上パターン | project_types 用 update スキーマ・ロジック |
| Req 5: 論理削除 | DELETE + 204 + 参照チェック | `hasReferences()` パターン | 参照テーブルが異なる（projects, standard_effort_masters） |
| Req 6: 復元 | POST actions/restore + 409 | 同上パターン | project_types 用復元ロジック |
| Req 7: レスポンス形式 | RFC 9457 + camelCase | `errorHelper`, `transform` パターン | project_types 用 transform |
| Req 8: バリデーション | Zod スキーマ | `validate()` ミドルウェア | project_types 用 Zod スキーマ |

### 2.2 ギャップ詳細

#### Missing（新規作成が必要）

| 対象 | 説明 |
|------|------|
| `routes/projectTypes.ts` | 6エンドポイントの定義 |
| `services/projectTypeService.ts` | ビジネスロジック（findAll/findByCode/create/update/delete/restore） |
| `data/projectTypeData.ts` | MSSQL クエリ（CRUD + hasReferences） |
| `transform/projectTypeTransform.ts` | `project_type_code` → `projectTypeCode` 等の変換 |
| `types/projectType.ts` | Zod スキーマ + TypeScript 型定義 |
| `index.ts` への登録 | `app.route('/project-types', projectTypes)` 追加 |
| テストファイル（5-6ファイル） | 各層のテスト |

#### Constraint（既存アーキテクチャの制約）

| 制約 | 影響 |
|------|------|
| MSSQL 直接クエリ（ORM なし） | SQL を手書きする必要がある |
| `OUTPUT INSERTED.*` パターン | INSERT/UPDATE 後の結果取得方法が固定 |
| `hasReferences()` の参照テーブル | project_types は `projects` と `standard_effort_masters` のみ（business_units より少ない） |

#### Unknown / Research Needed

なし。business_units と project_types のテーブル構造がほぼ同一であり、技術的な不確定要素はない。

### 2.3 複雑性シグナル

**Simple CRUD**: business_units の実装パターンをほぼそのまま踏襲可能。テーブル構造が同一（code / name / display_order / created_at / updated_at / deleted_at）であり、差分は以下のみ：

- 主キー名: `business_unit_code` → `project_type_code`
- API パス: `/business-units` → `/project-types`
- パスパラメータ: `:businessUnitCode` → `:projectTypeCode`
- 参照チェック対象テーブル: 4テーブル → 2テーブル（projects, standard_effort_masters）

---

## 3. 実装アプローチ選択肢

### Option A: 新規コンポーネント作成（推奨）

**理由**: project_types は business_units とは独立したドメインエンティティであり、既存ファイルの拡張ではなく新規ファイルとして作成すべき。

**作成ファイル:**
```
apps/backend/src/
├── routes/projectTypes.ts
├── services/projectTypeService.ts
├── data/projectTypeData.ts
├── transform/projectTypeTransform.ts
├── types/projectType.ts
└── __tests__/
    ├── routes/projectTypes.test.ts
    ├── services/projectTypeService.test.ts
    ├── data/projectTypeData.test.ts
    ├── transform/projectTypeTransform.test.ts
    └── types/projectType.test.ts
```

**統合変更:**
- `src/index.ts` に `app.route('/project-types', projectTypes)` を追加

**トレードオフ:**
- ✅ business_units パターンの完全踏襲で一貫性を維持
- ✅ 各レイヤーの責務が明確
- ✅ テストが独立して実行可能
- ✅ 共通ユーティリティ（pagination, errorHelper, validate）をそのまま再利用
- ❌ ファイル数が増える（ただしマスタ CRUD として妥当）

### Option B: 汎用マスタ CRUD の抽象化

**理由**: business_units と project_types のテーブル構造が同一であることを活かし、共通の CRUD 基盤を構築。

**トレードオフ:**
- ✅ コード重複の削減
- ✅ 将来の work_types 等でも再利用可能
- ❌ 抽象化レイヤーの設計が必要
- ❌ 参照チェック対象テーブルが異なるため完全な汎用化は困難
- ❌ テストの複雑化
- ❌ YAGNI（過度な抽象化のリスク）

### Option C: ハイブリッド（Option A ベース + 将来的な共通化検討）

**理由**: まず Option A で実装し、work_types 等の追加マスタ CRUD 実装時に共通化を検討。

**トレードオフ:**
- ✅ 段階的アプローチで過度な抽象化を避ける
- ✅ 現時点では最小限の作業量
- ❌ 一時的にコード重複が発生する

---

## 4. 実装複雑度・リスク評価

### 工数: **S（1〜3日）**

**根拠**: business_units の実装パターンがそのまま踏襲可能。テーブル構造が同一であり、差分は名前の置換と参照チェック対象テーブルの変更のみ。

### リスク: **Low**

**根拠**:
- 確立されたパターンの踏襲
- 使い慣れた技術スタック（Hono + mssql + Zod + vitest）
- 明確なスコープ
- 統合ポイントが `index.ts` への1行追加のみ

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: **Option A（新規コンポーネント作成）**

**主要な設計判断:**
1. business_units と同一のレイヤー構成・ファイル命名規則を踏襲
2. 共通ユーティリティ（pagination, errorHelper, validate, getPool）はそのまま再利用
3. 参照チェック対象は `projects` と `standard_effort_masters` の2テーブル
4. テストも business_units と同一のパターンで全層カバー

**設計フェーズで確定すべき事項:**
- なし（技術的な不確定要素がないため、即座に設計・実装に移行可能）

**Research Items:**
- なし
