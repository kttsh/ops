# Implementation Plan

- [x] 1. (P) 案件ルートファイルの移動とパス更新
  - `routes/master/projects/` 配下の4ファイル（一覧・新規・詳細・編集）を `routes/projects/` に物理移動する
  - 各ファイル内の `createFileRoute` パス文字列を `/master/projects` から `/projects` に更新する
  - ファイル内のハードコードされたナビゲーションパス（`navigate({ to: ... })`、パンくず `href`、`Link to=` 等）をすべて新パスに更新する
  - `features/projects/` からのインポートパスは変更不要であることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. (P) 標準工数パターンルートファイルの移動とパス更新
  - `routes/master/standard-effort-masters/` 配下の3ファイル（一覧・新規・詳細）を `routes/projects/standard-efforts/` に物理移動する（ディレクトリ名を `standard-efforts` に短縮）
  - 各ファイル内の `createFileRoute` パス文字列を `/master/standard-effort-masters` から `/projects/standard-efforts` に更新する
  - ファイル内のハードコードされたナビゲーションパスをすべて新パスに更新する
  - `features/standard-effort-masters/` からのインポートパスは変更不要であることを確認する
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. (P) ナビゲーションと内部リンクの更新
  - SidebarNav の案件メニューリンク先を `/master/projects` から `/projects` に更新する
  - SidebarNav の標準工数パターンメニューリンク先を `/master/standard-effort-masters` から `/projects/standard-efforts` に更新する
  - 案件一覧テーブルの行リンク（columns.tsx）を `/master/projects/$projectId` から `/projects/$projectId` に更新する
  - 標準工数パターン一覧テーブルの行リンク（columns.tsx）を `/master/standard-effort-masters/$standardEffortId` から `/projects/standard-efforts/$standardEffortId` に更新する
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2_

- [x] 4. ビルド検証と整合性確認
  - `pnpm dev` を実行して `routeTree.gen.ts` が新ルート構成で自動再生成されることを確認する
  - ソースコード全体で旧パス文字列（`/master/projects`、`/master/standard-effort-masters`）が `routeTree.gen.ts` 以外に残存していないことを検証する
  - TypeScript コンパイルエラーが発生しないことを確認する
  - `pnpm --filter frontend test` で既存テストがすべてパスすることを確認する
  - _Requirements: 4.3, 5.1, 5.2, 5.3_
