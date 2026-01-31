# 調査・設計判断ログ

---
**目的**: 技術設計に影響を与える発見事項、アーキテクチャ調査、判断根拠を記録する。
---

## サマリ
- **フィーチャー**: `work-types`
- **ディスカバリスコープ**: Simple Addition（既存 CRUD パターンの拡張）
- **主な発見事項**:
  - business_units CRUD API が確立された4層アーキテクチャ（Routes → Service → Data → Transform）を使用しており、work-types はこのパターンをそのまま踏襲可能
  - work_types テーブルには business_units にない `color` カラム（VARCHAR(7), nullable）が存在し、バリデーションスキーマと型定義に追加が必要
  - 参照整合性チェックは `indirect_work_type_ratios` テーブルのみが対象（business_units の複数テーブル参照とは異なる）

## 調査ログ

### 既存 CRUD パターン分析
- **コンテキスト**: work-types API の設計基盤となるパターンの確認
- **参照ソース**: `apps/backend/src/routes/businessUnits.ts`, `services/businessUnitService.ts`, `data/businessUnitData.ts`, `transform/businessUnitTransform.ts`, `types/businessUnit.ts`
- **発見事項**:
  - Routes 層: Hono メソッドチェーンパターンで型安全な RPC をエクスポート
  - Service 層: ビジネスルール（重複チェック、参照整合性、論理削除状態チェック）を実装
  - Data 層: mssql ドライバの parameterized query でSQLインジェクション防止
  - Transform 層: DB行（snake_case）→ APIレスポンス（camelCase）の変換
  - ルートマウント: `app.route('/business-units', businessUnits)` で `src/index.ts` に登録
- **影響**: work-types はこのパターンを完全踏襲。差分は `color` フィールドの追加と参照先テーブルの変更のみ

### work_types テーブルの business_units との差分
- **コンテキスト**: テーブル仕様の差分がインターフェース設計に与える影響の特定
- **発見事項**:
  - `color` カラム（VARCHAR(7), NULL許容）: #RRGGBB 形式のカラーコード
  - 主キー名: `work_type_code`（business_units は `business_unit_code`）
  - 他フィールド（name, display_order, created_at, updated_at, deleted_at）は同一構造
- **影響**: Create/Update スキーマに `color` フィールドを追加。Transform 層で `color` を含む camelCase 変換を実装

### 参照整合性チェック対象
- **コンテキスト**: 論理削除時の参照整合性チェック対象テーブルの特定
- **参照ソース**: `docs/database/table-spec.md`（indirect_work_type_ratios テーブル定義）
- **発見事項**:
  - `indirect_work_type_ratios.work_type_code` が `work_types.work_type_code` を参照（FK）
  - `indirect_work_type_ratios` は物理削除テーブル（deleted_at なし）のため、存在チェックのみでよい
- **影響**: `hasReferences()` は `indirect_work_type_ratios` テーブルの存在チェック1つのみ

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク / 制限 | 備考 |
|-----------|------|------|-------------|------|
| 既存4層パターン踏襲 | Routes → Service → Data → Transform | 実績あり、一貫性、学習コスト不要 | なし | business_units と同一パターン |

## 設計判断

### 判断: 既存 CRUD パターンの完全踏襲
- **コンテキスト**: work-types は business_units と同じマスタテーブル CRUD
- **代替案**: なし（既存パターンが確立されており逸脱する理由がない）
- **選択されたアプローチ**: business_units と同一の4層構成で実装
- **根拠**: 一貫性の維持、実装リスクの最小化
- **トレードオフ**: なし
- **フォローアップ**: `color` フィールドのバリデーション（#RRGGBB 正規表現）のテスト

### 判断: color フィールドの nullable 設計
- **コンテキスト**: color は任意項目で NULL を許容する
- **代替案**: デフォルトカラーコードを設定する
- **選択されたアプローチ**: NULL 許容。更新時は `null` を明示的に送信することでクリア可能
- **根拠**: テーブル仕様に準拠。カラーはUIで動的に割り当てられる可能性がある
- **トレードオフ**: クライアント側で NULL ハンドリングが必要
- **フォローアップ**: 更新スキーマで `color: z.string().regex(...).nullable().optional()` の挙動を検証

## リスクと緩和策
- **リスク1**: color バリデーションの正規表現が不正確 → `^#[0-9a-fA-F]{6}$` で厳密に検証
- **リスク2**: `indirect_work_type_ratios` 以外に将来の参照テーブルが追加される可能性 → `hasReferences()` を拡張可能な設計にしておく

## 参考文献
- RFC 9457 Problem Details for HTTP APIs — エラーレスポンス形式
- 既存実装: `apps/backend/src/routes/businessUnits.ts` — ルーティングパターン
- テーブル仕様書: `docs/database/table-spec.md` — work_types テーブル定義
