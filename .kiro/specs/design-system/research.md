# Research & Design Decisions

## Summary
- **Feature**: `design-system`
- **Discovery Scope**: Extension（既存 Storybook セットアップの拡張）
- **Key Findings**:
  - Storybook v10.2.7 は CSF3 + Vite ベースで動作確認済み。Tailwind CSS v4 は `@storybook/react-vite` 経由で自動的に処理される
  - TanStack Query のモックには MSW（Mock Service Worker）+ `msw-storybook-addon` が公式推奨パターン。代替として Storybook 10 の automocking（`sb.mock()`）も利用可能
  - TanStack Router の `Link`/`useRouterState` を使用するコンポーネント（AppShell, DataTableToolbar）には `RouterProvider` モックが必要

## Research Log

### Storybook 10 + Tailwind CSS v4 の統合
- **Context**: Storybook 上でプロダクションと同一のスタイルを再現する必要がある
- **Sources Consulted**: [Storybook Tailwind Recipe](https://storybook.js.org/recipes/tailwindcss), [Medium - Storybook + Tailwind v4](https://medium.com/@ayomitunde.isijola/integrating-storybook-with-tailwind-css-v4-1-f520ae018c10)
- **Findings**:
  - Tailwind CSS v4 は Vite プラグインとして動作し、`tailwind.config` ファイル不要
  - `.storybook/preview.ts` で CSS ファイルをインポートするだけで全ストーリーにスタイルが適用される
  - `@storybook/react-vite` が Vite 設定を自動継承するため、追加の Tailwind プラグイン設定は不要
- **Implications**: `preview.ts` に `import '@/styles/globals.css'`（または該当する CSS エントリポイント）を追加するだけでよい

### TanStack Query のモック戦略
- **Context**: feature コンポーネントの約55%が TanStack Query に依存している
- **Sources Consulted**: [Storybook Mocking Network Requests](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-network-requests), [TanStack Query Discussion #1352](https://github.com/TanStack/query/discussions/1352)
- **Findings**:
  - **MSW アプローチ**: `msw-storybook-addon` の `mswLoader` を preview に登録し、各ストーリーの `parameters.msw.handlers` でレスポンスを定義。最も柔軟で公式推奨
  - **QueryClient キャッシュプリセット**: `QueryClient` のキャッシュに直接データをセットし、ネットワークリクエストをスキップ。シンプルだがキャッシュ管理が煩雑
  - **Automocking（sb.mock）**: Storybook 10 の新機能。モジュールレベルでモック関数を登録。TanStack Query のカスタムフック（`useQuery` ラッパー）のモックに有効
- **Implications**: MSW を主軸とし、グローバルデコレータで `QueryClientProvider` を提供する二層構成を採用

### TanStack Router のモック
- **Context**: `AppShell` と `DataTableToolbar` が `Link`、`useRouterState` に依存
- **Sources Consulted**: [Storybook Issue #32370](https://github.com/storybookjs/storybook/issues/32370)
- **Findings**:
  - `@tanstack/react-router` の `createMemoryHistory` + `createRouter` でテスト用ルーターを生成可能
  - Storybook デコレータで `RouterProvider` をラップすることで Link コンポーネントが動作する
  - より軽量なアプローチとして `sb.mock()` で `useRouterState` をモックする方法もある
- **Implications**: AppShell 等のルーター依存コンポーネントには専用デコレータを用意する

### 既存コンポーネントの依存パターン分析
- **Context**: 約70以上のコンポーネントのストーリー作成戦略を決定するため
- **Findings**:
  - **依存なし（ストーリー作成容易）**: コアUIコンポーネント全10個、SidePanel、BulkInputDialog、FeedbackStates 等
  - **TanStack Query 依存（MSW モック必要）**: BusinessUnitSelector、CaseForm、ProjectForm 等（約30%）
  - **TanStack Form 依存（フォーム操作対応必要）**: BusinessUnitForm、ProjectForm、CaseForm 等（約20%）
  - **TanStack Router 依存（Router デコレータ必要）**: AppShell、DataTableToolbar（共有）（約5%）
  - **TanStack Table 依存（データ・カラム定義必要）**: DataTable x3、WorkloadDataTable（約10%）
  - **Recharts 依存（モックデータ必要）**: WorkloadChart x2、StandardEffortPreview（約5%）
- **Implications**: デコレータを3層で構成する（1. QueryClient、2. Router、3. CSS/テーマ）

### Badge コンポーネントのバリアント差異
- **Context**: 要件書では badge のバリアントを default/secondary/destructive/outline としているが、実装では `success` バリアントも存在する
- **Findings**: `badge.tsx` は `success: "border-transparent bg-emerald-100 text-emerald-700"` バリアントを持つ
- **Implications**: ストーリーでは実装に合わせて全5バリアント（default, secondary, destructive, outline, success）をカバーする

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| MSW + グローバルデコレータ | MSW でネットワークモック、preview.ts でグローバルプロバイダ | 公式推奨、実際のAPIフローを模倣 | MSW 追加依存、ServiceWorker セットアップ必要 | 採用 |
| Automocking のみ | sb.mock() でモジュール単位モック | セットアップ軽量、Storybook 10 ネイティブ | クエリキャッシュの振る舞いを模倣できない | 補助的に使用 |
| Storybook Args のみ | すべてを props で注入 | 最もシンプル | コンポーネントのリファクタリングが必要 | 不採用 |

## Design Decisions

### Decision: MSW + QueryClientProvider デコレータの二層構成
- **Context**: feature コンポーネントの多くが TanStack Query を使用し、ネットワークリクエストを発行する
- **Alternatives Considered**:
  1. MSW のみ — ネットワーク層でモック
  2. QueryClient キャッシュプリセットのみ — クエリキャッシュにデータ注入
  3. sb.mock() でフックをモック — モジュール単位でモック
- **Selected Approach**: MSW でネットワークモック + グローバルデコレータで QueryClientProvider を提供
- **Rationale**: MSW は公式推奨で、実際のデータフローに近い形でモック可能。QueryClientProvider はグローバルデコレータで一度定義すれば全ストーリーで利用可能
- **Trade-offs**: MSW のセットアップコストが発生するが、長期的にはメンテナンスが容易
- **Follow-up**: `public/mockServiceWorker.js` の生成、MSW ハンドラの体系的な管理

### Decision: ストーリーファイルのコロケーション配置
- **Context**: ストーリーファイルの配置方針
- **Alternatives Considered**:
  1. コロケーション — コンポーネントと同ディレクトリに配置
  2. 集約 — `src/stories/` に一括配置
- **Selected Approach**: コンポーネントと同ディレクトリに `[Component].stories.tsx` として配置
- **Rationale**: Storybook の既存設定（`../src/**/*.stories.@(js|jsx|mjs|ts|tsx)`）がこのパターンを前提としている。コンポーネントの変更時にストーリーの更新漏れを防ぐ
- **Trade-offs**: ディレクトリ内のファイル数が増える
- **Follow-up**: `.gitignore` や IDE の設定で必要に応じてフィルタリング

## Risks & Mitigations
- MSW ServiceWorker のセットアップ漏れ — `npx msw init public/` をセットアップスクリプトに含める
- Tailwind CSS v4 のスタイルが Storybook で反映されない — preview.ts での CSS インポートを早期に検証
- TanStack Router モックの不完全性 — AppShell のストーリーでは簡略化したメモリルーターを使用し、ナビゲーション動作は検証対象外とする
- モックデータの型安全性不足 — 実際の Zod スキーマから型を導出し、satisfies 演算子で検証

## References
- [Storybook - Mocking Network Requests](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-network-requests)
- [Storybook - Mocking Modules](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules)
- [Storybook - Tailwind CSS Recipe](https://storybook.js.org/recipes/tailwindcss)
- [TanStack Query - Testing Guide](https://tanstack.com/query/v4/docs/react/guides/testing)
- [MSW Storybook Addon](https://github.com/mswjs/msw-storybook-addon)
- [Storybook Issue #32370 - TanStack Router Link Mocking](https://github.com/storybookjs/storybook/issues/32370)
