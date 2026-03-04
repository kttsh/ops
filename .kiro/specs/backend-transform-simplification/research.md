# Research & Design Decisions

## Summary
- **Feature**: `backend-transform-simplification`
- **Discovery Scope**: Extension（既存システムのリファクタリング）
- **Key Findings**:
  - Transform 21ファイルのうち20ファイルが単一関数・同一構造で、汎用マッパーへの移行が容易
  - nullable Date（`?.toISOString() ?? null`）は16ファイルで使用される標準パターンであり、マッパーが自動処理すべき
  - サービス層は100%一貫した呼び出しパターンのため、エクスポートシグネチャ維持で影響ゼロ

## Research Log

### Transform ファイルの詳細分類

- **Context**: 移行対象と対象外を正確に識別するため
- **Sources Consulted**: 全21ファイルの実コード
- **Findings**:
  - Cat.1（純粋マッピング）16ファイル: snake→camel + `Date.toISOString()` + nullable Date のみ
  - Cat.2（カスタム変換）4ファイル:
    - `projectTransform.ts`: `status.toLowerCase()`
    - `chartViewProjectItemTransform.ts`: `!!is_visible`, ネスト構造（`project`, `projectCase`）, `color_code ?? null`
    - `chartViewIndirectWorkItemTransform.ts`: `!!is_visible`
    - `chartViewTransform.ts`: `parseBusinessUnitCodes`（JSON.parse）
  - Cat.3（複合ロジック）1ファイル: `standardEffortMasterTransform.ts`（3関数、相互参照）
- **Implications**: Cat.1 はマッパー定義のみ、Cat.2 はカスタム変換関数の併用、Cat.3 は移行対象外

### TypeScript 型設計の検討

- **Context**: `createFieldMapper` の型パラメータ設計
- **Findings**:
  - Response 型のキーを網羅する Record 型 `Record<keyof TResponse, ...>` でフィールド漏れをコンパイル時検出可能
  - 各エントリの値は `keyof TRow`（直接マッピング）または `{ field: keyof TRow; transform: (v) => ... }`（カスタム変換）の union
  - `computed` エントリ（`row` 全体を受け取る関数）でネスト構造やクロスフィールド変換に対応
- **Implications**: 型安全性と DX のバランスが取れた設計が可能

### Date 型の自動変換検討

- **Context**: Date フィールドを自動検出するか明示指定するか
- **Findings**:
  - TypeScript のランタイムでは型情報が消失するため、`instanceof Date` でランタイム検出するか、マッピング定義で明示するかの二択
  - `instanceof Date` はランタイムチェックだが、DB ドライバが常に `Date` オブジェクトを返すため信頼性は高い
  - 明示指定（`dateToISO` ヘルパー）は型レベルで安全だが、全ファイルで `createdAt` / `updatedAt` に毎回指定するボイラープレートが残る
- **Selected**: ランタイム自動検出を採用。`Date` 型フィールドは自動で `.toISOString()` 変換。`null | undefined` は `null` を返す

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 宣言的マッピング | `Record<keyof TResponse, MappingEntry>` による明示的マッピング | 型安全、フィールド漏れ検出 | フィールド列挙のボイラープレート | 推奨 |
| B: 自動変換 | ランタイム snake→camel 自動変換 | 最小ボイラープレート | 型安全性弱、ネスト構造非対応 | 不採用 |
| C: ハイブリッド | A + 短縮構文 | バランス | 2構文の認知負荷 | 不採用 |

## Design Decisions

### Decision: 宣言的マッピング + Date ランタイム自動変換

- **Context**: 型安全性とボイラープレート削減の両立
- **Alternatives Considered**:
  1. Option A — 完全明示的マッピング（Date 含む）
  2. Option A' — 明示的マッピング + Date 自動変換（ハイブリッド）
  3. Option B — 全自動変換
- **Selected Approach**: Option A'（明示的マッピング + Date 自動変換）
  - フィールド対応は `Record<keyof TResponse, keyof TRow | CustomMapping>` で明示
  - `Date` インスタンスは自動で `.toISOString()` に変換（`null` → `null` 保持）
  - ネスト構造は `computed` エントリで `(row: TRow) => value` として表現
- **Rationale**:
  - フィールド名の対応は明示が必要（除外フィールドがあるため自動推測不可）
  - Date 変換は全ファイルで同一パターンのため自動化の効果が大きい
  - `computed` により Cat.2 のカスタム変換も統一的に扱える
- **Trade-offs**:
  - (+) フィールド漏れ・余分なフィールドをコンパイル時検出
  - (+) Date ボイラープレート排除
  - (-) ランタイム型チェック（`instanceof Date`）への依存
- **Follow-up**: 移行後に既存テスト7件が全パスすることを確認

### Decision: ネスト構造は computed エントリで対応

- **Context**: `chartViewProjectItemTransform` のような入れ子オブジェクト構築
- **Selected Approach**: `computed: (row: TRow) => TResponse[K]` 関数でフィールド値を算出
- **Rationale**: ネスト構造は4ファイル中1ファイルのみ。専用のネストマッピング構文を設けるより、汎用的な computed で十分

## Risks & Mitigations

- **テストカバレッジ不足（14/21ファイル未テスト）** — 移行時にビルドエラーで検出可能。型システムがフィールド不整合を捕捉
- **Date ランタイム検出の信頼性** — mssql ドライバの挙動に依存。既存テストで検証済み
- **サービス層への波及** — エクスポートシグネチャ維持で影響なし
