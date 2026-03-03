# Implementation Plan

- [x] 1. 共有インフラファクトリの実装
- [x] 1.1 (P) CRUD API クライアントファクトリの実装とテスト
  - 設定オブジェクト（リソースパス、ページネーション有無）から6つの CRUD API 関数（一覧取得・詳細取得・作成・更新・削除・復元）を生成するファクトリ関数を実装する
  - string 型 ID と number 型 ID の両方に対応し、URL エンコードは一律 `encodeURIComponent(String(id))` で統一する
  - ページネーションなしパラメータ（フィルタのみ）とページネーション付きパラメータ（ページ番号・ページサイズ・フィルタ）の両方をサポートする
  - 既存の `API_BASE_URL`, `handleResponse`, `ApiError` を内部で使用し、既存の手書き API クライアントと同一の HTTP リクエストを送信することを保証する
  - fetch を mock したユニットテストで、各関数が正しい URL・HTTP メソッド・ヘッダー・ボディで呼び出されることを検証する
  - `lib/api/index.ts` に re-export を追加する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.1, 7.2, 7.3, 7.5_
  - _Contracts: CrudClientFactory Service_

- [x] 1.2 (P) Query Key ジェネレータと queryOptions ファクトリの実装とテスト
  - リソース名文字列から5つの階層的キー生成関数（all, lists, list, details, detail）を返すジェネレータ関数を実装する
  - 生成されるキー配列が TanStack Query のプレフィックスマッチングに対応した構造（`[resourceName]` → `[resourceName, "list"]` → `[resourceName, "list", params]` 等）を持つことを保証する
  - リスト用・詳細用の queryOptions ヘルパー関数を実装し、Query Key Factory + フェッチ関数 + staleTime を受け取って `queryOptions()` と同一のオブジェクトを返す
  - staleTime のデフォルト値は `STALE_TIMES.STANDARD` とし、呼び出し側からオーバーライド可能にする
  - ユニットテストでキー構造の正確性と queryOptions の生成結果を検証する
  - `lib/api/index.ts` に re-export を追加する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.5_
  - _Contracts: QueryKeyFactory Service_

- [x] 1.3 (P) カラム定義ヘルパー関数群の実装とテスト
  - ソフトデリート状態に基づくステータスバッジカラムを生成するヘルパーを実装する（内部で既存の `StatusBadge` コンポーネントを使用）
  - 削除済みレコードに対する復元ボタン付きアクションカラムを生成するヘルパーを実装する（`stopPropagation` 付き、ID キー名とコールバックを設定可能）
  - 日時フィールドを `formatDateTime` で整形して表示するカラムを生成するヘルパーを実装する（`SortableHeader` 付き）
  - 任意のフィールドに対する `SortableHeader` 付き基本カラムを生成するヘルパーを実装する
  - 各ヘルパーがジェネリクス `<TData>` で任意のエンティティ型に対応することを保証する
  - ユニットテストで返却される `ColumnDef` の構造（id, accessorKey, header, cell の存在と型）を検証する
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2, 7.3_
  - _Contracts: ColumnHelpers Service_

- [x] 1.4 Mutation Hook ファクトリの実装とテスト
  - CRUD クライアントと Query Key Factory を受け取り、4つの Mutation Hook（作成・更新・削除・復元）を返すファクトリ関数を実装する
  - 作成フックは一覧キーの無効化、更新フックは一覧キーと詳細キーの無効化、削除・復元フックは一覧キーの無効化を組み込む
  - 各フックで呼び出し側が追加の `onSuccess` コールバックを指定可能にする（組み込みの無効化ロジックの後に実行）
  - Task 1.1 の `CrudClient` 型と Task 1.2 の `QueryKeys` 型に依存するため、それらの完了後に着手する
  - ユニットテストで各 Hook のキャッシュ無効化パターンが正しいことを検証する
  - `lib/api/index.ts` に re-export を追加する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.1, 7.2, 7.3, 7.5_
  - _Contracts: MutationHooksFactory Service_

- [x] 2. 対象 feature のファクトリ移行
- [x] 2.1 (P) work-types feature の移行
  - `api-client.ts` をファクトリ呼び出しに置換し、ローカルの CRUD 関数定義を削除する（string ID、ページネーションなし）
  - `queries.ts` をジェネレータ呼び出しに置換し、ローカルの Query Key Factory と queryOptions 定義を削除する
  - `mutations.ts` をファクトリ呼び出しに置換し、ローカルの4つの Mutation Hook 定義を削除する
  - `columns.tsx` でステータスカラム・復元アクションカラム・更新日時カラムをヘルパー呼び出しに置換する
  - 既存のエクスポート名と型を維持し、他ファイルからのインポートが壊れないことを確認する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

- [x] 2.2 (P) business-units feature の移行
  - `api-client.ts` をファクトリ呼び出しに置換する（string ID、ページネーションあり）
  - `queries.ts` をジェネレータ呼び出しに置換する
  - `mutations.ts` をファクトリ呼び出しに置換する
  - `columns.tsx` でステータスカラム・復元アクションカラム・更新日時カラムをヘルパー呼び出しに置換する
  - 既存のエクスポート名と型を維持し、他ファイルからのインポートが壊れないことを確認する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

- [x] 2.3 (P) project-types feature の移行
  - `api-client.ts` をファクトリ呼び出しに置換する（string ID、ページネーションなし）
  - `queries.ts` をジェネレータ呼び出しに置換する
  - `mutations.ts` をファクトリ呼び出しに置換する
  - `columns.tsx` でステータスカラム・復元アクションカラム・更新日時カラムをヘルパー呼び出しに置換する
  - 既存のエクスポート名と型を維持し、他ファイルからのインポートが壊れないことを確認する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

- [x] 2.4 (P) projects feature の移行
  - `api-client.ts` をファクトリ呼び出しに置換する（number ID、ページネーションあり）
  - Projects 固有の Select クエリ用フェッチ関数（事業部・プロジェクト種別）はファクトリ外の個別定義として残す
  - `queries.ts` をジェネレータ呼び出しに置換し、Select 用 queryOptions は個別定義として残す
  - `mutations.ts` をファクトリ呼び出しに置換する
  - `columns.tsx` で復元アクションカラム・更新日時カラムをヘルパー呼び出しに置換する（Projects 固有のビジネスステータスカラムは個別定義のまま維持）
  - 既存のエクスポート名と型を維持し、他ファイルからのインポートが壊れないことを確認する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.4_

- [x] 3. 統合検証と型互換性確認
  - TypeScript の型チェック（`tsc --noEmit`）を実行し、全ファイルがコンパイルエラーなくパスすることを確認する
  - 既存のフロントエンドテストスイートを実行し、全テストがパスすることを確認する
  - 対象 feature 以外のコード（`case-study`, `indirect-case-study`, `workload` 等）に変更が入っていないことを git diff で確認する
  - _Requirements: 6.7, 7.1, 7.2, 7.3, 7.4_
