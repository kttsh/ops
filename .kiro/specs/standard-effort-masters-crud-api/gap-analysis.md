# Gap Analysis: standard-effort-masters-crud-api

## 1. 現状分析（Current State）

### 既存アセット

| カテゴリ | 状態 | 詳細 |
|---------|------|------|
| レイヤードアーキテクチャ | ✅ 確立済み | routes → services → data → database の4層構造 |
| CRUD実装パターン | ✅ 6エンティティ実装済み | businessUnits, projectTypes, workTypes, projects, projectCases, headcountPlanCases |
| 共有ユーティリティ | ✅ 利用可能 | errorHelper.ts（RFC 9457）, validate.ts（Zod middleware） |
| Zodスキーマパターン | ✅ 確立済み | create/update/listQuery スキーマの命名・構造が統一 |
| Transform層 | ✅ 確立済み | snake_case → camelCase 変換パターン |
| テストパターン | ✅ 確立済み | routes/services/data/transform/types の各層テスト |
| ページネーション | ✅ 確立済み | `page[number]`, `page[size]`, OFFSET/FETCH パターン |
| 論理削除・復元 | ✅ 確立済み | deleted_at パターン, `/actions/restore` エンドポイント |
| FK存在チェック | ✅ 確立済み | service層での存在確認 → 422エラー |
| フィルタリング | ✅ 確立済み | `filter[businessUnitCode]` 等のクエリパラメータ |

### 既存パターンとの差分

| 要素 | 既存パターン | standard_effort_masters の要件 | ギャップ |
|------|-------------|-------------------------------|---------|
| 主キー | INT IDENTITY（projects等）/ VARCHAR PK（business_units等） | INT IDENTITY | **なし** — projects パターンに準拠 |
| FK参照 | 単一FK（projects→business_units）または複数FK（projects→business_units, project_types） | 複数FK（→business_units, →project_types） | **なし** — projects パターンに準拠 |
| ユニーク制約 | 単一カラム（project_code）/なし | 複合ユニーク（business_unit_code + project_type_code + name） | **軽微** — 複合ユニークチェックのロジック追加が必要 |
| 子テーブル管理 | **存在しない** | weights の同時取得・作成・全置換 | **主要ギャップ** — 親子CRUDパターンが未確立 |
| トランザクション | **未使用** | weights 全置換時にトランザクションが必要 | **主要ギャップ** — トランザクション管理パターンが未確立 |
| 一覧での子データ | 不要 | 一覧では weights 不要、単一取得で必要 | **軽微** — 単一取得時のみ子データをJOIN/追加取得 |

---

## 2. 要件実現可能性分析

### 要件→技術ニーズマッピング

| 要件 | 技術ニーズ | ギャップ |
|------|-----------|---------|
| Req 1: 一覧取得 | ページネーション + BU/PT フィルタ | なし — 既存パターン適用可能 |
| Req 2: 単一取得 | マスタ + weights JOIN/追加クエリ | **Missing** — 子テーブルデータ取得パターン |
| Req 3: 新規作成 | マスタ INSERT + weights 一括INSERT | **Missing** — 親子同時作成 + トランザクション |
| Req 4: 更新 | マスタ UPDATE + weights 全置換 | **Missing** — 子レコード全置換 + トランザクション |
| Req 5: 論理削除 | deleted_at 設定 + 参照チェック | なし — 既存パターン適用可能 |
| Req 6: 復元 | deleted_at NULL + ユニーク重複チェック | **軽微** — 複合ユニークチェック |
| Req 7: レスポンス形式 | camelCase + weights 配列 | **軽微** — Transform に weights 変換追加 |
| Req 8: バリデーション | Zodスキーマ + weights 配列バリデーション | **軽微** — ネストされた配列のZodスキーマ |
| Req 9: テスト | 各層テスト + 子テーブル操作テスト | **軽微** — テストパターンは確立済み |

### 複雑度シグナル

- **CRUD基本操作**: 既存パターンの踏襲（低複雑度）
- **親子CRUD**: 新規パターンの確立が必要（中複雑度）
- **トランザクション管理**: 現在未使用のmssqlトランザクション機能の導入（中複雑度）
- **複合ユニーク制約チェック**: ロジック追加（低複雑度）

---

## 3. 実装アプローチ選択肢

### Option A: 既存パターン厳格踏襲（フラットCRUD + 子テーブルを別操作）

**概要**: マスタと weights を完全に分離し、weights 操作をマスタとは独立した操作として実装

- マスタの CRUD は既存パターンそのまま
- weights は単一取得レスポンスに含めるが、作成・更新は別リクエストまたは後続処理
- トランザクション不要（各操作が独立）

**トレードオフ**:
- ✅ 既存パターンとの一貫性が最も高い
- ✅ トランザクション管理不要
- ❌ マスタ作成時に weights を同時登録できない（要件 Req 3 との乖離）
- ❌ クライアント側で複数APIコールが必要

### Option B: 親子同時操作パターン新設（推奨）

**概要**: 既存レイヤードアーキテクチャに準拠しつつ、data層にトランザクション付き親子操作メソッドを追加

- マスタ CRUD は既存パターンに準拠
- 作成・更新時に `weights` を同時処理（data層でトランザクション管理）
- `mssql` の `pool.transaction()` を活用
- 単一取得時に weights を追加クエリで取得

**トレードオフ**:
- ✅ 要件を忠実に実現（Req 3, 4 の weights 同時操作）
- ✅ データ整合性をトランザクションで担保
- ✅ 既存レイヤー構造を維持しつつ拡張
- ❌ 新パターン（トランザクション）の導入が必要
- ❌ data層のメソッドが他エンティティより複雑になる

### Option C: ハイブリッド（マスタ既存パターン + weights PUT エンドポイント分離）

**概要**: マスタ CRUD は既存パターン、weights は `PUT /standard-effort-masters/:id/weights` として分離

- マスタの作成・更新では weights を扱わない
- weights の全置換は専用エンドポイントで実施
- 単一取得時のみ weights を含める

**トレードオフ**:
- ✅ RESTful な設計（サブリソースとしての weights）
- ✅ 各操作がシンプル
- ❌ 要件変更が必要（Req 3, 4 の作成・更新時 weights 同時操作を分離）
- ❌ クライアント側で複数ステップの操作が必要

---

## 4. 工数・リスク評価

### 工数: **S（1〜3日）**

**根拠**: 6エンティティの確立されたCRUDパターンがそのまま適用可能。新規パターン（トランザクション + 子テーブル操作）は限定的なスコープで、mssqlライブラリが既にサポートしている機能を使うだけ。

### リスク: **Low**

**根拠**:
- 使い慣れた技術スタック（Hono + mssql + Zod）
- 明確なスコープ（CRUD + 子テーブル操作のみ）
- 6つの既存実装例がリファレンスとして利用可能
- DB カスケード削除が設定済みで、論理削除時の子テーブル処理は不要

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: **Option B（親子同時操作パターン新設）**

**理由**:
1. 要件（Req 3, 4）で明示された weights 同時操作を忠実に実現
2. mssql の `pool.transaction()` は成熟した機能で導入リスクが低い
3. 将来的に他のエンティティ（例: indirect_work_cases + indirect_work_type_ratios）でも同様のパターンが必要になる可能性がある

### 設計フェーズでの検討事項

| 項目 | 内容 |
|------|------|
| トランザクション管理 | `pool.transaction()` の具体的な使用パターンと、エラー時のロールバック処理 |
| weights 取得方法 | 単一取得時に別クエリで取得するか、JOINで取得するかの選定 |
| weights バリデーション | `progressRate` の重複チェック（同一 standard_effort_id 内）をZod側/DB制約側のどちらで行うか |
| hasReferences 対象 | `project_cases.standard_effort_id` の参照チェック（既に projectCaseData に `standardEffortExists` メソッドが存在） |

### Research Needed

- なし（既存の mssql ライブラリのトランザクションAPIは十分にドキュメント化されている）
