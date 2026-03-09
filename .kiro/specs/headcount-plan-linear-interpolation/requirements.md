# Requirements Document

## Introduction
人員計画（`/master/headcount-plans`）の一括入力ダイアログに、按分入力（線形補間）モードを追加する。現在は年度と人員数を指定して全12ヶ月に同一値を設定する機能のみだが、開始月値（4月）と到達月値（3月）を指定して中間月を線形補間で自動算出する機能を追加する。

**対象コンポーネント**: `apps/frontend/src/features/indirect-case-study/components/BulkInputDialog.tsx`

**参照**: GitHub Issue #63, `docs/requirements/user-feedback-requirements.md` Issue #1

## Requirements

### Requirement 1: 入力モード切替
**Objective:** As a 事業部リーダー, I want 一括入力ダイアログで「全月同一値」と「按分入力」を切り替えたい, so that 用途に応じた入力方法を選択できる

#### Acceptance Criteria
1. The BulkInputDialog shall 「全月同一値」モードと「按分入力」モードの2つのモードをトグルで切替できること
2. When ダイアログが開かれた時, the BulkInputDialog shall 「全月同一値」モードをデフォルトで表示すること
3. When 「全月同一値」モードが選択されている時, the BulkInputDialog shall 現行と同じ入力フィールド（年度、人員数）を表示すること
4. When 「按分入力」モードが選択されている時, the BulkInputDialog shall 年度、開始値（4月）、到達値（3月）の入力フィールドを表示すること

### Requirement 2: 線形補間の計算ロジック
**Objective:** As a 事業部リーダー, I want 開始値と到達値を指定するだけで中間月の人員数が自動算出されたい, so that 段階的な人員増減を手作業なしで計画できる

#### Acceptance Criteria
1. When 按分入力モードで開始値と到達値が入力された時, the BulkInputDialog shall 4月（開始値）から3月（到達値）までの12ヶ月を線形補間で算出すること
2. The BulkInputDialog shall 補間で得られた中間月の値を四捨五入で整数化すること
3. The BulkInputDialog shall 対象期間を選択した年度の12ヶ月固定（4月〜翌3月）とすること
4. When 開始値=10、到達値=15 の場合, the BulkInputDialog shall 以下の値を算出すること: 4月:10, 5月:10, 6月:11, 7月:11, 8月:12, 9月:12, 10月:13, 11月:13, 12月:14, 1月:14, 2月:15, 3月:15
5. When 開始値と到達値が同じ場合, the BulkInputDialog shall 全月に同一値を設定すること
6. When 開始値が到達値より大きい場合（減員パターン）, the BulkInputDialog shall 正しく減少方向の線形補間を算出すること

### Requirement 3: 計算結果のプレビュー表示
**Objective:** As a 事業部リーダー, I want 設定前に各月の算出結果を確認したい, so that 意図通りの人員配置になっているか検証できる

#### Acceptance Criteria
1. While 按分入力モードで開始値と到達値が入力されている時, the BulkInputDialog shall 12ヶ月分の計算結果をプレビュー表示すること
2. When 開始値または到達値が変更された時, the BulkInputDialog shall プレビューをリアルタイムに更新すること
3. The BulkInputDialog shall プレビューに各月のラベル（4月〜3月）と算出された人員数を表示すること

### Requirement 4: 入力バリデーション
**Objective:** As a 事業部リーダー, I want 不正な値を入力した時にエラーが表示されたい, so that 正しいデータのみが設定される

#### Acceptance Criteria
1. The BulkInputDialog shall 開始値・到達値に0以上の整数のみ受け付けること
2. If 開始値または到達値が未入力の場合, the BulkInputDialog shall 「設定」ボタンを無効化すること
3. The BulkInputDialog shall 既存の全月同一値モードのバリデーションに影響を与えないこと

### Requirement 5: 既存機能との互換性
**Objective:** As a 事業部リーダー, I want 既存の全月同一値モードが変わらず使えること, so that 従来の入力ワークフローが破壊されない

#### Acceptance Criteria
1. The BulkInputDialog shall 既存の「全月同一値」モードの動作を変更しないこと
2. When 全月同一値モードで「設定」ボタンを押した時, the BulkInputDialog shall 現行と同じ `onApply(year, headcount)` コールバックを呼び出すこと
3. When 按分入力モードで「設定」ボタンを押した時, the BulkInputDialog shall 12ヶ月分の個別値を親コンポーネントに渡すこと

## Open Questions

| ID | 質問 | 影響範囲 |
|----|------|----------|
| Q1-2 | 既存の「全月同一値」モードと按分モードはどちらをデフォルトにすべきか？（現時点では「全月同一値」をデフォルトとしている） | Requirement 1 AC2 |
| Q1-3 | 年度をまたいだ按分（例: 2025年度4月→2026年度3月の24ヶ月）は必要か？（現時点ではスコープ外としている） | Requirement 2 AC3 |
