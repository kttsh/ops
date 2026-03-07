# Requirements Document

## Introduction
案件管理（projects）および標準工数パターン（standard-effort-masters）のルーティングを `/master/` 配下から `/projects/` 配下へ移動するリファクタリング。TanStack Router のファイルベースルーティングに従い、ルートファイルの物理的移動とパス参照の更新を行う。旧パスへのリダイレクトは不要。

## Requirements

### Requirement 1: 案件ルートの移動
**Objective:** As a 開発者, I want 案件関連のルートを `/master/projects` から `/projects` に移動したい, so that ナビゲーション構成で「案件管理」が独立カテゴリとして整理される

#### Acceptance Criteria
1. When ユーザーが `/projects` にアクセスした場合, the フロントエンドアプリ shall 案件一覧画面を表示する
2. When ユーザーが `/projects/new` にアクセスした場合, the フロントエンドアプリ shall 案件新規作成画面を表示する
3. When ユーザーが `/projects/$projectId` にアクセスした場合, the フロントエンドアプリ shall 該当案件の詳細画面を表示する
4. When ユーザーが `/projects/$projectId/edit` にアクセスした場合, the フロントエンドアプリ shall 該当案件の編集画面を表示する
5. The フロントエンドアプリ shall 各ルートファイル内の `createFileRoute` / `createLazyFileRoute` のパス文字列を新しいパスに一致させる

### Requirement 2: 標準工数パターンルートの移動
**Objective:** As a 開発者, I want 標準工数パターン関連のルートを `/master/standard-effort-masters` から `/projects/standard-efforts` に移動したい, so that 標準工数パターンが案件管理の配下として論理的に整理される

#### Acceptance Criteria
1. When ユーザーが `/projects/standard-efforts` にアクセスした場合, the フロントエンドアプリ shall 標準工数パターン一覧画面を表示する
2. When ユーザーが `/projects/standard-efforts/new` にアクセスした場合, the フロントエンドアプリ shall 標準工数パターン新規作成画面を表示する
3. When ユーザーが `/projects/standard-efforts/$standardEffortId` にアクセスした場合, the フロントエンドアプリ shall 該当標準工数パターンの詳細画面を表示する

### Requirement 3: ナビゲーション更新
**Objective:** As a ユーザー, I want サイドバーのリンクが新しいパス構成に従って動作してほしい, so that 画面遷移が正しく機能する

#### Acceptance Criteria
1. The SidebarNav shall 案件管理セクションのリンク先を `/projects` 配下の新しいパスに更新する
2. When ユーザーがサイドバーの案件管理メニューをクリックした場合, the SidebarNav shall `/projects` に遷移する
3. When ユーザーがサイドバーの標準工数パターンメニューをクリックした場合, the SidebarNav shall `/projects/standard-efforts` に遷移する

### Requirement 4: 内部リンク・パス参照の整合性
**Objective:** As a 開発者, I want アプリケーション内のハードコードされたパス参照がすべて更新されてほしい, so that 画面間の遷移が正しく動作する

#### Acceptance Criteria
1. The フロントエンドアプリ shall 案件一覧の各行リンク（`columns.tsx` 等）を `/projects/$projectId` に更新する
2. The フロントエンドアプリ shall 標準工数パターン関連のハードコードされたパスを `/projects/standard-efforts` 配下に更新する
3. The フロントエンドアプリ shall アプリケーション全体で旧パス `/master/projects` および `/master/standard-effort-masters` への参照を残さない

### Requirement 5: ビルド・型安全性の維持
**Objective:** As a 開発者, I want ルート移動後もビルドとテストが正常に通ってほしい, so that リファクタリングによるリグレッションが発生しない

#### Acceptance Criteria
1. The フロントエンドアプリ shall `pnpm dev` 実行時に `routeTree.gen.ts` を新しいルート構成で自動再生成する
2. The フロントエンドアプリ shall TypeScript コンパイルエラーを発生させない
3. The フロントエンドアプリ shall 既存のテストをすべてパスする
