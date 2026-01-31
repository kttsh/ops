# 実装タスク

## タスク 1: Types 層の実装

- [x] `src/types/projectType.ts` を作成
- [x] `createProjectTypeSchema` を定義（projectTypeCode: 1-20文字英数字ハイフンアンダースコア, name: 1-100文字, displayOrder: 整数0以上デフォルト0）
- [x] `updateProjectTypeSchema` を定義（name: 必須1-100文字, displayOrder: 任意整数0以上）
- [x] `projectTypeListQuerySchema` を定義（paginationQuerySchema 拡張 + filter[includeDisabled]）
- [x] TypeScript 型を定義（CreateProjectType, UpdateProjectType, ProjectTypeListQuery, ProjectTypeRow, ProjectType）

## タスク 2: Transform 層の実装

- [x] `src/transform/projectTypeTransform.ts` を作成
- [x] `toProjectTypeResponse` 関数を実装（ProjectTypeRow → ProjectType 変換）
- [x] snake_case → camelCase 変換、Date → ISO 8601 文字列変換
- [x] deleted_at をレスポンスから除外

## タスク 3: Data 層の実装

- [x] `src/data/projectTypeData.ts` を作成
- [x] `findAll` を実装（ページネーション、includeDisabled、display_order ASC ソート）
- [x] `findByCode` を実装（アクティブレコードのみ）
- [x] `findByCodeIncludingDeleted` を実装（論理削除済み含む）
- [x] `create` を実装（OUTPUT INSERTED.* で結果返却）
- [x] `update` を実装（name + 任意 displayOrder + updated_at 自動更新）
- [x] `softDelete` を実装（deleted_at = GETDATE()）
- [x] `restore` を実装（deleted_at = NULL）
- [x] `hasReferences` を実装（projects + standard_effort_masters の2テーブル参照チェック）

## タスク 4: Service 層の実装

- [x] `src/services/projectTypeService.ts` を作成
- [x] `findAll` を実装（Data 層呼び出し + Transform 変換）
- [x] `findByCode` を実装（404 エラーハンドリング）
- [x] `create` を実装（重複チェック + 409 エラー、論理削除済み含む）
- [x] `update` を実装（404 エラーハンドリング）
- [x] `delete` を実装（参照チェック 409 + 存在チェック 404）
- [x] `restore` を実装（存在チェック 404 + 未削除チェック 409）

## タスク 5: Routes 層の実装

- [x] `src/routes/projectTypes.ts` を作成
- [x] GET / — 一覧取得（validate + ページネーション meta）
- [x] GET /:projectTypeCode — 単一取得
- [x] POST / — 新規作成（validate + 201 + Location ヘッダ）
- [x] PUT /:projectTypeCode — 更新（validate）
- [x] DELETE /:projectTypeCode — 論理削除（204）
- [x] POST /:projectTypeCode/actions/restore — 復元
- [x] `src/index.ts` に `app.route('/project-types', projectTypes)` を追加

## タスク 6: Types テストの実装

- [x] `src/__tests__/types/projectType.test.ts` を作成
- [x] createProjectTypeSchema のバリデーションテスト（正常値・境界値・異常値）
- [x] updateProjectTypeSchema のバリデーションテスト
- [x] projectTypeListQuerySchema のバリデーションテスト（デフォルト値・型変換・境界値）

## タスク 7: Transform テストの実装

- [x] `src/__tests__/transform/projectTypeTransform.test.ts` を作成
- [x] snake_case → camelCase 変換テスト
- [x] Date → ISO 8601 文字列変換テスト
- [x] deleted_at 除外テスト
- [x] displayOrder=0 エッジケーステスト

## タスク 8: Data テストの実装

- [x] `src/__tests__/data/projectTypeData.test.ts` を作成
- [x] findAll テスト（ページネーション、includeDisabled、offset 計算）
- [x] findByCode / findByCodeIncludingDeleted テスト
- [x] create テスト（パラメータ検証）
- [x] update テスト（displayOrder 有無のケース）
- [x] softDelete / restore テスト
- [x] hasReferences テスト

## タスク 9: Service テストの実装

- [x] `src/__tests__/services/projectTypeService.test.ts` を作成
- [x] findAll テスト（camelCase 変換、パラメータ渡し、空結果）
- [x] findByCode テスト（正常系・404）
- [x] create テスト（正常系・409 重複・409 論理削除済み）
- [x] update テスト（正常系・404）
- [x] delete テスト（正常系・404・409 参照）
- [x] restore テスト（正常系・404・409 未削除）

## タスク 10: Routes テストの実装

- [x] `src/__tests__/routes/projectTypes.test.ts` を作成
- [x] GET /project-types テスト（一覧・ページネーション・フィルタ・422）
- [x] GET /project-types/:projectTypeCode テスト（正常系・404）
- [x] POST /project-types テスト（201+Location・デフォルト値・409・422）
- [x] PUT /project-types/:projectTypeCode テスト（200・404・422）
- [x] DELETE /project-types/:projectTypeCode テスト（204・404・409）
- [x] POST /project-types/:projectTypeCode/actions/restore テスト（200・404・409）
