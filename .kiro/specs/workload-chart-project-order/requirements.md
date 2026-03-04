# Requirements Document

## Introduction
工数需要の積み上げチャート（Area Chart）において、設定タブで変更した案件の並び順が即座に反映されるようにする UX 改善。現状は `SidePanelSettings` の並び順（`projOrder`）が `useChartData` に伝播せず、チャートのシリーズ順序が API レスポンス順で固定されている。本要件により、設定タブ・チャート・凡例パネルの案件表示順を一貫させ、ユーザーが直感的に積み上げ順序を制御できるようにする。

## Requirements

### Requirement 1: チャートシリーズ順序の同期
**Objective:** As a 事業部リーダー, I want 設定タブで案件の並び順を変更したとき Area Chart の積み上げ順序が即座に入れ替わること, so that チャートの積み上げ順序を自分の分析意図に合わせて制御できる

#### Acceptance Criteria
1. When ユーザーが設定タブで案件の並び順を上下矢印で変更する, the WorkloadPage shall Area Chart の積み上げ順序を設定タブの表示順と一致するよう即座に更新する
2. When 案件の並び順が変更される, the useChartData shall seriesConfig.areas の案件シリーズを指定された順序で返す
3. The useChartData shall projectOrder パラメータが未指定の場合、API レスポンス順（従来の動作）でシリーズを返す

### Requirement 2: 凡例パネルの順序同期
**Objective:** As a 事業部リーダー, I want 凡例パネルの案件表示順が設定タブの並び順と一致すること, so that チャートと凡例の対応関係を混乱なく把握できる

#### Acceptance Criteria
1. When 設定タブで案件の並び順が変更される, the LegendPanel shall 案件の表示順を設定タブの並び順と一致するよう即座に更新する
2. The LegendPanel shall チャートの積み上げ順序と凡例の表示順が常に一致していること

### Requirement 3: プロファイル適用時の順序復元
**Objective:** As a ユーザー, I want プロファイルを適用したとき保存された並び順がチャートに正しく復元されること, so that プロファイル切替時に並び順を手動で再設定する手間が省ける

#### Acceptance Criteria
1. When ユーザーがプロファイルを適用する, the WorkloadPage shall プロファイルに保存された案件の並び順を Area Chart と凡例パネルに復元する
2. If プロファイルに並び順情報が存在しない, the WorkloadPage shall API レスポンス順（デフォルト）で表示する

### Requirement 4: 型安全性の維持
**Objective:** As a 開発者, I want 並び順の受け渡しが型安全に実装されること, so that コンパイル時にインターフェース不整合を検出できる

#### Acceptance Criteria
1. The WorkloadPage shall 並び順に関するすべての props・state・コールバックが TypeScript strict mode で型エラーなく定義されていること
2. The useChartData shall projectOrder オプションの型が明示的に定義されていること
