# リサーチ & 設計判断ログ

---
**Purpose**: ディスカバリー結果と設計判断の根拠を記録する
---

## サマリ
- **Feature**: `improve-case-study-ui`
- **Discovery Scope**: Extension（既存システムの拡張）
- **主要な知見**:
  - CaseForm は既に `defaultValues` prop をサポートしており、初期値設定は呼び出し側の変更のみで実現可能
  - Sheet パターンがプロジェクト内で確立済み（`ProjectEditSheet`, `indirect-case-study/CaseFormSheet`）
  - case-study/index.tsx のロジック（約 120 行の状態管理 + クエリ）をそのまま CaseStudySection に移植可能

## リサーチログ

### Sheet パターンの既存実装

- **コンテキスト**: ケース作成・編集を Sheet で行うパターンが適切かの確認
- **調査元**: `features/workload/components/ProjectEditSheet.tsx`, `features/indirect-case-study/components/CaseFormSheet.tsx`
- **知見**:
  - `Sheet > SheetContent(side="right") > SheetHeader > フォーム` の定型パターンが確立
  - `open: boolean` + `onOpenChange: (open: boolean) => void` のインターフェースが標準
  - フォーム送信後に `onOpenChange(false)` で Sheet を閉じるパターン
  - 編集時はデータ取得ロジックを Sheet 内で実行（`useQuery` + `enabled: open`）
- **設計への影響**: CaseFormSheet は同じパターンを踏襲する。ただし case-study の CaseForm はフィールド数が多いため `sm:max-w-lg` で十分なスペースを確保

### CaseSidebar のコールバック設計

- **コンテキスト**: CaseSidebar の `onNewCase`, `onEditCase` コールバックの変更方法
- **調査元**: `features/case-study/components/CaseSidebar.tsx`
- **知見**:
  - `onNewCase: () => void` — 引数なし
  - `onEditCase: (caseId: number) => void` — ケースIDを引数に受け取る
  - `onDeleteCase: (projectCase: ProjectCase) => void` — ProjectCase オブジェクトを受け取る
  - これらのコールバックは呼び出し側で Sheet の open/close 状態管理に接続するだけで良い
- **設計への影響**: CaseSidebar のインターフェースは変更不要。CaseStudySection 内でコールバックを Sheet の状態管理に接続

### 案件詳細画面のレイアウト

- **コンテキスト**: 統合後のレイアウト設計
- **調査元**: `routes/master/projects/$projectId/index.tsx` (175行)
- **知見**:
  - 現在は `div.space-y-6` > パンくず > ヘッダー > 詳細カード > 削除ダイアログ の構成
  - 詳細カードの下に空きスペースがあり、ケーススタディセクションを追加可能
  - CLAUDE.md のルール: ルートコンポーネントは100行前後でレイアウトを記述
- **設計への影響**: ルートコンポーネントは CaseStudySection をインポートして配置するだけにし、ロジックは CaseStudySection 内に凝集

## アーキテクチャパターン評価

| Option | 説明 | 強み | リスク / 制限 | 備考 |
|--------|------|------|--------------|------|
| A: 直接拡張 | index.tsx にすべて追加 | ファイル数最小 | 300行超に肥大化、100行ルール違反 | 不採用 |
| B: コンポーネント分離 | CaseStudySection + CaseFormSheet を新規作成 | 責務分離、100行ルール遵守、既存パターンと一貫 | +2ファイル | **採用** |
| C: ハイブリッド | A→B の段階移行 | 初期実装が速い | 二段階作業、中間状態のリスク | この規模では不要 |

## 設計判断

### Decision: コンポーネント分離アプローチの採用

- **コンテキスト**: 案件詳細画面にケーススタディ機能を統合する際のコンポーネント設計
- **代替案**:
  1. Option A — 案件詳細画面を直接拡張
  2. Option B — CaseStudySection + CaseFormSheet に分離
- **選択**: Option B
- **理由**: CLAUDE.md のルートコンポーネント100行前後ルールの遵守、features 配下への責務凝集、indirect-case-study の Sheet パターンとの一貫性
- **トレードオフ**: +2ファイルの増加（許容範囲内）
- **フォローアップ**: なし

### Decision: CaseFormSheet における編集データの取得方式

- **コンテキスト**: 編集時にケースデータをどこで取得するか
- **代替案**:
  1. CaseFormSheet 内で useQuery を使ってデータを取得（ProjectEditSheet パターン）
  2. 親コンポーネント（CaseStudySection）から defaultValues として渡す
- **選択**: Option 1（Sheet 内で useQuery）
- **理由**: ProjectEditSheet の確立パターンに従う。Sheet の `open` state で `enabled` を制御でき、不要なクエリを防げる。親コンポーネントの責務を軽くできる
- **トレードオフ**: Sheet 内にデータ取得ロジックが含まれるが、既存パターンと一貫している

## リスク & 緩和策

- **リスク 1**: ルート削除後の routeTree.gen.ts 不整合 → 緩和: dev サーバー起動で自動再生成
- **リスク 2**: 案件詳細画面の行数増加 → 緩和: CaseStudySection へのロジック凝集で100行前後を維持

## 参考資料

- 既存実装: `features/workload/components/ProjectEditSheet.tsx` — Sheet + データ取得 + フォームパターン
- 既存実装: `features/indirect-case-study/components/CaseFormSheet.tsx` — Sheet + TanStack Form パターン
- shadcn/ui Sheet: `components/ui/sheet.tsx` — UI プリミティブ
