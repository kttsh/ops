# Implementation Plan

- [x] 1. 汎用フィールドマッパーの型定義と実装
- [x] 1.1 マッピング型定義の実装
  - 直接マッピング、カスタム変換、計算フィールドの3種類のマッピングエントリ型を定義する
  - Response 型のすべてのキーを網羅する型制約を実装し、フィールド漏れをコンパイル時に検出可能にする
  - カスタム変換の引数型が Row の特定フィールド型から正確に推論されることを保証する
  - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.3_

- [x] 1.2 ファクトリ関数の実装
  - マッピング定義を受け取り、Row オブジェクトから Response オブジェクトへの変換関数を返すファクトリを実装する
  - Date インスタンスのランタイム自動検出と ISO 8601 文字列への変換を組み込む
  - null / undefined の Date フィールドは null として出力する
  - マッピング定義に存在しないフィールドが Response に含まれないことを保証する
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 2.2_

- [x] 1.3 フィールドマッパーのユニットテスト作成
  - 直接マッピングによる snake_case → camelCase フィールド変換を検証する
  - Date オブジェクトの ISO 8601 文字列変換と nullable Date の null 保持を検証する
  - カスタム変換関数の適用と計算フィールドの Row 全体参照を検証する
  - マッピング未定義フィールドの除外を検証する
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 2. 純粋マッピング型 Transform の移行（Cat.1: 16ファイル）
- [x] 2.1 (P) deleted_at を含まない純粋マッピング型 Transform の移行
  - businessUnit, chartColorPalette, chartColorSetting, chartStackOrderSetting, indirectWorkTypeRatio, monthlyCapacity, monthlyHeadcountPlan, monthlyIndirectWorkLoad, projectCase, projectChangeHistory, projectLoad, projectType, workType の13ファイルを汎用マッパー呼び出しに置き換える
  - 各ファイルの export 関数名と引数・戻り値型を維持する
  - 既存テストがあるファイル（businessUnit, projectType, workType, chartColorPalette, indirectWorkTypeRatio）のテストがパスすることを確認する
  - _Requirements: 3.1, 3.2, 3.3, 4.3, 5.1, 5.2_

- [x] 2.2 (P) nullable Date を含む純粋マッピング型 Transform の移行
  - capacityScenario, headcountPlanCase, indirectWorkCase の3ファイルを汎用マッパー呼び出しに置き換える
  - deletedAt フィールドの Date | null → string | null 自動変換が正しく動作することを確認する
  - 各ファイルの export 関数名と引数・戻り値型を維持する
  - _Requirements: 3.1, 3.2, 3.3, 5.2, 5.4_

- [x] 3. カスタム変換付き Transform の移行（Cat.2: 4ファイル）
- [x] 3.1 (P) 単純なカスタム変換を含む Transform の移行
  - project（status の toLowerCase 変換 + nullable deletedAt）を汎用マッパーの transform エントリで置き換える
  - chartViewIndirectWorkItem（is_visible の boolean coercion）を汎用マッパーの transform エントリで置き換える
  - 既存テスト（projectTransform.test.ts）がパスすることを確認する
  - _Requirements: 3.4, 3.2, 3.3, 5.1_

- [x] 3.2 (P) ネスト構造・複合変換を含む Transform の移行
  - chartViewProjectItem（boolean coercion + null 合体 + ネストオブジェクト構築）を汎用マッパーの computed エントリで置き換える
  - chartView（JSON.parse によるビジネスユニットコード配列パース）を汎用マッパーの computed エントリで置き換える。ローカルのパース関数はファイル内に維持する
  - _Requirements: 3.4, 3.2, 3.3, 5.2_

- [x] 4. 回帰検証と複合ロジック型の保全確認
  - standardEffortMasterTransform.ts が一切変更されていないことを確認する
  - 既存の全 Transform テスト（7ファイル）がパスすることを確認する
  - TypeScript ビルドがエラーなく完了することを確認する
  - サービス層のインポートパスと呼び出しパターンが変更されていないことを確認する
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_
