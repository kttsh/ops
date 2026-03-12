# Requirements Document

## Introduction

案件工数の Excel インポート・エクスポート機能を改善する。現行の簡易フォーマット（キーコード・案件名・ケース名 + 年月列）から、案件メタデータ（BU・工事種別・客先名・地域等）を含む拡張フォーマットへ移行し、全ビジネスユニット横断でのデータ入出力を実現する。

主な改善ポイント:
- Excel 列構成の大幅拡張（A〜Q列の案件・ケース情報 + R列以降の月別工数）
- 全 BU を一括でインポート・エクスポート（BU コードを列で指定）
- 案件コード未入力時の新規案件自動登録
- 存在しない工数ケースの新規自動登録
- エクスポート時は全案件・全工数ケースを出力

**対象データ:** 案件工数（projects + project_cases + project_load）

## Requirements

### Requirement 1: Excel 列構成の拡張

**Objective:** As a プロジェクトマネージャー, I want Excel ファイルの列構成に案件の詳細メタデータ（BU・工事種別・客先名・地域等）を含めたい, so that Excel 上で案件情報の全体像を把握・編集でき、外部資料との整合性が取れる

#### Acceptance Criteria

1. The システム shall Excel ファイルの固定列を以下の順序で構成する:
   - A列: 案件コード（project_code）
   - B列: BU（business_unit_code）
   - C列: 年度
   - D列: 工事種別（project_type_code）
   - E列: 案件名（name）
   - F列: 通称・略称
   - G列: 客先名
   - H列: オーダ
   - I列: 開始時期（YYYYMM 形式）
   - J列: 案件工数（全体工数）
   - K列: 月数（カ月）
   - L列: 算出根拠
   - M列: 備考
   - N列: 地域
   - O列: 削除
   - P列: 工数ケースNo
   - Q列: 工数ケース名
2. The システム shall R列以降を年月列（YY-MM 形式）として構成する
3. The システム shall 年月列のヘッダーを YY-MM 形式（例: 25-04）で表示する
4. The システム shall projects テーブルに以下のカラムを追加する（いずれも NULL 許容）:
   - fiscal_year（年度）
   - nickname（通称・略称）
   - customer_name（客先名）
   - order_number（オーダ）
   - calculation_basis（算出根拠）
   - remarks（備考）
   - region（地域）

### Requirement 2: 全ビジネスユニット横断インポート

**Objective:** As a 事業部リーダー, I want 全ビジネスユニットの案件工数を 1 つの Excel ファイルで一括インポートしたい, so that BU ごとに個別操作する手間がなくなる

#### Acceptance Criteria

1. The システム shall インポート時に各行の B列（BU）に記載されたビジネスユニットコードに基づいて、対応する BU に案件を紐付ける
2. If B列のビジネスユニットコードがマスタテーブルに存在しない, the システム shall 該当行のバリデーションエラーを表示する
3. The システム shall 1 つの Excel ファイルに複数の BU のデータが混在していても正しくインポートできる
4. If D列（工事種別）のコードがマスタテーブルに存在しない, the システム shall 該当行のバリデーションエラーを表示する

### Requirement 3: 新規案件の自動登録

**Objective:** As a プロジェクトマネージャー, I want 案件コードが未入力の行を新規案件として自動登録したい, so that 新規案件の追加を Excel 上で効率的に行える

#### Acceptance Criteria

1. When A列（案件コード）が空欄の行をインポートする, the システム shall 案件コードを自動的に付与し新規プロジェクトとして登録する
2. The システム shall 自動付与された案件コードが既存の案件コードと重複しないことを保証する
3. When A列（案件コード）に既存の案件コードが入力されている, the システム shall 該当案件の情報を更新する
4. The システム shall 新規案件登録時に B列（BU）、E列（案件名）、I列（開始時期）、J列（全体工数）を必須項目として検証する

### Requirement 4: 工数ケースの自動登録

**Objective:** As a プロジェクトマネージャー, I want Excel ファイルに記載された工数ケースがシステムに存在しない場合に自動登録したい, so that 新規ケースの追加も Excel から一括で行える

#### Acceptance Criteria

1. When P列（工数ケースNo）とQ列（工数ケース名）の組み合わせがテーブルに存在しない, the システム shall 新規の工数ケースとして登録する
2. When P列（工数ケースNo）が既存の工数ケースに一致する, the システム shall 該当ケースの月別工数データを更新する
3. The システム shall 新規工数ケース登録時にケース名（Q列）を必須項目として検証する

### Requirement 5: 全案件・全工数ケースのエクスポート

**Objective:** As a 事業部リーダー, I want 全ビジネスユニットの全案件・全工数ケースを 1 つの Excel ファイルにエクスポートしたい, so that 組織全体の工数状況を Excel で横断的に確認・共有できる

#### Acceptance Criteria

1. When ユーザーがエクスポートを実行する, the システム shall 全 BU の全案件および全工数ケースを含む Excel ファイルを生成しダウンロードする
2. The システム shall エクスポートデータを案件コード・工数ケース順にソートする
3. The システム shall 論理削除されていない案件・工数ケースのみをエクスポート対象とする
4. While エクスポート処理が進行中, the システム shall ローディング状態を表示しボタンの二重クリックを防止する
5. If エクスポート対象のデータが存在しない, the システム shall エクスポート不可であることをユーザーに通知する

### Requirement 6: 動的年月列の取り込み

**Objective:** As a ユーザー, I want R列以降の年月データを値が存在する最後の列まで自動的に取り込みたい, so that 不要な手動操作なしに全期間のデータをインポートできる

#### Acceptance Criteria

1. The システム shall R列以降の列について、いずれかの行に値が入力されている最後の列まで取り込む
2. The システム shall 年月列のヘッダー（YY-MM 形式）を YYYYMM 形式に変換して内部処理する
3. If 年月列のヘッダーが YY-MM 形式でない, the システム shall 該当列のバリデーションエラーを表示する
4. The システム shall 年月列の空セルを工数 0 として扱う

### Requirement 7: O列（削除フラグ）によるソフトデリート

**Objective:** As a プロジェクトマネージャー, I want Excel の O列で案件の削除指定を行いたい, so that インポート操作で不要な案件を論理削除できる

#### Acceptance Criteria

1. When O列に削除を示す値が入力されている, the システム shall 該当案件を論理削除（ソフトデリート）する
2. When O列が空欄または削除を示さない値の場合, the システム shall 該当案件を通常通り登録・更新する
3. The システム shall エクスポート時に削除済み案件は出力しない

### Requirement 8: ラウンドトリップ互換性

**Objective:** As a ユーザー, I want エクスポートした Excel ファイルをそのままインポートに使用したい, so that データの再投入やテンプレートとしての利用がシームレスに行える

#### Acceptance Criteria

1. The システム shall エクスポートファイルをそのままインポートに使用できる
2. The システム shall エクスポートとインポートで同一の Excel フォーマット（列構成・ヘッダー・データ配置）を使用する
3. The システム shall エクスポートファイルの年月列範囲を、データが存在する全期間を網羅する範囲で生成する

### Requirement 9: データ整合性とバリデーション

**Objective:** As a システム管理者, I want インポート時にデータの整合性が保証されたい, so that 不正データによるシステム障害を防止できる

#### Acceptance Criteria

1. The システム shall インポート前にバリデーション（フォーマット・値範囲・必須項目・参照整合性）を実施する
2. If B列（BU コード）がマスタに存在しない, the システム shall 該当行のエラーを表示する
3. If D列（工事種別コード）がマスタに存在しない, the システム shall 該当行のエラーを表示する
4. If I列（開始時期）が YYYYMM 形式でない, the システム shall 該当行のエラーを表示する
5. If J列（全体工数）が数値でない、または許容範囲外, the システム shall 該当行のエラーを表示する
6. If R列以降の工数値が許容範囲外（0〜99,999,999）, the システム shall 該当セルのエラーを表示する
7. The システム shall バリデーションエラーがある場合にインポート確定ボタンを無効化する
8. When インポートが成功する, the システム shall 成功通知を表示し画面データを最新状態に更新する
9. If API 呼び出しが失敗する, the システム shall エラー内容をユーザーに通知する
