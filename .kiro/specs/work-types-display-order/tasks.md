# Implementation Plan

- [x] 1. 保存済み積み上げ順のページ初期化時ロード
- [x] 1.1 (P) ワークロード画面で保存済みの間接作業積み上げ順を取得し、初期表示に反映する
  - ページ初期化時に `chart_stack_order_settings` から `targetType: "indirect_work_type"` の設定をクエリで取得する
  - 取得した設定を `stackOrder` 昇順でソートし、`targetCode`（workTypeCode）の配列として `indirectOrder` state を初期化する
  - データ取得完了前は空配列（デフォルト順）で表示し、取得完了後に保存済み順序を反映する
  - ページリロード後も保存済みの順序が維持されることを確認する
  - _Requirements: 2.1_

- [x] 2. エラー時ロールバックの実装
- [x] 2.1 (P) 積み上げ順保存失敗時に UI を操作前の状態に戻し、エラー通知を表示する
  - `moveUp` / `moveDown` 実行前に現在の items state のスナップショットを保持する
  - mutation の `onError` コールバックでスナップショットから state を復元する
  - エラー発生時にトースト通知で「表示順の保存に失敗しました」と表示する
  - `onOrderChange` コールバックもロールバック時に前回の順序で再呼び出しし、チャートの表示順も戻す
  - _Requirements: 2.2_

- [x] 3. 既存実装の検証と動作確認
- [x] 3.1 間接作業 Area が常に案件 Area の下部に固定されていることを検証する
  - `sortAreasByIndirectOrder()` が `[...indirect, ...projects]` の順序を返すことを確認する
  - ↑↓ボタンで順序を入れ替えた際に、間接作業が案件の上に表示されないことを確認する
  - チャートに順序変更が即座に反映されることを確認する
  - TypeScript strict mode でコンパイルエラーがないことを確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_
