# Requirements Document

## Introduction

リファクタリング計画書 Phase 2 の 2-1（CRUD API インフラ）および 2-2（カラムファクトリ）を実施する。

7つの feature に散在する CRUD API クライアント・Query Key Factory・Mutation Hook・カラム定義の重複パターンをファクトリ関数/ジェネレータに抽象化し、各 feature ファイルをファクトリ呼び出しに置換する。

Phase 1（`frontend-common-utils` spec）で導入済みの共有ユーティリティ（`lib/api/constants.ts`, `lib/api/client.ts`, `lib/format-utils.ts`, `lib/validators.ts`, `components/shared/StatusBadge.tsx`, `components/shared/SortableHeader.tsx`）を基盤として活用する。

### 対応するコードスメル

| ID | スメル | 深刻度 | 推定重複行数 |
|----|--------|--------|-------------|
| F-A1 | API クライアントの CRUD パターン重複 | CRITICAL | ~180行 |
| F-A2 | Query Key Factory の重複 | HIGH | ~63行 |
| F-A3 | Mutation Hook の重複 | HIGH | ~192行 |
| F-C2 | ステータスバッジカラムの重複 | HIGH | ~30行 |
| F-C3 | 復元アクションカラムの重複 | HIGH | ~50行 |

### 前提条件

- Phase 1 で導入された共有ユーティリティ（`lib/api/`, `lib/format-utils.ts`, `components/shared/`）が利用可能であること
- 既存の全 feature の外部 API レスポンスおよび UI の振る舞いは一切変更しない（純粋なリファクタリング）

## Requirements

### Requirement 1: CRUD API クライアントファクトリ

**Objective:** As a フロントエンド開発者, I want 型安全な CRUD API クライアントをファクトリ関数で生成したい, so that 新しいエンティティ追加時に API クライアントのボイラープレートを書く必要がなくなる

#### Acceptance Criteria

1. The `createCrudClient` ファクトリ shall リソースパスとID フィールド名の設定から、`fetchList`, `fetchDetail`, `create`, `update`, `delete`, `restore` の6つの API 関数を含むクライアントオブジェクトを返す
2. The `createCrudClient` ファクトリ shall エンティティ型（レスポンス型・作成入力型・更新入力型）およびID型に対するジェネリクス型パラメータを受け取り、すべての API 関数の引数・戻り値が型安全である
3. The `createCrudClient` ファクトリ shall `string` 型ID（コードベースのエンティティ）と `number` 型ID（数値IDベースのエンティティ）の両方をサポートする
4. The `createCrudClient` ファクトリ shall ページネーションなしのリストパラメータ（`includeDisabled` のみ）とページネーション付きリストパラメータ（`page`, `pageSize`, `includeDisabled`）の両方をサポートする
5. The `createCrudClient` ファクトリ shall 既存の `API_BASE_URL`, `ApiError`, `handleResponse` ユーティリティ（`@/lib/api`）を内部で使用する
6. When `createCrudClient` で生成したクライアントを使って API を呼び出す場合, the クライアント shall 既存の API クライアントと同一の HTTP リクエスト（URL, メソッド, ヘッダー, ボディ）を送信する
7. The `createCrudClient` ファクトリ shall `@/lib/api/crud-client-factory.ts` に配置される

### Requirement 2: Query Key Factory ジェネレータ

**Objective:** As a フロントエンド開発者, I want Query Key を自動生成するジェネレータ関数を使いたい, so that Query Key の定義パターンが統一され、タイプミスによるキャッシュ不整合を防げる

#### Acceptance Criteria

1. The `createQueryKeys` ジェネレータ shall リソース名文字列を受け取り、`all`, `lists`, `list(params)`, `details`, `detail(id)` の5つのキー生成関数を含むオブジェクトを返す
2. The `createQueryKeys` ジェネレータ shall 生成されるキー配列が TanStack Query の階層的無効化（`queryKey` プレフィックスマッチング）に対応した構造を持つ
3. The `createQueryKeys` ジェネレータ shall 既存の各 feature で定義されている Query Key と同一の構造（`[resourceName]`, `[resourceName, "list"]`, `[resourceName, "list", params]`, `[resourceName, "detail"]`, `[resourceName, "detail", id]`）を返す
4. The `createQueryKeys` ジェネレータ shall `@/lib/api/query-key-factory.ts` に配置される

### Requirement 3: 標準 queryOptions ファクトリ

**Objective:** As a フロントエンド開発者, I want queryOptions 定義を簡潔に生成したい, so that staleTime やキー設定の重複を排除し、一覧・詳細クエリの定義を統一できる

#### Acceptance Criteria

1. The queryOptions ファクトリ shall リスト用の `queryOptions`（Query Key Factory + フェッチ関数 + staleTime）を生成する関数を提供する
2. The queryOptions ファクトリ shall 詳細用の `queryOptions`（Query Key Factory + フェッチ関数 + staleTime）を生成する関数を提供する
3. The queryOptions ファクトリ shall `STALE_TIMES` 定数（`@/lib/api/constants.ts`）をデフォルト値として使用し、呼び出し側でオーバーライド可能である
4. The queryOptions ファクトリ shall 各 feature の `queries.ts` から直接利用でき、既存の `queryOptions()` 呼び出しと同一のオブジェクトを返す
5. The queryOptions ファクトリ shall `@/lib/api/query-key-factory.ts` にQuery Key ジェネレータと併置される

### Requirement 4: CRUD Mutation Hook ファクトリ

**Objective:** As a フロントエンド開発者, I want CRUD 操作用の Mutation Hook をファクトリ関数で一括生成したい, so that キャッシュ無効化ロジックの重複を解消し、全エンティティで一貫した Mutation 動作を保証できる

#### Acceptance Criteria

1. The `createCrudMutations` ファクトリ shall CRUD クライアントと Query Key Factory を受け取り、`useCreate`, `useUpdate`, `useDelete`, `useRestore` の4つの Mutation Hook を含むオブジェクトを返す
2. When `useCreate` フックの Mutation が成功した場合, the フック shall `lists()` キーを無効化する
3. When `useUpdate` フックの Mutation が成功した場合, the フック shall `lists()` キーおよび対象の `detail(id)` キーを無効化する
4. When `useDelete` フックの Mutation が成功した場合, the フック shall `lists()` キーを無効化する
5. When `useRestore` フックの Mutation が成功した場合, the フック shall `lists()` キーを無効化する
6. The `createCrudMutations` ファクトリ shall 各フックで `onSuccess` コールバックを呼び出し側が追加で指定可能である（トースト通知等の拡張ポイント）
7. The `createCrudMutations` ファクトリ shall `@/lib/api/mutation-hooks-factory.ts` に配置される

### Requirement 5: カラム定義ヘルパー関数群

**Objective:** As a フロントエンド開発者, I want テーブルカラムの共通パターンをヘルパー関数で生成したい, so that カラム定義の重複を排除し、一覧テーブルのカラム構成を簡潔に記述できる

#### Acceptance Criteria

1. The `createStatusColumn` ヘルパー shall `deletedAt` フィールドの値に基づいて「アクティブ」/「削除済み」の Badge を表示するカラム定義を返す
2. The `createStatusColumn` ヘルパー shall 既存の `StatusBadge` コンポーネント（`@/components/shared/StatusBadge.tsx`）を内部で使用する
3. The `createRestoreActionColumn` ヘルパー shall `onRestore` コールバックとIDキー名を受け取り、削除済みレコードに対して「復元」ボタンを表示するカラム定義を返す
4. When 復元ボタンがクリックされた場合, the カラム shall イベントの伝播を停止し（`stopPropagation`）、指定された `onRestore` コールバックに対象レコードの ID を渡す
5. The `createDateTimeColumn` ヘルパー shall アクセサキーとラベルを受け取り、`formatDateTime` で整形した値を表示する `SortableHeader` 付きカラム定義を返す
6. The `createSortableColumn` ヘルパー shall アクセサキーとラベルを受け取り、`SortableHeader` 付きの基本的なカラム定義を返す
7. The カラムヘルパー関数群 shall `@/components/shared/column-helpers.ts` に配置される

### Requirement 6: 既存 feature への適用

**Objective:** As a フロントエンド開発者, I want 既存の全対象 feature がファクトリ関数を使用する形にリファクタリングされた状態にしたい, so that コードベース全体で一貫したパターンが適用され、重複コードが実際に削減される

#### Acceptance Criteria

1. When リファクタリング完了後, the 対象 feature（`work-types`, `business-units`, `project-types`, `projects`）の `api-client.ts` shall `createCrudClient` ファクトリの呼び出しに置換され、ローカルの CRUD 関数定義が削除されている
2. When リファクタリング完了後, the 対象 feature の `queries.ts` shall `createQueryKeys` ジェネレータの呼び出しに置換され、ローカルの Query Key Factory 定義が削除されている
3. When リファクタリング完了後, the 対象 feature の `mutations.ts` shall `createCrudMutations` ファクトリの呼び出しに置換され、ローカルの Mutation Hook 定義が削除されている
4. When リファクタリング完了後, the 対象 feature の `columns.tsx` shall カラムヘルパー関数を使用し、ステータスカラム・復元アクションカラム・日時カラムのローカル定義が削除されている
5. When リファクタリング完了後, the 各 feature の `api-client.ts`, `queries.ts`, `mutations.ts` shall 既存の全インポート元（他の feature コンポーネント、ルートファイル等）から引き続き正常にインポート可能であり、エクスポートの型互換性が維持されている
6. If feature 固有のカスタムロジック（例: Projects の Select 用クエリ、固有のカラム定義）がある場合, the feature shall ファクトリ出力に加えてカスタム定義を追加する形で実装される
7. The リファクタリング shall 対象 feature 以外のコード（`case-study`, `indirect-case-study`, `workload` 等）には変更を加えない

### Requirement 7: 型安全性とテスト

**Objective:** As a フロントエンド開発者, I want ファクトリ関数がTypeScript の型推論と整合し、既存テストが全パスすることを確認したい, so that リファクタリングにより既存の振る舞いが壊れていないことを保証できる

#### Acceptance Criteria

1. The すべてのファクトリ関数 shall TypeScript strict mode でコンパイルエラーなくビルドが通る
2. The すべてのファクトリ関数 shall `any` 型を使用しない
3. The ファクトリ関数の戻り値型 shall ジェネリクスにより呼び出し時の型パラメータから正しく推論される
4. When リファクタリング完了後, the 既存のフロントエンドテストスイート shall 全テストがパスする
5. The ファクトリ関数（`createCrudClient`, `createQueryKeys`, `createCrudMutations`）shall ユニットテストを持ち、生成されるオブジェクトの構造と型が正しいことを検証する
