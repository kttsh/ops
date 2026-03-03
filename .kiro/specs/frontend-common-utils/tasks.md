# Implementation Plan

- [x] 1. 共通ユーティリティモジュールの作成とテスト
- [x] 1.1 (P) formatDateTime ユーティリティの作成とテスト
  - 日時文字列を ja-JP ロケールで年月日時分フォーマットする関数を作成する
  - 既存の4つの columns.tsx にあるローカル実装と同一の出力を保証する
  - ISO 文字列入力に対するフォーマット結果を検証するユニットテストを作成する
  - _Requirements: 1.1, 1.2_
  - _Contracts: format-utils.ts Service Interface_

- [x] 1.2 (P) displayOrder バリデータの作成とテスト
  - TanStack Form の validators prop と互換な displayOrder フィールド用バリデータを作成する
  - 整数チェックと非負チェックの2段階バリデーションを onChange/onBlur 両方に設定する
  - エラーメッセージは既存の3つのフォームと同一の日本語メッセージを使用する
  - 正常値（正整数・0）、異常値（非整数・負数）の各ケースのユニットテストを作成する
  - _Requirements: 2.1, 2.2_
  - _Contracts: validators.ts Service Interface_

- [x] 1.3 (P) staleTime 定数モジュールの作成とテスト
  - データ更新頻度に応じた4カテゴリ（SHORT/STANDARD/MEDIUM/LONG）の staleTime 定数オブジェクトを作成する
  - 既存の queries.ts ファイルで使われている4種のマジックナンバーと値が完全一致すること
  - API ユーティリティの barrel export に定数を追加する
  - 各定数値がミリ秒仕様と一致することを検証するユニットテストを作成する
  - _Requirements: 3.1, 3.2_
  - _Contracts: api/constants.ts Service Interface_

- [x] 2. 共有コンポーネントの作成
- [x] 2.1 (P) DetailRow 共有コンポーネントの作成
  - 詳細画面のラベル・値ペアを3カラムグリッドで表示する共有コンポーネントを作成する
  - label と value の文字列 props を受け取り、既存のローカル定義と同一の CSS クラスを適用する
  - 既存の共有コンポーネントパターンに準拠し、className prop によるスタイル拡張に対応する
  - _Requirements: 4.1, 4.2_
  - _Contracts: DetailRow.tsx State Interface_

- [x] 2.2 (P) NotFoundState 共有コンポーネントの作成
  - リソース未検出時のエンティティ名表示と一覧ページへの戻りリンクを提供する共有コンポーネントを作成する
  - entityName（表示名）、backTo（戻りパス）、backLabel（リンクラベル、デフォルト「一覧に戻る」）の props を受け取る
  - TanStack Router の Link コンポーネントを使用し、既存の notFoundComponent と同一のレイアウトを再現する
  - 既存の共有コンポーネントパターンに準拠し、className prop に対応する
  - _Requirements: 5.1, 5.2, 5.3_
  - _Contracts: NotFoundState.tsx State Interface_

- [x] 3. Feature ファイルの移行（ユーティリティ統合）
- [x] 3.1 (P) columns.tsx の formatDateTime をモジュールに置換
  - work-types, business-units, project-types, projects の4つの columns.tsx からローカル formatDateTime 定義を削除する
  - 共通モジュールからのインポートに切り替え、日時フォーマットの呼び出し箇所をそのまま維持する
  - 各ファイルの日時カラム表示が置換前と同一であることを確認する
  - _Requirements: 1.3, 1.5, 7.1_

- [x] 3.2 (P) フォームの displayOrder バリデータを共通モジュールに置換
  - WorkTypeForm, BusinessUnitForm, ProjectTypeForm の3つのフォームコンポーネントのインラインバリデーションを削除する
  - 共通バリデータモジュールからのインポートに切り替え、validators prop にそのまま設定する
  - フォームの表示順バリデーション動作が置換前と同一であることを確認する
  - _Requirements: 2.3, 2.4, 7.2_

- [x] 3.3 (P) queries.ts の staleTime マジックナンバーを定数に置換
  - 7つの feature（work-types, business-units, project-types, projects, case-study, indirect-case-study, workload）の queries.ts を更新する
  - 31箇所のマジックナンバーを対応する名前付き定数に機械的に置換する
  - 置換マッピング: 1分→SHORT, 2分→STANDARD, 5分→MEDIUM, 30分→LONG
  - 各クエリの staleTime 値が置換前と同一であることを確認する
  - _Requirements: 3.3, 3.4, 7.3_

- [x] 4. Detail route の移行（共有コンポーネント・ユーティリティ統合）
- [x] 4.1 (P) 4つの detail route に共有コンポーネントと formatDateTime を統合
  - business-units, project-types, work-types, projects の4つの detail route を更新する
  - 各ファイルのローカル DetailRow コンポーネント定義を削除し、共有コンポーネントからインポートする
  - notFoundComponent と isError 時の NotFound 表示を NotFoundState 共有コンポーネントに置換する
  - インラインの toLocaleString 呼び出しを formatDateTime ユーティリティに置換する
  - 各エンティティ固有の entityName と backTo パスを正しく設定する
  - 詳細画面・NotFound 画面の見た目が置換前と同一であることを確認する
  - _Requirements: 1.4, 1.5, 4.3, 4.4, 5.4, 5.5, 7.1_

- [x] 5. 最終検証
  - TypeScript の型チェックがエラーなく通ることを確認する
  - 既存のテストスイートが全てパスすることを確認する
  - 新規作成したユニットテストが全てパスすることを確認する
  - 全ファイルで `@/` エイリアスを使用したインポートパスであることを確認する
  - _Requirements: 6.3, 6.4, 7.4, 7.5_
