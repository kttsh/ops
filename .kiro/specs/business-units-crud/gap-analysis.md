# Gap Analysis: business-units-crud

## 1. 現状調査

### コードベースの状態

バックエンド（`apps/backend/`）はAPI実装が**完全に未着手**の状態。DB自体は Azure SQL Server 上に構築済み。

| 対象 | 状態 | 備考 |
|---|---|---|
| DB（Azure SQL Server） | **構築済み** | テーブル・サンプルデータ投入済み |
| `.env` | **設定済み** | `DB_SERVER`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` |
| `src/database/` | 未作成 | DB接続クライアントの実装が必要 |
| `src/routes/` | 未作成 | |
| `src/services/` | 未作成 | |
| `src/data/` | 未作成 | |
| `src/types/` | 未作成 | |
| `src/transform/` | 未作成 | |
| `src/utils/` | 未作成 | |
| `src/index.ts` | 未作成 | |
| テストファイル | 未作成 | |
| `package.json` | 未作成（backend用） | |

### 利用可能なアセット

| アセット | 状態 | 備考 |
|---|---|---|
| DB スキーマ定義 | 完備 | `docs/database/table-spec.md` + `schema.sql` |
| サンプルデータ | 完備 | `seed.sql` に PLANT / TRANS / CO2 の3件あり |
| Hono CRUD ガイド | 完備 | `docs/rules/hono/crud-guide.md` に完全なパターン |
| API レスポンス規約 | 完備 | RFC 9457 Problem Details 準拠 |
| バリデーション規約 | 完備 | Zod + @hono/zod-validator |
| エラーハンドリング規約 | 完備 | `docs/rules/hono/error-handling.md` |
| フォルダ構成規約 | 完備 | `docs/rules/folder-structure.md` |
| DB接続情報 | 完備 | `.env` に SQL Server 接続情報あり |

### 既存パターン・規約

- **フレームワーク**: Hono（@hono/node-server）
- **バリデーション**: Zod + @hono/zod-validator
- **DB**: Microsoft SQL Server（Azure SQL Database）
- **テスト**: Vitest + `app.request()` / `testClient`
- **レイヤー構成**: routes → services → data → database（CRUD ガイドに準拠）
- **レスポンス形式**: `{ data, meta?, links? }` / RFC 9457 エラー

---

## 2. 要件実現可能性分析

### 要件→技術ニーズマッピング

| 要件 | 技術ニーズ | ギャップ |
|---|---|---|
| Req 1: 一覧取得 | ページネーション、ソート（display_order）、論理削除フィルタ | **Missing**: 全レイヤー未実装 |
| Req 2: 単一取得 | パスパラメータ（businessUnitCode） | **Missing**: 全レイヤー未実装 |
| Req 3: 新規作成 | Zodバリデーション、重複チェック、Location ヘッダ | **Missing**: 全レイヤー未実装 |
| Req 4: 更新 | PUT バリデーション、updated_at 自動更新 | **Missing**: 全レイヤー未実装 |
| Req 5: 論理削除 | 参照整合性チェック（FK依存テーブル確認） | **Missing**: 全レイヤー未実装 |
| Req 6: 復元 | `/actions/restore` エンドポイント | **Missing**: 全レイヤー未実装 |
| Req 7: レスポンス形式 | camelCase 変換、共通レスポンス構造 | **Missing**: transform層、utils層 |
| Req 8: バリデーション | Zod スキーマ、複数エラー一括返却 | **Missing**: types層、カスタムバリデータ |

### 複雑性シグナル

- **基本 CRUD**: 標準的な CRUD パターン（ガイドに完全なテンプレートあり）
- **論理削除**: `deleted_at` による標準的なソフトデリートパターン
- **参照整合性チェック**: 4テーブル（projects, headcount_plan_cases, indirect_work_cases, standard_effort_masters）からの FK 参照確認が必要
- **復元機能**: API レスポンス規約に `POST /actions/restore` パターンが定義済み

### Research Needed

1. **DB クライアントライブラリの選定**: ORM は禁止。mssql（node-mssql）パッケージで生 SQL を実行する方針を採用。`.env` の接続情報（`DB_SERVER`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`）を利用する → **解決済み**
2. **参照整合性チェックの実装方法**: FK 依存テーブルへのクエリ方式（COUNT クエリ or EXISTS チェック） → **EXISTS で解決済み**

---

## 3. 実装アプローチ選択肢

### Option B: 新規コンポーネント作成（推奨）

**理由**: バックエンドが完全にグリーンフィールドであり、既存コードの拡張対象が存在しない。

**作成するファイル一覧**:

```
apps/backend/
├── package.json                          # Hono + 依存関係
├── tsconfig.json                         # TypeScript 設定
├── vitest.config.ts                      # テスト設定
├── src/
│   ├── index.ts                          # エントリーポイント
│   ├── database/
│   │   └── client.ts                     # DB 接続設定
│   ├── types/
│   │   ├── businessUnit.ts               # Zod スキーマ + 型
│   │   └── pagination.ts                 # ページネーション共通スキーマ
│   ├── data/
│   │   └── businessUnitData.ts           # DB クエリ
│   ├── transform/
│   │   └── businessUnitTransform.ts      # DB行 ↔ APIレスポンス変換
│   ├── services/
│   │   └── businessUnitService.ts        # ビジネスロジック
│   ├── routes/
│   │   └── businessUnits.ts              # エンドポイント定義
│   └── utils/
│       └── errorHelper.ts                # RFC 9457 エラーヘルパー
└── src/__tests__/
    └── routes/
        └── businessUnits.test.ts         # API テスト
```

**トレードオフ**:
- ✅ ガイドの規約に完全準拠した構成
- ✅ 今後の他リソース CRUD（project_types, work_types 等）のテンプレートとなる
- ✅ 共通コンポーネント（DB接続、エラーヘルパー、ページネーション）が再利用可能
- ❌ 初回はセットアップ工数が相対的に大きい（package.json, tsconfig, DB接続等）

---

## 4. 工数・リスク評価

| 項目 | 評価 | 根拠 |
|---|---|---|
| **工数** | **M（3〜7日）** | DB は構築済みだが、API 側は初回実装のためセットアップ（パッケージ、DB接続、共通ユーティリティ）が必要。CRUD パターンは明確にガイド化されている |
| **リスク** | **Low〜Medium** | パターンは明確。DB は稼働済みだが、Node.js からの SQL Server 接続クライアント選定・接続確認が未検証。参照整合性チェックもやや複雑 |

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ

**Option B（新規作成）** を採用し、以下の順序で実装：

1. プロジェクトセットアップ（package.json, tsconfig, vitest）
2. DB 接続層
3. 型定義・Zod スキーマ
4. データ層 → 変換層 → サービス層 → ルート層（ボトムアップ）
5. グローバルエラーハンドラ
6. テスト

### 設計フェーズで調査が必要な項目

1. **DB クライアント選定**: mssql（node-mssql）+ 生 SQL に決定（ORM 禁止）
2. **参照整合性チェック**: 4 テーブルに対する EXISTS チェックを OR 結合で実装
3. **共通ミドルウェア**: requestId 生成、CORS 設定の詳細
4. **RPC 型エクスポート**: フロントエンドとの型共有方式（hono/client を使用するか）
