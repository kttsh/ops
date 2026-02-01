# Requirements Document

## Introduction

Workload のプロファイル（ChartView）管理機能を拡張し、案件ごとの色・並び順・表示/非表示をプロファイルと紐づけて保存・復元できるようにする。また、既存プロファイルへの上書き保存機能を追加する。本機能により、ユーザーは自分がカスタマイズしたチャート表示設定をプロファイルとして管理し、いつでも正確に再現できるようになる。

**GitHub Issue**: #25 — 【enhancement】Workload プロファイル管理の拡張：案件の色・並び順・表示状態の保存と上書き保存機能

## Requirements

### Requirement 1: ChartViewProjectItem への色情報の追加

**Objective:** As a バックエンド開発者, I want ChartViewProjectItem エンティティに色（color）フィールドを追加したい, so that プロファイルごとに案件の色設定を永続化できる。

#### Acceptance Criteria

1. The ChartViewProjectItem スキーマ shall `color` フィールドを VARCHAR（NULL 許容）として保持する。
2. When ChartViewProjectItem が作成される, the ChartViewProjectItem API shall リクエストボディの `color` フィールドを受け取り、DB に保存する。
3. When ChartViewProjectItem が更新される, the ChartViewProjectItem API shall `color` フィールドの更新を受け付け、DB に反映する。
4. When ChartViewProjectItem が取得される, the ChartViewProjectItem API shall レスポンスに `color` フィールドを含める。
5. If `color` が指定されない場合, the ChartViewProjectItem API shall `color` を `null` として保存する。

### Requirement 2: プロジェクトアイテムの一括登録・更新 API

**Objective:** As a フロントエンド開発者, I want プロファイルに紐づくプロジェクトアイテム（色・並び順・表示状態）を一括で登録・更新する API が欲しい, so that プロファイル保存時に1回のAPIコールで全案件の設定を保存できる。

#### Acceptance Criteria

1. The ChartViewProjectItem API shall `PUT /chart-views/:id/project-items/bulk` エンドポイントを提供する。
2. When 一括更新リクエストが送信される, the ChartViewProjectItem API shall リクエストボディの配列に含まれる各アイテムを upsert（存在すれば更新、なければ作成）する。
3. When 一括更新が実行される, the ChartViewProjectItem API shall リクエストに含まれない既存アイテムを削除する（完全同期方式）。
4. The 一括更新リクエストの各アイテム shall `projectId`, `projectCaseId`, `displayOrder`, `isVisible`, `color` フィールドを含む。
5. If バリデーションエラーが発生した場合, the ChartViewProjectItem API shall RFC 9457 Problem Details 形式でエラーレスポンスを返す。
6. When 一括更新が成功する, the ChartViewProjectItem API shall 更新後のプロジェクトアイテム一覧をレスポンスとして返す。

### Requirement 3: プロファイル新規保存時のプロジェクトアイテム同時保存

**Objective:** As a Workload 画面のユーザー, I want プロファイルを新規保存するとき、現在の画面状態（案件の色・並び順・表示/非表示）も一緒に保存したい, so that 後でプロファイルを適用したときに完全に同じ表示が再現される。

#### Acceptance Criteria

1. When ユーザーがプロファイルを新規保存する, the ProfileManager shall ChartView を作成した直後に、現在の画面状態のプロジェクトアイテム一覧（色・並び順・表示/非表示）を一括登録 API で保存する。
2. The 新規保存処理 shall `viewName`, `chartType`, `startYearMonth`, `endYearMonth` に加えて、各案件の `projectId`, `projectCaseId`, `displayOrder`, `isVisible`, `color` を保存する。
3. If ChartView の作成は成功したがプロジェクトアイテムの保存に失敗した場合, the ProfileManager shall エラートーストを表示し、ユーザーに保存失敗を通知する。
4. When プロファイルの新規保存が完了する, the ProfileManager shall プロファイル一覧を最新の状態に更新する。

### Requirement 4: プロファイル適用時の画面状態の完全復元

**Objective:** As a Workload 画面のユーザー, I want プロファイルを適用したとき、保存時の期間設定だけでなく案件の色・並び順・表示状態も復元したい, so that プロファイルを切り替えるだけで以前のカスタマイズ状態に戻せる。

#### Acceptance Criteria

1. When ユーザーがプロファイルを適用する, the ProfileManager shall ChartView の `startYearMonth`, `endYearMonth`, `chartType` を復元する。
2. When ユーザーがプロファイルを適用する, the ProfileManager shall プロファイルに紐づくプロジェクトアイテムを取得し、各案件の `color` を復元する。
3. When ユーザーがプロファイルを適用する, the ProfileManager shall 各案件の `displayOrder` に基づいてチャートの積み上げ順序を復元する。
4. When ユーザーがプロファイルを適用する, the ProfileManager shall 各案件の `isVisible` に基づいて表示/非表示状態を復元する。
5. If プロファイルにプロジェクトアイテムが存在しない場合（旧プロファイル）, the ProfileManager shall 期間設定のみを復元し、色・並び順・表示状態は現在の画面状態を維持する。

### Requirement 5: プロファイルの上書き保存機能

**Objective:** As a Workload 画面のユーザー, I want 既存プロファイルを現在の画面状態で上書き保存したい, so that プロファイルを再作成せずに設定を更新できる。

#### Acceptance Criteria

1. The ProfileManager shall プロファイル一覧の各行に上書き保存ボタン（アイコン）を表示する。
2. When ユーザーが上書き保存ボタンをクリックする, the ProfileManager shall 確認ダイアログを表示する。
3. When ユーザーが確認ダイアログで「保存」を選択する, the ProfileManager shall 対象プロファイルの ChartView 情報（`chartType`, `startYearMonth`, `endYearMonth`）を現在の画面状態で更新する。
4. When 上書き保存が実行される, the ProfileManager shall プロジェクトアイテム一括更新 API を呼び出し、現在の画面状態（色・並び順・表示/非表示）で同期する。
5. When 上書き保存が成功する, the ProfileManager shall 成功トーストを表示し、プロファイル一覧を最新の状態に更新する。
6. If 上書き保存に失敗した場合, the ProfileManager shall エラートーストを表示し、プロファイルの状態を変更しない。

### Requirement 6: フロントエンド型定義とAPIクライアントの整合性

**Objective:** As a フロントエンド開発者, I want フロントエンドの ChartViewProjectItem 型にも `color` フィールドが反映されている, so that 型安全に色情報を扱える。

#### Acceptance Criteria

1. The フロントエンド ChartViewProjectItem 型 shall `color: string | null` フィールドを含む。
2. The API クライアント shall 一括更新 API（`PUT /chart-views/:id/project-items/bulk`）を呼び出す関数を提供する。
3. The TanStack Query mutations shall 一括更新用の mutation hook を提供する。
4. When 一括更新 mutation が成功する, the キャッシュ無効化 shall ChartViewProjectItems の関連クエリを無効化する。
