# Research & Design Decisions

## Summary
- **Feature**: `frontend-form-type-infrastructure`
- **Discovery Scope**: Extension (既存パターンのリファクタリング)
- **Key Findings**:
  - TanStack Form v1.x の `form.Field` はフォームインスタンスに型が紐づくため、完全ラップには型推論上の制約がある
  - 既存フォームの FormField パターンは「レイアウト部分」と「フィールド入力部分」に分離可能
  - Zod スキーマのバリデーションルールは code/name/displayOrder で完全に同一（エラーメッセージの固有名称部分のみ差異）

## Research Log

### TanStack Form v1.x の Field コンポーネント型安全性
- **Context**: FormField ラッパーの設計方針を決定するため、form.Field の型構造を調査
- **Sources**: プロジェクト内 package.json (`@tanstack/react-form@^1.12.2`)、既存フォーム実装
- **Findings**:
  - `form.Field` は `form` インスタンスから型推論される。`name` prop はフォームの `defaultValues` の型から制約される
  - render-as-children パターンで `field` オブジェクトを受け取る
  - `field.state.value` の型は `name` から自動推論される
  - 完全な型安全ラッパーを作るには、フォームの型パラメータを渡す必要があり、ジェネリクスが複雑化する
- **Implications**: `form.Field` 自体をラップするのではなく、render prop 内のレイアウト部分をラッパーとして抽出する方が型安全かつ実用的

### 既存フォームフィールドのバリエーション分析
- **Context**: FormField コンポーネントがカバーすべきユースケースの網羅性を検証
- **Findings**:
  - **テキスト入力**: 13+ 箇所（全フォーム共通）
  - **数値入力**: totalManhour, durationMonths（Input type="number"）
  - **Select（静的）**: status フィールド（1箇所）
  - **Select（非同期）**: businessUnitCode, projectTypeCode（2箇所）
  - **カラーピッカー**: color フィールド（1箇所、完全カスタム）
  - **必須マーク**: mode ベース / 常時表示 / なしの3パターン
  - **disabled**: code フィールドの edit モード時
- **Implications**: レイアウトラッパー + テキスト入力の2レイヤー設計が最適。カスタムレンダリング（カラーピッカー等）はレイアウトラッパーの children で対応

### 既存ユーティリティとの統合
- **Context**: 既に抽出済みのユーティリティとの関係を確認
- **Findings**:
  - `lib/form-utils.ts`: `getErrorMessage()` — FormField 内部で使用
  - `lib/validators.ts`: `displayOrderValidators` — FormField の validators prop として使用
  - `lib/format-utils.ts`: `formatDateTime()` — Phase 1 で抽出済み（本フィーチャーとは無関係）
  - `lib/api/constants.ts`: `STALE_TIMES` — Phase 1 で抽出済み
  - `components/shared/column-helpers.ts`: Phase 2-2 で作成済み
- **Implications**: 既存ユーティリティを活用し、新コンポーネントは既存の `getErrorMessage` を内部利用する

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: form.Field 完全ラップ | form インスタンスと name を props で渡し、form.Field 全体をラップ | ボイラープレート最小化 | ジェネリクス複雑化、型推論がフォーム型に依存 | TanStack Form の API 変更に脆弱 |
| B: レイアウトラッパー + フィールドヘルパー | render prop 内のレイアウト（Label+Error）を共通化し、Input は別途ヘルパー | 型安全性維持、柔軟性高 | form.Field は呼び出し側で書く必要あり | **採用** |
| C: createFormHook パターン | TanStack Form の createFormHook API でカスタムフックを作成 | 公式推奨パターン | v1.x では createFormHook は未提供 | v2 以降で再検討 |

## Design Decisions

### Decision: レイアウトラッパー + フィールドヘルパーアプローチ

- **Context**: FormField の抽象化レベルをどこに設定するか
- **Alternatives Considered**:
  1. form.Field 完全ラップ — ジェネリクスが複雑化し、TanStack Form のバージョンアップに脆弱
  2. レイアウトラッパー + フィールドヘルパー — 型安全性を維持しつつボイラープレートを削減
  3. createFormHook パターン — v1.x では利用不可
- **Selected Approach**: Option B — `FieldWrapper`（レイアウト）と `FormTextField`（テキスト入力ヘルパー）の2層構造
- **Rationale**: form.Field の render prop 内で使用するため、TanStack Form の型推論を完全に活かせる。カスタムレンダリング（カラーピッカー等）は FieldWrapper + children で対応可能
- **Trade-offs**: form.Field の記述は残るが、内部のレイアウトコードが大幅に削減される
- **Follow-up**: TanStack Form v2 の createFormHook が安定したら再検討

### Decision: QuerySelect は field オブジェクトを直接受け取らない

- **Context**: QuerySelect を form.Field の render prop 内で使うか、独立コンポーネントにするか
- **Selected Approach**: `value`, `onValueChange`, `queryResult` を props で受け取る独立コンポーネント
- **Rationale**: TanStack Form 以外のコンテキスト（フィルタ UI 等）でも再利用可能にするため
- **Trade-offs**: field.handleChange を呼び出し側で接続する必要がある

### Decision: 基底型は interface extends で定義

- **Context**: 基底型を type alias (`&` intersection) で定義するか、interface extends で定義するか
- **Selected Approach**: `interface extends` を使用
- **Rationale**: TypeScript の interface extends はエラーメッセージが分かりやすく、IDE の型表示も明確。intersection よりもパフォーマンスが良い
- **Trade-offs**: なし（interface は type alias の上位互換）

## Risks & Mitigations

- **Risk**: FormField 抽象化により既存フォームの視覚的一貫性が崩れる — FieldWrapper のスタイリングを既存パターンと完全一致させ、リファクタリング前後でスナップショットを比較
- **Risk**: QuerySelect の props 設計がユースケースをカバーしきれない — ProjectForm の2箇所（必須/任意）を PoC として先に実装し、props を検証
- **Risk**: 基底型への移行で既存の型参照が壊れる — 既存型を extends に変更するだけで外部インターフェースは不変

## References

- TanStack Form v1 ドキュメント — Field コンポーネント API
- shadcn/ui Select コンポーネント — SelectTrigger/SelectContent/SelectItem
- プロジェクト内既存パターン — `components/shared/column-helpers.ts`（ファクトリパターンの先行事例）
