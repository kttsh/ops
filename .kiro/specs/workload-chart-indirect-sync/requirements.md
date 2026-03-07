# Requirements Document

## Introduction
GitHub Issue #44 対応。`/workload` 画面の「間接作業種類設定」パネル（`SidePanelIndirect`）で間接作業の色変更・順番変更を行った際、積み上げチャート（`WorkloadChart`）および凡例パネル（`LegendPanel`）に即座に反映されない問題を修正する。案件（project）の色・順序反映と同じ State Lifting パターンを間接作業にも適用し、リアクティブな UI 同期を実現する。

## Requirements

### Requirement 1: 間接作業の色変更のチャート即時反映
**Objective:** ユーザーとして、間接作業種類の色を変更した際にチャートに即座に反映されることで、視覚的な確認をリロードなしで行いたい

#### Acceptance Criteria
1. When ユーザーが SidePanelIndirect で間接作業種類の色を変更する, the WorkloadChart shall 該当する間接作業エリアの塗りつぶし色・線色を即座に更新して描画する
2. When ユーザーが SidePanelIndirect で間接作業種類の色を変更する, the LegendPanel shall 該当する間接作業の凡例色をチャートと一致する色で表示する
3. When ユーザーが間接作業の色を変更していない場合, the WorkloadChart shall 既定のカラーパレット（INDIRECT_COLORS）をフォールバックとして使用する

### Requirement 2: 間接作業の順序変更のチャート即時反映
**Objective:** ユーザーとして、間接作業種類の積み上げ順を変更した際にチャートに即座に反映されることで、優先度に応じた視覚的な並びを確認したい

#### Acceptance Criteria
1. When ユーザーが SidePanelIndirect で間接作業種類の順番を変更する, the WorkloadChart shall 間接作業エリアの積み上げ順を変更後の順序で即座に再描画する
2. When ユーザーが SidePanelIndirect で間接作業種類の順番を変更する, the LegendPanel shall 凡例の表示順をチャートの積み上げ順と一致させる

### Requirement 3: 案件の色・順序機能との共存
**Objective:** ユーザーとして、間接作業の色・順序変更が案件（project）の既存の色・順序変更機能に影響を与えないことで、安心して両方の設定を利用したい

#### Acceptance Criteria
1. While 間接作業の色・順序が変更されている状態で, the WorkloadChart shall 案件（project）の色・順序設定を従来通り正しく反映し続ける
2. While 案件の色・順序が変更されている状態で, the WorkloadChart shall 間接作業の色・順序設定を正しく反映する
3. The WorkloadChart shall 案件エリアと間接作業エリアの積み上げ順を、それぞれ独立して制御する

### Requirement 4: バックエンド保存との整合性
**Objective:** ユーザーとして、色・順序の変更がバックエンドに保存された上でチャートにも反映されることで、ページリロード後も設定が維持されることを期待したい

#### Acceptance Criteria
1. When ユーザーが間接作業の色を変更する, the システム shall バックエンドへの保存とチャートへの即時反映の両方を実行する
2. When ユーザーが間接作業の順序を変更する, the システム shall バックエンドへの保存とチャートへの即時反映の両方を実行する
3. When ページをリロードする, the WorkloadChart shall バックエンドに保存済みの間接作業の色・順序設定を読み込み、チャートに反映する

### Requirement 5: 型安全性の維持
**Objective:** 開発者として、間接作業の色・順序のデータフローが型安全であることで、実行時エラーを防止したい

#### Acceptance Criteria
1. The システム shall 間接作業の色・順序に関するすべてのプロパティ・引数に TypeScript 型定義を持つ
2. The システム shall TypeScript のビルド（tsc -b）をエラーなしで通過する
