# Requirements Document

## Introduction

GitHub Issue #50 に基づくリファクタリング仕様。旧 `/master/indirect-capacity-settings` ルートを完全に廃止し、`SidebarNav` を最終的な4カテゴリ構成に更新する。また、`indirect-case-study` feature 内の未参照コード（SettingsPanel, ResultPanel, useIndirectCaseStudyPage 等）を特定・削除し、コードベースをクリーンな状態にする。

対象システム: フロントエンドアプリケーション（`apps/frontend`）

## Requirements

### Requirement 1: 旧ルートの完全削除

**Objective:** As a 開発者, I want 旧 `/master/indirect-capacity-settings` ルートを完全に削除したい, so that 廃止された画面への意図しないアクセスを防ぎ、ルーティング構成を簡潔に保てる

#### Acceptance Criteria

1. The フロントエンドアプリケーション shall `src/routes/master/indirect-capacity-settings/` ディレクトリ（`index.tsx`, `index.lazy.tsx` を含む）を持たないこと
2. When ユーザーが `/master/indirect-capacity-settings` にアクセスした場合, the フロントエンドアプリケーション shall 404 ページまたは適切なフォールバックを表示すること
3. The フロントエンドアプリケーション shall TanStack Router のルートツリー（`routeTree.gen.ts`）に `indirect-capacity-settings` 関連のルートが含まれないこと

### Requirement 2: SidebarNav の最終構成

**Objective:** As a ユーザー, I want サイドバーナビゲーションが最終的な4カテゴリ構成で表示されるようにしたい, so that すべての画面に一貫した構造で素早くアクセスできる

#### Acceptance Criteria

1. The SidebarNav shall 以下の4カテゴリを表示すること: 「ダッシュボード」「案件管理」「間接作業管理」「マスタ管理」
2. The SidebarNav shall 「ダッシュボード」カテゴリ配下に「山積ダッシュボード」（`/workload`）を表示すること
3. The SidebarNav shall 「案件管理」カテゴリ配下に「案件一覧」（`/projects`）と「標準工数パターン」（`/projects/standard-efforts`）を表示すること
4. The SidebarNav shall 「間接作業管理」カテゴリ配下に「シミュレーション」（`/indirect/simulation`）を表示すること
5. The SidebarNav shall 「マスタ管理」カテゴリ配下に以下の項目を表示すること: 「人員計画ケース」（`/master/headcount-plans`）、「キャパシティシナリオ」（`/master/capacity-scenarios`）、「間接作業ケース」（`/master/indirect-work-cases`）、「案件タイプ」（`/master/project-types`）、「作業種類」（`/master/work-types`）、「ビジネスユニット」（`/master/business-units`）
6. When ユーザーが各メニュー項目をクリックした場合, the SidebarNav shall 対応するパスに正しく遷移すること
7. The SidebarNav shall 旧「間接作業・キャパシティ」メニュー項目を含まないこと

### Requirement 3: 未参照コードの整理

**Objective:** As a 開発者, I want `indirect-case-study` feature 内の未参照コードを削除したい, so that コードベースの保守性を向上させ、不要な依存関係を排除できる

#### Acceptance Criteria

1. If `useIndirectCaseStudyPage` フックが他のコンポーネントやルートから参照されていない場合, the フロントエンドアプリケーション shall 当該フックファイルを含まないこと
2. If `SettingsPanel` コンポーネントが他のコンポーネントやルートから参照されていない場合, the フロントエンドアプリケーション shall 当該コンポーネントファイルを含まないこと
3. If `ResultPanel` コンポーネントが他のコンポーネントやルートから参照されていない場合, the フロントエンドアプリケーション shall 当該コンポーネントファイルを含まないこと
4. The フロントエンドアプリケーション shall `indirect-case-study` feature の `index.ts` パブリック API から、削除されたシンボルのエクスポートを含まないこと

### Requirement 4: ビルド・型安全性の維持

**Objective:** As a 開発者, I want リファクタリング後もビルドとテストが正常に通ることを保証したい, so that 既存機能にデグレーションが発生しないことを確認できる

#### Acceptance Criteria

1. The フロントエンドアプリケーション shall TypeScript コンパイルエラーが0件であること
2. The フロントエンドアプリケーション shall 既存のテストスイートがすべてパスすること
3. The フロントエンドアプリケーション shall `pnpm dev` 実行時にルートツリーが正常に再生成され、エラーなく起動すること
