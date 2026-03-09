# Requirements Document

## Introduction

GitHub Issue #62 に基づき、ワークロード画面（`/workload`）のコントロールパネル > 間接作業タブにおいて、間接作業の積み上げ順序（チャートの層別順）を上下ボタンで入れ替える機能を提供する。

**重要な制約**: チャートにおいて間接作業の Area は必ず案件の Area の下部に配置される。順番入れ替えは、案件の下にある間接作業 Area の中での相対的な順序変更のみを対象とする。マスタ管理画面（`/master/work-types`）での表示順入れ替えは行わない。

## Requirements

### Requirement 1: 間接作業の積み上げ順入れ替え UI

**Objective:** As a 業務ユーザー, I want ワークロード画面のコントロールパネルで間接作業の積み上げ順を変更したい, so that チャートの層別順を業務上の優先度に合わせて並べ替えられる

#### Acceptance Criteria

1. The ワークロードコントロールパネルの間接作業タブ shall 各間接作業項目に上移動ボタンと下移動ボタンを表示する
2. When ユーザーが上移動ボタンをクリックした時, the コントロールパネル shall 対象の間接作業を1つ上の項目と入れ替えて表示する
3. When ユーザーが下移動ボタンをクリックした時, the コントロールパネル shall 対象の間接作業を1つ下の項目と入れ替えて表示する
4. While 対象項目がリストの先頭にある時, the コントロールパネル shall 上移動ボタンを無効化（disabled）する
5. While 対象項目がリストの末尾にある時, the コントロールパネル shall 下移動ボタンを無効化（disabled）する

### Requirement 2: 積み上げ順の永続化

**Objective:** As a 業務ユーザー, I want 変更した積み上げ順が保存されてほしい, so that 画面をリロードしても順番が維持される

#### Acceptance Criteria

1. When ユーザーが上下ボタンで積み上げ順を入れ替えた時, the システム shall 変更後の順序をサーバーに即座に保存する
2. If 積み上げ順の保存に失敗した場合, the コントロールパネル shall エラーメッセージを表示し、順序を操作前の状態に戻す

### Requirement 3: チャートへの即時反映

**Objective:** As a 業務ユーザー, I want 積み上げ順の変更がチャートに即座に反映されてほしい, so that 変更結果を視覚的に確認できる

#### Acceptance Criteria

1. When 間接作業の積み上げ順を変更した時, the ワークロードチャート shall 変更後の順序で間接作業の Area を積み上げ表示する
2. The ワークロードチャート shall 間接作業の Area を必ず案件の Area の下部に配置する
3. The システム shall 間接作業の積み上げ順入れ替えによって案件の Area の上に間接作業が表示されることを許容しない

### Requirement 4: 型安全性・コード品質

**Objective:** As a 開発者, I want 積み上げ順入れ替え機能が型安全に実装されていてほしい, so that 保守性が高く TypeScript エラーのないコードが維持される

#### Acceptance Criteria

1. The システム shall TypeScript strict mode でコンパイルエラーが発生しないこと
2. The システム shall `any` 型を使用しないこと
3. The API リクエスト・レスポンス shall Zod スキーマによるバリデーションが適用されていること
