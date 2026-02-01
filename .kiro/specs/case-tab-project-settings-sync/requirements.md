# Requirements Document

## Introduction
案件タブ（`SidePanelProjects`）でユーザーが選択した案件が、設定タブ（`SidePanelSettings`）の「案件設定」セクションに反映されていないバグを修正する。現状では設定タブには常にBU配下の全案件が表示されるが、案件タブで選択された案件のみに限定する必要がある。

**GitHub Issue**: #27

## Requirements

### Requirement 1: 案件タブの選択状態を設定タブに伝播する
**Objective:** ワークロード画面のユーザーとして、案件タブで選択した案件のみが設定タブの案件設定に表示されるようにしたい。これにより、選択中の案件に対してのみ色設定や並び順を管理でき、混乱を防ぐ。

#### Acceptance Criteria
1. When ユーザーが案件タブで案件を選択/解除した場合, the ワークロード画面 shall 設定タブの案件設定セクションに選択中の案件のみを表示する
2. When ユーザーが案件タブで案件の選択を変更した場合, the 設定タブ shall 案件リストをリアルタイムに更新し、追加された案件を表示し、解除された案件を非表示にする
3. The ワークロード画面 shall `selectedProjectIds` を `SidePanelSettings` コンポーネントに props として渡す

### Requirement 2: projOrder の初期化・更新ロジックを選択案件に限定する
**Objective:** ワークロード画面のユーザーとして、案件の並び順（projOrder）と色設定が選択中の案件のみを対象とするようにしたい。これにより、未選択の案件が並び替えや色設定に混入しない。

#### Acceptance Criteria
1. When 選択案件が変更された場合, the SidePanelSettings shall `projOrder` を選択中の案件IDのみで構成する
2. When 新たに案件が選択された場合, the SidePanelSettings shall 新しい案件を `projOrder` の末尾に追加し、既存の並び順を維持する
3. When 案件の選択が解除された場合, the SidePanelSettings shall 該当案件を `projOrder` から除外する
4. When `projOrder` が更新された場合, the SidePanelSettings shall 色設定（`projColors`）も選択中の案件のみを対象として同期する

### Requirement 3: 色設定・並び順の操作が正常に動作する
**Objective:** ワークロード画面のユーザーとして、フィルタリング後も案件の色設定と並び順変更が正常に機能することを確認したい。これにより、既存のUX品質を維持する。

#### Acceptance Criteria
1. While 案件が選択されている状態で, When ユーザーが色設定を変更した場合, the SidePanelSettings shall 変更を `onProjectColorsChange` コールバック経由で親コンポーネントに通知する
2. While 案件が選択されている状態で, When ユーザーが案件の並び順をドラッグ&ドロップで変更した場合, the SidePanelSettings shall 新しい並び順を正しく保持する
3. When プロファイル適用が実行された場合, the SidePanelSettings shall 選択中の案件に対してプロファイルの色設定と並び順を適用する

### Requirement 4: TypeScript 型安全性の維持
**Objective:** 開発者として、変更後もTypeScriptの型エラーが発生しないことを確認したい。これにより、コードの品質と保守性を維持する。

#### Acceptance Criteria
1. The SidePanelSettingsProps shall `selectedProjectIds: Set<number>` プロパティを含む
2. The ワークロード画面 shall TypeScript のコンパイルエラーなしでビルドが通る
