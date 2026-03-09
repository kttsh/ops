# Implementation Plan

- [x] 1. 線形補間の計算ロジックを実装する
- [x] 1.1 線形補間関数を作成する
  - 開始値と到達値を受け取り、12ヶ月分の補間値を配列で返す純粋関数を実装する
  - 各月の値は `Math.round(startValue + (endValue - startValue) * i / 11)` で算出（i=0..11）
  - 開始値と到達値が同じ場合は全月同一値を返す
  - 開始値が到達値より大きい場合（減員パターン）も正しく動作すること
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [x] 1.2 (P) 線形補間関数のユニットテストを作成する
  - 増員パターン: `linearInterpolate(10, 15)` が Issue #63 の計算例と一致すること
  - 減員パターン: `linearInterpolate(15, 10)` が正しい減少値を返すこと
  - 同値パターン: `linearInterpolate(10, 10)` が全月10を返すこと
  - ゼロパターン: `linearInterpolate(0, 0)` が全月0を返すこと
  - 連番パターン: `linearInterpolate(0, 11)` が各月 0, 1, 2, ..., 11 を返すこと
  - 配列長が常に12であること、result[0] === startValue、result[11] === endValue であること
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 2. BulkInputDialog に按分入力モードを追加する
- [x] 2.1 モード切替 UI を追加する
  - Switch コンポーネントで「全月同一値」と「按分入力」の2モードを切替できるようにする
  - デフォルトは「全月同一値」モード
  - モードに応じてダイアログの説明文を切り替える（全月同一値: 現行の説明、按分: 開始値と到達値の説明）
  - モード切替時に入力値をリセットしない（ユーザーの入力を保持する）
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 按分入力モードの入力フィールドを追加する
  - 按分モード時に開始値（4月）と到達値（3月）の2つの数値入力フィールドを表示する
  - 全月同一値モード時は既存の人員数フィールドを表示する（現行動作を維持）
  - 入力値は0以上の整数のみ受け付ける（`normalizeNumericInput` を使用）
  - _Requirements: 1.3, 1.4, 4.1, 4.3_

- [x] 2.3 計算結果のプレビュー表示を追加する
  - 按分モードで開始値と到達値が入力されている時、12ヶ月分の計算結果をプレビュー表示する
  - プレビューは6列×2行のグリッドで各月のラベル（4月〜3月）と人員数を表示する
  - 開始値または到達値が変更された時にリアルタイムで更新する（`useMemo` で派生算出）
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2.4 バリデーションとボタン制御を実装する
  - 按分モード時、開始値または到達値が未入力（初期状態）の場合は「設定」ボタンを無効化する
  - 全月同一値モード時のバリデーション・ボタン制御は現行のまま維持する
  - Props に `onApplyInterpolation` コールバックを追加する
  - 按分モードで「設定」ボタン押下時は `onApplyInterpolation(year, monthlyValues)` を呼び出す
  - 全月同一値モードで「設定」ボタン押下時は既存の `onApply(year, headcount)` を呼び出す
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 3. MonthlyHeadcountGrid と BulkInputDialog を統合する
  - MonthlyHeadcountGrid に `handleBulkInterpolation` ハンドラを追加する
  - 按分結果（12要素の配列）を受け取り、MONTHS 配列のインデックスと対応させて `localData` を更新する
  - BulkInputDialog に `onApplyInterpolation={handleBulkInterpolation}` を渡す
  - 既存の `handleBulkSet` と `onApply` はそのまま維持する
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Storybook のストーリーを更新する
- [x] 4.1 (P) BulkInputDialog のストーリーを追加する
  - Default ストーリー: 全月同一値モードが表示されること（既存動作の確認）
  - InterpolationMode ストーリー: 按分モードに切替後、開始値・到達値フィールドが表示されること
  - WithPreview ストーリー: 開始値・到達値を指定した際にプレビューが表示されること
  - `onApplyInterpolation` のコールバック引数を追加する
  - _Requirements: 1.1, 1.4, 3.1_
