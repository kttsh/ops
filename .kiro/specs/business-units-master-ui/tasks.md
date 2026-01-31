# Implementation Plan

- [x] 1. フロントエンドプロジェクト初期セットアップ
- [x] 1.1 Vite + React + TypeScript プロジェクトの初期化
  - `apps/frontend` に Vite + React + TypeScript プロジェクトを作成する
  - `package.json` にワークスペース名 `frontend` を設定し、pnpm-workspace に追加する
  - `tsconfig.json` で strict mode を有効化し、`@/*` パスエイリアスを設定する
  - `vite.config.ts` でプロキシ設定（API リクエストをバックエンドに転送）を含める
  - _Requirements: 12.1_

- [x] 1.2 TanStack Router セットアップ
  - `@tanstack/react-router` と `@tanstack/router-vite-plugin` をインストールする
  - `vite.config.ts` に TanStack Router Vite Plugin を追加する
  - `tsr.config.json` で `autoCodeSplitting: true` を設定する
  - `src/routes/__root.tsx` にルートレイアウトを作成する
  - `src/main.tsx` に Router インスタンスと RouterProvider を設定する
  - `@tanstack/zod-adapter` をインストールし、search params バリデーションの準備を行う
  - _Requirements: 8.1_

- [x] 1.3 TanStack Query セットアップ
  - `@tanstack/react-query` をインストールする
  - `QueryClient` を作成し、`QueryClientProvider` でアプリケーションをラップする
  - `staleTime` を 30 秒に設定する
  - _Requirements: 12.2_

- [x] 1.4 shadcn/ui + Tailwind CSS セットアップとカスタムテーマ適用
  - Tailwind CSS v4 をインストール・設定する
  - shadcn/ui を初期化し、必要なコンポーネント（Button, Input, Label, Table, Badge, Dialog, Sheet, Toast, Switch）を追加する
  - nani.now デザイン言語を参考にカスタムテーマを適用する: 大きめの角丸（`rounded-xl` 〜 `rounded-2xl`）、控えめなシャドウ（`shadow-sm`）、ゆとりのあるスペーシング
  - CSS 変数で `--radius` をグローバルに調整する
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 2. アプリケーションレイアウト（サイドバー + シェル）
- [x] 2.1 AppShell レイアウトコンポーネントの構築
  - サイドバー + メインコンテンツ領域のレイアウトシェルを構築する
  - サイドバーにマスタ管理メニュー（ビジネスユニット等）を配置する
  - メインコンテンツ領域を中央寄せ（`max-w-4xl mx-auto`）し、左右に余白を確保する
  - デスクトップ（1024px+）ではサイドバーを常時表示し、タブレット/モバイルでは Sheet コンポーネントで折りたたみ可能にする
  - ルートレイアウト（`__root.tsx`）に AppShell を組み込み、TanStack Router の `<Outlet />` でページコンテンツを表示する
  - ページ遷移時のフェードイントランジションを適用する
  - _Requirements: 11.1, 11.2, 11.3, 10.6_

- [x] 3. ビジネスユニット feature モジュール基盤
- [x] 3.1 型定義と Zod スキーマの定義
  - `features/business-units/types/` にビジネスユニットの型定義（API レスポンス型、作成/更新入力型、ページネーション型、ProblemDetails 型）を作成する
  - Zod スキーマ（`createBusinessUnitSchema`, `updateBusinessUnitSchema`）をバックエンドの定義と一致させて定義する
  - 一覧画面の search params 用 Zod スキーマ（ページ番号、ページサイズ、検索文字列、削除済み含むフラグ）を定義する
  - _Requirements: 12.3, 4.2, 5.3, 8.2, 8.3_

- [x] 3.2 API クライアントの実装
  - `features/business-units/api/api-client.ts` に薄い fetch ラッパーを実装する
  - 6 つの API 呼び出し関数を実装する: 一覧取得、単一取得、作成、更新、削除、復元
  - レスポンスの JSON パースと型アサーションを一箇所に集約する
  - エラーレスポンス（RFC 9457 ProblemDetails）のパースと型付きエラーの throw を実装する
  - API ベース URL を環境変数 `VITE_API_BASE_URL` から読み取る
  - _Requirements: 1.1, 3.1, 4.4, 5.4, 6.2, 7.3_

- [x] 3.3 (P) TanStack Query の queryOptions と mutation フックの定義
  - `features/business-units/api/queries.ts` に `businessUnitsQueryOptions`（一覧取得）と `businessUnitQueryOptions`（単一取得）を queryOptions パターンで定義する
  - `features/business-units/api/mutations.ts` に作成・更新・削除・復元の 4 つの useMutation フックを定義する
  - 各 mutation の `onSuccess` でビジネスユニット一覧のキャッシュを無効化する
  - エラーハンドリングは mutation の `onError` で ProblemDetails を解析し、HTTP ステータスコード別に処理する
  - _Requirements: 1.1, 3.1, 4.4, 4.5, 4.6, 4.7, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3, 6.4, 6.5, 7.3, 7.4, 7.5_

- [x] 3.4 (P) feature エクスポートインデックスの作成
  - `features/business-units/index.ts` で外部に公開する型、フック、コンポーネントをエクスポートする
  - _Requirements: 12.4_

- [x] 4. ビジネスユニット一覧画面
- [x] 4.1 カラム定義の実装
  - テーブルのカラム定義を作成する: ビジネスユニットコード、名称、表示順、作成日時、更新日時
  - 削除済みレコードにステータスバッジ（「アクティブ」/「削除済み」）を表示するセルレンダラーを実装する
  - 削除済み行に「復元」ボタンを条件付きで表示する
  - 行クリック時に詳細画面へ遷移するリンク動作を設定する
  - テーブルヘッダーにソートインジケーターを表示する
  - _Requirements: 1.2, 2.4, 7.1, 3.1, 1.3, 10.5_

- [x] 4.2 DataTable コンポーネントの構築
  - TanStack Table の `useReactTable` を使用した汎用 DataTable コンポーネントを構築する
  - クライアントサイドのソート機能（`SortingState`）を実装する
  - クライアントサイドのグローバルフィルタ（テキスト部分一致検索）を実装する
  - ページネーション状態を管理し、ページ移動・ページサイズ変更の UI を提供する
  - shadcn/ui の Table コンポーネントを使用してレンダリングする
  - テーブル行のホバー時にスムーズなハイライトトランジション（`transition-colors duration-150`）を適用する
  - データ取得中のローディング状態と、エラー発生時のエラーメッセージ表示を実装する
  - テーブルがビューポートに収まらない場合の水平スクロールを対応する
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.2, 9.6, 11.5_

- [x] 4.3 DataTableToolbar コンポーネントの構築
  - テーブル上部のツールバーを構築する
  - 検索入力欄（ビジネスユニットコードまたは名称でフィルタリング）を配置する
  - 「削除済みを含む」トグルスイッチを配置する
  - 「新規登録」ボタンを配置し、新規登録画面へのリンクを設定する
  - _Requirements: 2.1, 2.3, 4.1_

- [x] 4.4 一覧画面ルートの実装
  - `/master/business-units` のルートファイルを作成する
  - search params（ページ番号、ページサイズ、検索文字列、削除済み含むフラグ）を Zod でバリデーションする
  - `businessUnitsQueryOptions` を使用して API からデータを取得する
  - 「削除済みを含む」トグルの状態変更時に API を再取得する（`includeDisabled` パラメータ切り替え）
  - ページネーション操作時に URL search params を更新し、ブラウザの戻る/進むで復元可能にする
  - 削除済みレコードの行に透明度を下げた視覚的区別を適用する
  - DataTable、DataTableToolbar、カラム定義を組み合わせてページコンポーネントを構成する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 8.1, 8.2, 8.3_

- [x] 5. ビジネスユニット詳細画面
- [x] 5.1 詳細画面ルートの実装
  - `/master/business-units/$businessUnitCode` のルートファイルを作成する
  - `businessUnitQueryOptions` を使用して単一のビジネスユニットを取得・表示する
  - ビジネスユニットコード、名称、表示順、作成日時、更新日時をカード形式で表示する
  - 「編集」ボタン（編集画面へのリンク）と「削除」ボタン（確認ダイアログ起動）を配置する
  - パンくずリスト（「ビジネスユニット一覧 > [名称]」）で戻るナビゲーションを提供する
  - ビジネスユニットが存在しない場合の 404 エラー画面を設定する（`notFoundComponent`）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. ビジネスユニット新規登録・編集画面
- [x] 6.1 BusinessUnitForm 共通フォームコンポーネントの構築
  - TanStack Form を使用した新規登録・編集共通のフォームコンポーネントを構築する
  - `mode` プロパティ（`'create'` / `'edit'`）で表示を切り替える
  - ビジネスユニットコード（create モードのみ編集可能）、名称、表示順の入力フィールドを提供する
  - Zod スキーマによるフィールドレベルのリアルタイムバリデーションを実装する
  - バリデーションエラーを各入力フィールドの直下にインラインで表示する
  - 送信中はボタンを無効化し、スピナーアイコンを表示する
  - フォーム画面の入力フィールド幅を適切に制限する（`max-w-md` 程度）
  - _Requirements: 4.2, 4.3, 5.2, 5.3, 10.3, 10.4, 11.4_

- [x] 6.2 (P) 新規登録画面ルートの実装
  - `/master/business-units/new` のルートファイルを作成する
  - BusinessUnitForm を `mode: 'create'` で表示する
  - フォーム送信時に `useCreateBusinessUnit` mutation を呼び出す
  - 作成成功時に一覧画面へリダイレクトし、「保存しました」Toast を表示する
  - 409 Conflict 時に「同一コードのビジネスユニットが既に存在します」エラー Toast を表示する
  - 422 バリデーションエラー時にフォームにエラー内容を表示する
  - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7, 10.1, 10.2_

- [x] 6.3 (P) 編集画面ルートの実装
  - `/master/business-units/$businessUnitCode/edit` のルートファイルを作成する
  - `businessUnitQueryOptions` で既存データを取得し、フォームの初期値に設定する
  - BusinessUnitForm を `mode: 'edit'` で表示する
  - フォーム送信時に `useUpdateBusinessUnit` mutation を呼び出す
  - 更新成功時に詳細画面へリダイレクトし、「保存しました」Toast を表示する
  - 404 Not Found 時に「ビジネスユニットが見つかりません」エラー Toast を表示する
  - 422 バリデーションエラー時にフォームにエラー内容を表示する
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 10.1, 10.2_

- [x] 7. 削除・復元機能
- [x] 7.1 削除確認ダイアログと削除処理の実装
  - shadcn/ui AlertDialog を使用した削除確認ダイアログを構築する
  - 確認ダイアログで「削除」を選択した場合に `useDeleteBusinessUnit` mutation を呼び出す
  - 削除成功時に一覧画面へリダイレクトし、「削除しました」Toast を表示する
  - 409 Conflict 時に「このビジネスユニットは他のデータから参照されているため削除できません」エラー Toast を表示する
  - 404 Not Found 時に「ビジネスユニットが見つかりません」エラー Toast を表示する
  - 詳細画面の「削除」ボタンとダイアログを接続する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.1, 10.2_

- [x] 7.2 (P) 復元確認ダイアログと復元処理の実装
  - shadcn/ui AlertDialog を使用した復元確認ダイアログを構築する
  - 確認ダイアログで「復元」を選択した場合に `useRestoreBusinessUnit` mutation を呼び出す
  - 復元成功時にテーブルを再取得し、「復元しました」Toast を表示する
  - 409 Conflict 時にエラー Toast を表示する
  - 一覧画面の削除済み行の「復元」ボタンとダイアログを接続する
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 10.2_

- [x] 8. ビジュアル仕上げとマイクロインタラクション
- [x] 8.1 nani.now 風のトランジションとマイクロインタラクションの適用
  - ボタンのホバー時に微細なスケール変化（`hover:scale-[1.02]`）とカラートランジションを適用する
  - コンテンツ領域の最大幅制限（`max-w-4xl`）と十分な余白（セクション間 `gap-6` 以上、カード内 `p-6` 以上）を確認・調整する
  - Toast 通知の動作を確認する: 成功通知は数秒後に自動消去、エラー通知はユーザーが手動で閉じるまで保持
  - 全画面を通じてデザインの一貫性（角丸、シャドウ、色使い、スペーシング）を検証する
  - _Requirements: 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.7_

- [x]* 9. テスト
- [x]* 9.1 (P) 型定義・Zod スキーマのユニットテスト
  - 作成用スキーマの正常値・異常値のバリデーションをテストする
  - 更新用スキーマの正常値・異常値のバリデーションをテストする
  - search params スキーマのフォールバック値・デフォルト値をテストする
  - _Requirements: 4.2, 4.3, 5.3, 8.2, 8.3_

- [x]* 9.2 (P) API クライアントのユニットテスト
  - 各 API 関数の正常レスポンスのパースと型変換をテストする
  - エラーレスポンス（ProblemDetails）のパースと throw をテストする
  - fetch のモックを使用して各 HTTP メソッド・エンドポイントの呼び出しを検証する
  - _Requirements: 1.1, 3.1, 4.4, 5.4, 6.2, 7.3_
