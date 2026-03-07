# Research & Design Decisions

## Summary
- **Feature**: `projects-route-restructure`
- **Discovery Scope**: Simple Addition（ルートファイルの物理移動 + パス文字列の一括更新）
- **Key Findings**:
  - `master` レイアウトルート（`master.tsx`）は存在せず、純粋なディレクトリベースルーティング。移動は単純なファイル操作で完結する
  - `routes/projects/` ディレクトリは未存在。新規作成が必要
  - `features/` ディレクトリ（API クライアント等）はバックエンドの API パスを参照しており、フロントエンドルートパスとは独立。変更不要

## Research Log

### TanStack Router ファイルベースルーティングにおけるディレクトリ移動
- **Context**: ルートファイルの物理的移動時に `routeTree.gen.ts` が正しく再生成されるか確認
- **Sources Consulted**: TanStack Router 公式ドキュメント、既存コードベースのパターン
- **Findings**:
  - `routeTree.gen.ts` は `pnpm dev` 起動時に TanStack Router Plugin が自動再生成する
  - 各ルートファイル内の `createFileRoute` のパス文字列はファイルの物理パスと一致する必要がある
  - ルート間の親子関係はディレクトリ構造で暗黙的に決定される
- **Implications**: ファイル移動後に `pnpm dev` を一度実行すれば `routeTree.gen.ts` が自動更新される

### パス参照の影響範囲
- **Context**: 旧パスへのハードコード参照を漏れなく更新するため全量を調査
- **Findings**:
  - ルートファイル内のハードコードパス: 25箇所（7ファイル）
  - `SidebarNav.tsx`: 2箇所（L37, L42）
  - `features/projects/components/columns.tsx`: 1箇所（L33）
  - `features/standard-effort-masters/components/columns.tsx`: 1箇所（L25）
  - `routeTree.gen.ts`: 自動再生成のため手動更新不要
  - `features/` 内の API クライアント: バックエンド API パス（`/standard-effort-masters` 等）であり、フロントエンドルートパスではない。変更不要
- **Implications**: 手動更新対象は9ファイル・29箇所。すべて文字列置換で対応可能

### `standard-effort-masters` → `standard-efforts` のパス短縮
- **Context**: URL パスのセグメント名がディレクトリ名から `standard-efforts` に短縮される
- **Findings**:
  - ルートのディレクトリ名を `standard-efforts` に変更する必要がある
  - `features/standard-effort-masters/` はそのまま維持（API リソース名と対応しているため）
  - パラメータ名 `$standardEffortId` はそのまま維持可能
- **Implications**: ディレクトリ名変更は URL セグメントのみに影響し、TypeScript 型やドメインモデルには波及しない

## Design Decisions

### Decision: ファイル物理移動 + パス一括置換アプローチ
- **Context**: ルート構成の変更方法として、ファイル移動 vs リダイレクト併用 vs エイリアス設定
- **Alternatives Considered**:
  1. ファイル物理移動 + パス一括置換（選択）
  2. リダイレクトルート追加（旧パスから新パスへ転送）
  3. TanStack Router のルートエイリアス設定
- **Selected Approach**: ファイル物理移動 + パス一括置換
- **Rationale**: Issue の方針でリダイレクト不要と明示されている。ファイルベースルーティングの原則に従い、物理パスとルートパスを一致させるのが最もシンプル
- **Trade-offs**: 旧パスのブックマーク等は無効になるが、Issue で許容済み

## Risks & Mitigations
- **パス参照の更新漏れ** → `grep` で旧パス文字列の残存を検証するステップを実装タスクに含める
- **`routeTree.gen.ts` の再生成失敗** → `pnpm dev` 実行後にルート定義の型エラーがないことを確認
