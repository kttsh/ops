# Requirements Document

## Introduction

Backend Transform 層（21ファイル, ~170行）の大部分が `snake_case → camelCase` の機械的フィールドマッピングのみで構成されている。この重複を汎用フィールドマッパーユーティリティに置き換え、Transform 層のボイラープレートを大幅に削減する。ビジネスロジックを含む Transform は個別に維持し、振る舞いの変更を伴わないリファクタリングとする。

### 現状の Transform 分類

現在の21ファイルは以下の3パターンに分類される:

1. **純粋マッピング型**（~15ファイル）: `snake_case → camelCase` + `Date.toISOString()` のみ
   - 例: `businessUnitTransform.ts`, `workTypeTransform.ts`, `projectLoadTransform.ts`
2. **軽微な変換付き型**（~3ファイル）: 純粋マッピングに加え、値変換（`toLowerCase()`, `!!`, ネストオブジェクト構築）を含む
   - 例: `projectTransform.ts`（`status.toLowerCase()`）, `chartViewProjectItemTransform.ts`（`!!is_visible`, ネスト構造）, `chartViewTransform.ts`（JSON.parse）
3. **複合ロジック型**（~3ファイル）: 複数の変換関数を持ち、ドメイン固有の変換ロジックを含む
   - 例: `standardEffortMasterTransform.ts`（summary/weight/detail の3変換）

## Requirements

### Requirement 1: 汎用フィールドマッパーユーティリティの提供

**Objective:** As a バックエンド開発者, I want DB 行オブジェクトから API レスポンスオブジェクトへの変換を宣言的なマッピング定義で行えるようにしたい, so that 新規エンティティ追加時に Transform ファイルを手書きする必要がなくなる

#### Acceptance Criteria

1. The Field Mapper shall `snake_case` キーを `camelCase` キーに自動変換する機能を提供する
2. The Field Mapper shall `Date` 型の値を ISO 8601 文字列に自動変換する機能を提供する
3. The Field Mapper shall `null` / `undefined` の `Date` 型フィールドに対して `null` を返す
4. The Field Mapper shall マッピング定義を型パラメータ（Row 型 → Response 型）で型安全に表現する
5. When マッピング定義に存在しないフィールドが Row に含まれる場合, the Field Mapper shall そのフィールドをレスポンスから除外する
6. The Field Mapper shall `utils/fieldMapper.ts` に配置される

### Requirement 2: カスタム変換のサポート

**Objective:** As a バックエンド開発者, I want 個別フィールドに対してカスタム変換ロジックを指定できるようにしたい, so that `toLowerCase()` やネストオブジェクト構築などの軽微な変換も汎用マッパーで対応できる

#### Acceptance Criteria

1. The Field Mapper shall 特定フィールドに対するカスタム変換関数を定義できる仕組みを提供する
2. When カスタム変換関数が定義されたフィールドを変換する場合, the Field Mapper shall 自動変換（camelCase / Date）の代わりにカスタム関数を適用する
3. The Field Mapper shall カスタム変換関数の型を Row のフィールド型と Response のフィールド型に基づき型安全に推論する

### Requirement 3: 既存 Transform ファイルの移行

**Objective:** As a バックエンド開発者, I want 既存の純粋マッピング型 Transform を汎用マッパー呼び出しに置き換えたい, so that Transform 層のボイラープレートが削減される

#### Acceptance Criteria

1. When 純粋マッピング型の Transform ファイルを移行する場合, the Transform shall 汎用マッパーを使用した簡潔な実装に置き換えられる
2. The 移行後の Transform shall 移行前と同一の API レスポンス形式を返す（振る舞い無変更）
3. The 移行後の Transform shall 既存の関数シグネチャ（`toXxxResponse(row: XxxRow): Xxx`）を維持する
4. When 軽微な変換（`toLowerCase()`, `!!`, `??`, ネストオブジェクト構築, JSON.parse）を含む Transform を移行する場合, the Transform shall カスタム変換機能を利用して同等の変換を実現する

### Requirement 4: 複合ロジック型 Transform の保全

**Objective:** As a バックエンド開発者, I want ドメイン固有ロジックを持つ Transform が影響を受けないことを保証したい, so that リファクタリングの安全性が確保される

#### Acceptance Criteria

1. The `standardEffortMasterTransform.ts` shall 既存の実装を維持し、汎用マッパーへの移行対象外とする
2. Where Transform が複数の変換関数を持ち相互参照する場合, the Transform shall 個別ファイルとして維持される
3. The リファクタリング shall 既存のサービス層（`services/*.ts`）の Transform 呼び出しコードに変更を要求しない

### Requirement 5: 後方互換性の保証

**Objective:** As a QA エンジニア, I want リファクタリング前後で API レスポンスが完全に一致することを検証したい, so that 回帰バグが発生しないことが保証される

#### Acceptance Criteria

1. The 汎用マッパー shall 既存テストがすべてパスする状態を維持する
2. The リファクタリング shall API エンドポイントのレスポンス JSON 構造を一切変更しない
3. The リファクタリング shall `Date` 型フィールドの ISO 8601 フォーマット出力が既存実装と同一であることを保証する
4. When `deletedAt` のような nullable な Date フィールドが `null` である場合, the 汎用マッパー shall `null` を返す（既存動作と同一）
