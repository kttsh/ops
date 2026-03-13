# Research & Design Decisions: indirect-ux-consolidation

## Summary
- **Feature**: `indirect-ux-consolidation`
- **Discovery Scope**: Extension（既存システムの大幅改修）
- **Key Findings**:
  - API層・バックエンド変更は不要。既存クエリ・ミューテーション・計算ロジックをすべて再利用可能
  - `MonthlyIndirectWorkLoad.updatedAt` を最終計算日時として使用可能（source=calculatedのレコードの最大値）
  - shadcn/ui の `AlertDialog` が既に導入済みで確認ダイアログに使用可能

## Research Log

### 保存済みデータの初期表示方法
- **Context**: 現在のsimulation画面は計算実行前は空表示。新UIでは画面表示時にprimaryケースの保存済みデータを即表示する必要がある
- **Sources Consulted**: 既存API `GET /indirect-work-cases/{caseId}/monthly-indirect-work-loads`, `GET /capacity-scenarios/{scenarioId}/monthly-capacities`
- **Findings**:
  - `monthlyIndirectWorkLoadsQueryOptions(caseId, businessUnitCode)` で保存済みデータをフェッチ可能
  - `monthlyCapacitiesQueryOptions(scenarioId, businessUnitCode)` でキャパシティデータをフェッチ可能（capacity-scenario-client.ts内に存在確認必要）
  - `monthlyHeadcountPlansQueryOptions(caseId, businessUnitCode)` で人員データをフェッチ可能
  - primaryケースID取得後、3つのクエリを並列実行すれば初期データ表示が可能
- **Implications**: `useIndirectSimulation` のデータフローを「計算結果のローカルステート管理」から「保存済みデータのクエリ結果を直接表示」に変更

### 最終計算日時の取得方法
- **Context**: Req8 で最終計算日時の表示が必要
- **Sources Consulted**: `MonthlyIndirectWorkLoad` 型定義（`indirect-work.ts:27-36`）
- **Findings**:
  - `MonthlyIndirectWorkLoad` は `updatedAt: string` フィールドを持つ
  - `source: "calculated" | "manual"` フィールドで計算由来か手動編集かを区別可能
  - 保存済みデータの `updatedAt` の最大値を取れば最終計算日時として使用可能
  - バックエンドに専用エンドポイント追加は不要
- **Implications**: フロントエンドで `MonthlyIndirectWorkLoad[]` から `max(updatedAt)` を算出するユーティリティ関数のみで対応可能

### 年度チップのデータソース
- **Context**: Req4 で「データが存在する年度のみ」チップ表示が必要
- **Sources Consulted**: 既存の年度判定ロジック（`getFiscalYear` in `useIndirectWorkCalculation.ts`）
- **Findings**:
  - `MonthlyIndirectWorkLoad[]` の `yearMonth` フィールドから `getFiscalYear()` で年度を抽出し、`Set` でユニーク化すれば利用可能年度リストが得られる
  - `MonthlyCapacity[]` の `yearMonth` も同様に利用可能
  - 両方のデータソースから年度を合算すれば完全なリストが得られる
- **Implications**: 新規コンポーネントは不要。`CalculationResultTable` 内で年度リストを動的に生成し、横並びチップとして表示すれば良い

### 確認ダイアログ
- **Context**: Req5 で再計算前の確認ダイアログが必要
- **Sources Consulted**: `apps/frontend/src/components/ui/alert-dialog.tsx`
- **Findings**: shadcn/ui の `AlertDialog` コンポーネントが既に導入済み
- **Implications**: 新規UIライブラリの追加不要

### ルート変更の方針
- **Context**: Issue #70のサイドバー仕様では `/indirect` に統合
- **Sources Consulted**: TanStack Router のファイルベースルーティング
- **Findings**:
  - 現在のルート: `/indirect/simulation` → `routes/indirect/simulation/index.tsx`
  - 新ルート: `/indirect` → `routes/indirect/index.tsx` + `routes/indirect/index.lazy.tsx`
  - `/indirect/simulation` への既存リンクやブックマークへのリダイレクトは、`routes/indirect/simulation/` を残してリダイレクトするか、削除するか選択可能
- **Implications**: `routes/indirect/index.tsx` と `routes/indirect/index.lazy.tsx` を新規作成し、simulation配下は削除またはリダイレクト

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存改修 | useIndirectSimulation + ルートファイルを直接改修 | ファイル数最小、git diff追跡容易 | 350行フックの整合性維持が複雑 | — |
| B: 新規作成 | 新フック+新ルートで並行開発 | クリーン設計、旧コード非破壊 | ファイル増加、テスト書き直し | — |
| **C: ハイブリッド** | フック簡素化+ルート改修+年度チップのみインライン | 進化的改修、API層変更なし、150行程度に圧縮 | 一時的ビルド破損の可能性 | **採用** |

## Design Decisions

### Decision: ハイブリッドアプローチ（Option C）の採用
- **Context**: 既存350行のフック+2画面を1画面に統合する必要がある
- **Alternatives Considered**:
  1. Option A — 既存ファイルのみの段階的改修
  2. Option B — 新規フック+ルートの全面書き直し
  3. Option C — フック簡素化+ルート改修のハイブリッド
- **Selected Approach**: Option C。`useIndirectSimulation` を大幅簡素化（ケース選択ステート削除、保存済みデータ直接クエリ、1ボタン計算統合）し、ルートコンポーネントを改修。年度チップはテーブル内にインライン実装
- **Rationale**: API層は安定しておりそのまま再利用。UI層のみの改修でリスクを最小化しつつ、フック簡素化で保守性を大幅向上
- **Trade-offs**: 一時的にビルドが通らない可能性があるが、フック→ルートの順で実装すれば影響を局所化可能
- **Follow-up**: 既存テスト（`useIndirectSimulation.test.ts`）の更新が必要

### Decision: 保存済みデータの直接クエリ表示
- **Context**: 現在は計算実行→ローカルステート保持→保存ボタンの3ステップ。新UIは画面表示時に保存済みデータを即表示
- **Selected Approach**: primaryケースID確定後、TanStack Queryで `monthlyIndirectWorkLoads`、`monthlyCapacities`、`monthlyHeadcountPlans` を並列フェッチし、クエリ結果を直接テーブルに表示
- **Rationale**: ローカルステートでの中間管理が不要になり、再計算後はクエリ無効化→自動リフェッチでテーブル更新。コードが大幅に簡素化される
- **Trade-offs**: 再計算直後のテーブル更新がクエリリフェッチに依存するため、一瞬のラグが発生する可能性（ただし実用上問題なし）

### Decision: ルートパスの変更
- **Context**: Issue #70ではサイドバーを `/indirect` に統合する指定
- **Selected Approach**: `routes/indirect/index.tsx` + `index.lazy.tsx` を新規作成。`routes/indirect/simulation/` は削除
- **Rationale**: 旧URLへのブックマーク対応よりもコードベースの簡素化を優先。内部ツールのため旧URL互換性は不要

## Risks & Mitigations
- **useIndirectSimulation改修のregression** — 既存テストを先に確認し、フックのインターフェース変更を明確に定義してからリファクタリング
- **保存済みデータが存在しない初期状態** — primaryケース未設定やデータ未計算の場合の空状態表示を明確に設計
- **年度チップの空状態** — データが1件もない場合は現在の年度のみをデフォルト表示

## References
- GitHub Issue #70: 【UX】間接工数管理画面の統合・簡素化
- 既存コード: `apps/frontend/src/features/indirect-case-study/`
- shadcn/ui AlertDialog: `apps/frontend/src/components/ui/alert-dialog.tsx`
