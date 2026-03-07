# Implementation Plan

- [x] 1. useChartData に間接作業の色・順序オプションを追加する
- [x] 1.1 間接作業シリーズのソート関数を実装する
  - 間接作業シリーズを指定順序で並べ替える関数を追加する
  - 案件シリーズの位置は変更せず、間接作業シリーズのみを対象とする
  - 未分類シリーズ（unclassified）は常に間接シリーズの末尾に配置する
  - 順序未指定時は元の配列順を維持する
  - _Requirements: 2.1, 3.3_
  - _Contracts: sortAreasByIndirectOrder Service_

- [x] 1.2 凡例データの間接作業ソート関数を実装する
  - 凡例パネル用の間接作業リストを指定順序で並べ替える関数を追加する
  - 未分類は常に末尾に配置する
  - _Requirements: 2.2_
  - _Contracts: sortLegendIndirectByOrder Service_

- [x] 1.3 UseChartDataOptions を拡張し、シリーズ構築で色・順序を反映する
  - オプションに間接作業の色マップと順序配列を追加する
  - 間接作業シリーズ構築時にユーザー指定色を参照し、未指定時は既定カラーパレットにフォールバックする
  - 1.1 で作成したソート関数を適用して間接シリーズを並べ替える
  - 1.2 で作成したソート関数を適用して凡例データの間接作業表示順を並べ替える
  - useMemo 依存配列に新規オプションを追加する
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 5.1_
  - _Contracts: UseChartDataOptions State_

- [x] 2. (P) SidePanelIndirect に色・順序変更の通知コールバックを追加する
  - 色変更・順序変更・色リセット時に親コンポーネントへ通知するコールバック props を追加する
  - 色変更時は全 items の workTypeCode→色コードのマップを通知する
  - 順序変更時は全 items の workTypeCode 配列を displayOrder 順で通知する
  - コールバックは optional とし、未指定時は既存動作と完全互換を維持する
  - 既存のバックエンド保存ロジックはそのまま維持する
  - _Requirements: 4.1, 4.2, 5.1_
  - _Contracts: SidePanelIndirectProps State_

- [x] 3. WorkloadPage で間接作業の色・順序 state を管理し橋渡しする
  - 間接作業の色マップと順序配列の state を追加する
  - SidePanelIndirect のコールバックから state を更新するハンドラを作成する
  - useChartData のオプションに間接作業の色・順序 state を渡す
  - SidePanelIndirect にコールバック props を渡す
  - 案件の既存 state・コールバック・オプション渡しに変更を加えない
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2_

- [x] 4. ソート関数のユニットテストを追加する
- [x] 4.1 (P) sortAreasByIndirectOrder のテストを追加する
  - 順序指定ありで間接シリーズのみが並べ替わることを検証する
  - 案件シリーズの位置が変更されないことを検証する
  - 順序未指定時に元の配列順が維持されることを検証する
  - 未分類シリーズが常に間接シリーズ末尾に来ることを検証する
  - 部分的な順序指定（一部の workTypeCode のみ）に対応することを検証する
  - _Requirements: 2.1, 3.3_

- [x] 4.2 (P) sortLegendIndirectByOrder のテストを追加する
  - 順序指定ありで間接作業が並べ替わることを検証する
  - 順序未指定時に元の配列順が維持されることを検証する
  - 未分類が常に末尾に来ることを検証する
  - _Requirements: 2.2_
