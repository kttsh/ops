# Requirements Document

## Introduction

リファクタリング計画 Phase 1 の 1-3（Frontend 共通ユーティリティ）および 1-4（Frontend 共有コンポーネント抽出）を実施する。Frontend コードベースに散在する重複関数・マジックナンバー・ローカルコンポーネントを共通モジュールに集約し、保守性と一貫性を向上させる。

対象コードスメル:
- [F-C1] formatDateTime 関数の4重複 (HIGH)
- [F-C4] displayOrder バリデータの重複 (HIGH)
- [F-A4] staleTime のマジックナンバー散在 (MEDIUM)
- [F-RO2] DetailRow コンポーネントの4重複 (MEDIUM)
- [F-RO3] NotFound コンポーネントの4重複 (MEDIUM)

## Requirements

### Requirement 1: formatDateTime 共通ユーティリティの抽出 [F-C1]

**Objective:** As a 開発者, I want 日時フォーマット関数が単一モジュールに定義されている状態, so that フォーマット仕様の変更時に1箇所のみ修正すればよい

#### Acceptance Criteria

1. The Frontend shall `lib/format-utils.ts` に `formatDateTime` 関数をエクスポートする
2. When `formatDateTime` が日時文字列を受け取った場合, the Frontend shall `ja-JP` ロケールで `yyyy/MM/dd HH:mm` 形式の文字列を返す
3. The Frontend shall 以下の4ファイルのローカル `formatDateTime` 定義を削除し、共通モジュールからインポートする:
   - `features/work-types/components/columns.tsx`
   - `features/business-units/components/columns.tsx`
   - `features/project-types/components/columns.tsx`
   - `features/projects/components/columns.tsx`
4. The Frontend shall 4つの detail route ファイルのインライン `toLocaleString("ja-JP")` 呼び出しを `formatDateTime` に置換する:
   - `routes/master/business-units/$businessUnitCode/index.tsx`
   - `routes/master/project-types/$projectTypeCode/index.tsx`
   - `routes/master/work-types/$workTypeCode/index.tsx`
   - `routes/master/projects/$projectId/index.tsx`
5. The Frontend shall リファクタリング前後で全画面の日時表示が同一であること

### Requirement 2: displayOrder バリデータの共通化 [F-C4]

**Objective:** As a 開発者, I want displayOrder フィールドのバリデーションロジックが一箇所に集約されている状態, so that バリデーションルールの変更が全フォームに即座に反映される

#### Acceptance Criteria

1. The Frontend shall `lib/validators.ts` に `displayOrderValidators` オブジェクトをエクスポートする
2. The `displayOrderValidators` shall `onChange` と `onBlur` の両方で以下のルールを検証する:
   - 整数でない場合: `"表示順は整数で入力してください"` を返す
   - 0未満の場合: `"表示順は0以上で入力してください"` を返す
   - 有効な場合: `undefined` を返す
3. The Frontend shall 以下の3ファイルのインラインバリデーションロジックを `displayOrderValidators` に置換する:
   - `features/work-types/components/WorkTypeForm.tsx`
   - `features/business-units/components/BusinessUnitForm.tsx`
   - `features/project-types/components/ProjectTypeForm.tsx`
4. The Frontend shall リファクタリング前後でバリデーション動作が同一であること

### Requirement 3: staleTime 定数の一元管理 [F-A4]

**Objective:** As a 開発者, I want TanStack Query の staleTime 値が名前付き定数として管理されている状態, so that キャッシュ戦略の意図が明確になり、変更時の影響範囲を把握しやすくなる

#### Acceptance Criteria

1. The Frontend shall `lib/api/constants.ts` に `STALE_TIMES` 定数オブジェクトをエクスポートする
2. The `STALE_TIMES` shall 以下のカテゴリ別の値を含む:
   - `SHORT`: `60 * 1000`（1分）— 頻繁に更新されるデータ向け
   - `STANDARD`: `2 * 60 * 1000`（2分）— 一覧/詳細クエリ向け
   - `MEDIUM`: `5 * 60 * 1000`（5分）— 関連データ/月次データ向け
   - `LONG`: `30 * 60 * 1000`（30分）— マスタデータ向け
3. The Frontend shall 全 `queries.ts` ファイルのマジックナンバー `staleTime` 値を `STALE_TIMES` 定数に置換する
4. The Frontend shall リファクタリング前後で各クエリの staleTime 値が同一であること

### Requirement 4: DetailRow 共有コンポーネントの抽出 [F-RO2]

**Objective:** As a 開発者, I want 詳細画面のラベル・値ペア表示が共有コンポーネントとして提供されている状態, so that 詳細画面のレイアウト変更を一箇所で制御できる

#### Acceptance Criteria

1. The Frontend shall `components/shared/DetailRow.tsx` に `DetailRow` コンポーネントをエクスポートする
2. The `DetailRow` shall `label: string` と `value: string` の props を受け取り、`grid grid-cols-3 gap-4` レイアウトで表示する
3. The Frontend shall 以下の4ファイルのローカル `DetailRow` 定義を削除し、共有コンポーネントからインポートする:
   - `routes/master/business-units/$businessUnitCode/index.tsx`
   - `routes/master/project-types/$projectTypeCode/index.tsx`
   - `routes/master/work-types/$workTypeCode/index.tsx`
   - `routes/master/projects/$projectId/index.tsx`
4. The Frontend shall リファクタリング前後で詳細画面の見た目が同一であること

### Requirement 5: NotFoundState 共有コンポーネントの抽出 [F-RO3]

**Objective:** As a 開発者, I want 「リソースが見つかりません」表示が共有コンポーネントとして提供されている状態, so that NotFound UI の統一性を保ちつつ、各ルートでエンティティ名とリンク先のみ指定すればよい

#### Acceptance Criteria

1. The Frontend shall `components/shared/NotFoundState.tsx` に `NotFoundState` コンポーネントをエクスポートする
2. The `NotFoundState` shall 以下の props を受け取る:
   - `entityName: string` — 表示用エンティティ名（例: "ビジネスユニット"）
   - `backTo: string` — 一覧ページへの戻りパス（例: "/master/business-units"）
   - `backLabel?: string` — 戻りリンクのラベル（デフォルト: "一覧に戻る"）
3. The `NotFoundState` shall `"{entityName}が見つかりません"` メッセージと一覧への戻りリンクを中央配置で表示する
4. The Frontend shall 以下の4ファイルの `notFoundComponent` および `isError || !data` 時の NotFound 表示を `NotFoundState` に置換する:
   - `routes/master/business-units/$businessUnitCode/index.tsx`
   - `routes/master/project-types/$projectTypeCode/index.tsx`
   - `routes/master/work-types/$workTypeCode/index.tsx`
   - `routes/master/projects/$projectId/index.tsx`
5. The Frontend shall リファクタリング前後で NotFound 画面の見た目が同一であること

### Requirement 6: テストとの整合性

**Objective:** As a 開発者, I want 抽出した共通ユーティリティ・コンポーネントにユニットテストが存在する状態, so that 共通モジュールの品質が保証される

#### Acceptance Criteria

1. The Frontend shall `formatDateTime` 関数のユニットテストを含む
2. The Frontend shall `displayOrderValidators` のユニットテストを含む（正常系・異常系）
3. The Frontend shall `STALE_TIMES` 定数の値が仕様通りであることを検証するテストを含む
4. The Frontend shall 全テストが Vitest で実行可能であること

### Requirement 7: 後方互換性の維持

**Objective:** As a 開発者, I want リファクタリングにより外部から観測可能な振る舞いが一切変わらない状態, so that 安全にリファクタリングを進められる

#### Acceptance Criteria

1. The Frontend shall リファクタリング前後で全画面の表示内容が同一であること
2. The Frontend shall リファクタリング前後で全フォームのバリデーション動作が同一であること
3. The Frontend shall リファクタリング前後で全クエリのキャッシュ動作が同一であること
4. The Frontend shall 既存のテストが全てパスすること
5. The Frontend shall `@/` エイリアスを使用したインポートパスであること
