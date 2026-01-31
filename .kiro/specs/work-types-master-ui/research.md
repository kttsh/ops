# Research & Design Decisions

## Summary
- **Feature**: `work-types-master-ui`
- **Discovery Scope**: Simple Addition（既存 business-units-master-ui のパターン踏襲 + color フィールド拡張）
- **Key Findings**:
  - バックエンド API は完全実装済み。全 6 エンドポイントが稼働中
  - business-units-master-ui の実装パターンをそのまま踏襲可能。feature 間依存禁止のためコンポーネントは複製
  - 唯一の差分は `color` フィールド（#RRGGBB, null 許容）。カラーピッカー UI が新規必要

## Research Log

### カラーピッカー UI の実装方針
- **Context**: work-types エンティティには business-units にない `color` フィールドがあり、フォームでのカラー選択 UI が必要
- **Sources Consulted**: コードベース内の既存コンポーネント調査
- **Findings**:
  - コードベースにカラーピッカーコンポーネントは存在しない
  - ネイティブ `<input type="color">` は全モダンブラウザ対応。十分な UX を提供
  - shadcn/ui にはカラーピッカーのプリミティブが存在しないため、ネイティブ + Input のハイブリッドが最も軽量
- **Implications**: 外部ライブラリ追加不要。`<input type="color">` + テキスト入力（#RRGGBB）の組み合わせで実装

### 既存 business-units パターンの再利用範囲
- **Context**: feature 間依存禁止のルールがあるため、business-units のコンポーネントを直接 import できない
- **Findings**:
  - DataTable, DataTableToolbar, DebouncedSearchInput, DeleteConfirmDialog, RestoreConfirmDialog は同一パターンで feature 内に複製
  - columns.tsx は color カラム（カラースウォッチ）を追加
  - WorkTypeForm は BusinessUnitForm に color フィールドを追加
  - API クライアント・queries・mutations は同一パターンでエンティティ名のみ変更
- **Implications**: ほぼすべてのファイルが business-units の構造を踏襲。color 関連の差分のみ設計で明記

### サイドバーメニューの更新
- **Context**: AppShell の menuItems に「作業種類」を追加する必要がある
- **Findings**: `components/layout/AppShell.tsx` の menuItems 配列に項目追加するだけで完了
- **Implications**: 既存コードへの最小限の変更（1 ファイル、数行の追加）

## Design Decisions

### Decision: カラーピッカーの実装方式
- **Context**: color フィールドの編集 UI が必要
- **Alternatives Considered**:
  1. 外部ライブラリ（react-colorful 等）— 豊富な UI だが依存追加
  2. ネイティブ `<input type="color">` + テキスト入力 — 依存なし、軽量
  3. テキスト入力のみ — シンプルだが UX が劣る
- **Selected Approach**: ネイティブ `<input type="color">` + テキスト入力のハイブリッド
- **Rationale**: 依存追加なしで十分な UX。テキスト入力で #RRGGBB の直接入力も可能。null 許容のためクリアボタンも配置
- **Trade-offs**: ネイティブカラーピッカーの見た目は OS 依存だが、業務管理画面では許容範囲
- **Follow-up**: 将来的に統一カラーピッカーが必要になれば共有コンポーネントに抽出

### Decision: テーブルのカラースウォッチ表示
- **Context**: 一覧テーブルと詳細画面で color 値を視覚的に表示する必要がある
- **Selected Approach**: 小さな丸い div（`w-6 h-6 rounded-full`）に background-color を設定。null の場合は「-」表示
- **Rationale**: シンプルで直感的。追加コンポーネント不要

## Risks & Mitigations
- **リスク**: カラーピッカーのネイティブ UI が OS 間で異なる見た目になる → 許容範囲。テキスト入力で直接指定も可能
- **リスク**: feature 間のコード重複が増える → 将来的に共通化が必要になれば `packages/` に抽出する方針で整理済み

## References
- [MDN: input type="color"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color) — ブラウザサポート・動作仕様
- business-units-master-ui 設計書・実装 — 基本パターンの参照元
