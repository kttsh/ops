# Research & Design Decisions

## Summary
- **Feature**: `chart-view-indirect-work-items-crud-api`
- **Discovery Scope**: Simple Addition（既存パターン踏襲のCRUD API追加）
- **Key Findings**:
  - 関連テーブルCRUD APIの確立されたパターンが `indirectWorkTypeRatios` に存在し、完全に踏襲可能
  - chart_view_indirect_work_items は chart_view_project_items の姉妹テーブルであり、同一の設計パターンを適用する
  - 物理削除・ネストURL・ページネーション不要の3点がエンティティテーブルとの主要な差異

## Research Log

### 既存の関連テーブルCRUDパターン
- **Context**: chart_view_indirect_work_items は関連テーブルであり、エンティティテーブルとは異なるCRUDパターンが必要
- **Sources Consulted**: `indirectWorkTypeRatios`（routes/services/data/transform/types）の実装を全レイヤーで調査
- **Findings**:
  - ネストURLパターン: `/parent/:parentId/children` 形式
  - 親IDの検証: サービス層で親エンティティの存在確認（論理削除済みも404扱い）
  - 所有権検証: 子リソースの `parent_id` と URL パラメータの `parentId` の一致を確認
  - 物理削除: DELETE で行を物理的に削除、復元エンドポイントなし
  - ページネーション不要: 全件を返却（子リソースの件数は限定的）
  - `parseIntParam` はルートファイル内にローカル定義
- **Implications**: 既存パターンを忠実に踏襲し、新たなアーキテクチャ判断は不要

### ルート登録パターン
- **Context**: 新しいネストルートをメインアプリにどう登録するか
- **Sources Consulted**: `apps/backend/src/index.ts`
- **Findings**:
  - ネストルートは `app.route('/parent/:parentId/children', childRouter)` 形式で登録
  - 既存例: `app.route('/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios', indirectWorkTypeRatios)`
  - chart_views のルートは `/chart-views` で登録済み
  - 新たに `/chart-views/:chartViewId/indirect-work-items` を追加する必要あり
- **Implications**: index.ts に1行追加するだけで統合完了

### 重複チェックの方針
- **Context**: 同一チャートビュー内で同じ indirect_work_case_id の登録を防止する必要がある
- **Sources Consulted**: `indirectWorkTypeRatios` の compositeKeyExists パターン
- **Findings**:
  - 既存パターンでは `compositeKeyExists` メソッドでユニーク制約をアプリケーション層で検証
  - chart_view_indirect_work_items は DB 側でユニーク制約がないため（インデックス定義なし）、アプリケーション層での重複チェックが必要
  - `chart_view_id + indirect_work_case_id` の組み合わせで重複を検出
- **Implications**: Data層に `duplicateExists(chartViewId, indirectWorkCaseId)` メソッドを実装

### JOINによる関連データ取得
- **Context**: レスポンスに indirect_work_cases の caseName を含める必要がある
- **Sources Consulted**: 他のAPI（indirect_work_cases のbusinessUnitName JOINパターン）
- **Findings**:
  - 一覧取得・単一取得のSQLでLEFT JOINを使用し、関連テーブルから名称を取得するパターンが確立済み
  - chart_view_indirect_work_items では indirect_work_cases テーブルとJOINして `case_name` を取得
  - DB Row型に `case_name` フィールドを追加し、Transform層でマッピング
- **Implications**: SELECT文にLEFT JOINを追加し、Row型・Response型に caseName を含める

## Design Decisions

### Decision: ネストURLパターンの採用
- **Context**: chart_view_indirect_work_items はチャートビューに従属するリソース
- **Alternatives Considered**:
  1. フラットURL `/chart-view-indirect-work-items` — 独立リソースとして扱う
  2. ネストURL `/chart-views/:chartViewId/indirect-work-items` — 親子関係を表現
- **Selected Approach**: ネストURL
- **Rationale**: 既存のネストルートパターンと一貫性があり、リソースの所有関係が明確
- **Trade-offs**: URLが長くなるが、RESTful設計の原則に合致
- **Follow-up**: なし

### Decision: ページネーションなし
- **Context**: 1つのチャートビューに紐づく間接作業項目の数は限定的（通常10件未満）
- **Selected Approach**: ページネーションなしで全件返却
- **Rationale**: 既存の関連テーブル（indirectWorkTypeRatios等）と同じアプローチ
- **Trade-offs**: 大量データ時にレスポンスサイズが増大する可能性があるが、実用上問題なし

## Risks & Mitigations
- **Risk 1**: DB側にユニーク制約がないため、同時リクエストで重複が発生する可能性 — アプリケーション層での重複チェックに加え、必要に応じてDBユニーク制約の追加を検討
- **Risk 2**: 親テーブル（chart_views）が論理削除された場合の子リソースの扱い — サービス層で親の存在確認時に `deleted_at IS NULL` 条件を含める

## References
- 既存実装: `apps/backend/src/routes/indirectWorkTypeRatios.ts` — 関連テーブルCRUDの基準実装
- API応答規約: `docs/rules/api-response.md` — RFC 9457 Problem Details形式
- テーブル仕様: `docs/database/table-spec.md` — chart_view_indirect_work_items テーブル定義
