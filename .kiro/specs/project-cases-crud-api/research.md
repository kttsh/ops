# Research & Design Decisions

---
**Purpose**: project-cases-crud-api の設計判断を裏付ける調査結果と根拠を記録する。
---

## Summary
- **Feature**: `project-cases-crud-api`
- **Discovery Scope**: Simple Addition（既存 CRUD パターンの踏襲）
- **Key Findings**:
  - 既存の businessUnits CRUD 実装が完全なリファレンスパターンとして利用可能
  - project_cases は projects の子リソースであり、ネストされたルーティング（`/projects/:projectId/project-cases`）が必要
  - 外部キーの JOIN 取得（projectName, standardEffortName）がデータ層で新たに必要

## Research Log

### 既存 CRUD パターン分析
- **Context**: 新規エンティティの CRUD API 設計にあたり、既存パターンとの整合性を確認
- **Sources Consulted**: `apps/backend/src/` 配下の businessUnits 実装一式
- **Findings**:
  - レイヤードアーキテクチャ（routes → services → data → transform → types）が確立済み
  - Zod スキーマから TypeScript 型を導出するパターンが統一されている
  - ソフトデリート・復元・参照チェックのパターンが標準化されている
  - `validate()` ユーティリティで RFC 9457 準拠のバリデーションエラーが自動生成される
  - グローバルエラーハンドラが HTTPException を RFC 9457 形式に変換する
- **Implications**: 新規実装は既存パターンをそのまま踏襲し、一貫性を維持する

### ネストされたルーティング設計
- **Context**: project_cases は projects の子リソースであり、URL 階層の設計が必要
- **Sources Consulted**: Hono v4 ドキュメント、既存 index.ts のマウント構造
- **Findings**:
  - 既存ルートはフラットマウント（`/business-units`, `/project-types`）
  - Hono では `app.route('/projects/:projectId/project-cases', projectCases)` によるネストマウントが可能
  - ただし、ネストマウント時にパスパラメータ `:projectId` はハンドラ内で `c.req.param('projectId')` で取得する
  - projects ルートが未実装のため、project-cases ルートを直接 index.ts にマウントする
- **Implications**: `app.route('/projects/:projectId/project-cases', projectCases)` の形式でマウント

### 外部キー JOIN 取得
- **Context**: 正規化されたテーブルから、API レスポンスに名称を含める必要がある
- **Sources Consulted**: テーブル仕様書（docs/database/table-spec.md）
- **Findings**:
  - project_cases.project_id → projects.name（案件名）
  - project_cases.standard_effort_id → standard_effort_masters.name（標準工数パターン名、NULL 許容）
  - LEFT JOIN を使用して standard_effort_masters を結合（NULL の場合があるため）
  - INNER JOIN を使用して projects を結合（必須外部キーのため）
- **Implications**: データ層の SELECT クエリに JOIN を追加し、行型に名称フィールドを含める

### calculationType のビジネスルール
- **Context**: calculationType が 'STANDARD' の場合の必須フィールド制約
- **Sources Consulted**: ドメイン概要（docs/domain/overview.md）、テーブル仕様書
- **Findings**:
  - calculationType = 'MANUAL': 手動で月次工数を入力（standardEffortId は不要）
  - calculationType = 'STANDARD': 標準工数パターンに基づいて自動展開（standardEffortId が必須）
  - DB の DEFAULT 値は 'MANUAL'
  - Zod の `superRefine` を使用してクロスフィールドバリデーションを実現可能
- **Implications**: サービス層で calculationType と standardEffortId の整合性チェックを実施

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存パターン踏襲 | businessUnits と同じレイヤードアーキテクチャ | 一貫性、学習コスト低、実績あり | ネストルーティングの追加が必要 | 採用 |

## Design Decisions

### Decision: ルーティング構造
- **Context**: project_cases は projects の子リソース
- **Alternatives Considered**:
  1. フラットルート `/project-cases` + クエリパラメータ `projectId`
  2. ネストルート `/projects/:projectId/project-cases`
- **Selected Approach**: ネストルート
- **Rationale**: REST の階層構造に従い、リソースの親子関係を URL で明示する。親の存在チェックも自然に組み込める
- **Trade-offs**: ルートマウントがやや複雑になるが、API の意味論が明確になる

### Decision: JOIN による名称取得
- **Context**: 正規化されたテーブルで外部キーの名称もレスポンスに含める
- **Alternatives Considered**:
  1. データ層で JOIN して1クエリで取得
  2. サービス層で別途クエリして合成
- **Selected Approach**: データ層で JOIN
- **Rationale**: 1クエリで完結しパフォーマンスが良い。データ層の責務（SQL 実行）に閉じる
- **Trade-offs**: SQL が複雑になるが、関連テーブルは2つのみで管理可能

### Decision: calculationType のバリデーション位置
- **Context**: calculationType = 'STANDARD' 時に standardEffortId が必須
- **Alternatives Considered**:
  1. Zod の superRefine でスキーマレベルバリデーション
  2. サービス層でビジネスルールとしてチェック
- **Selected Approach**: サービス層でビジネスルールとしてチェック
- **Rationale**: standardEffortId の存在確認（DB アクセス）もサービス層で行うため、関連するバリデーションを集約する。Zod では基本的な型・形式チェックのみ担当
- **Trade-offs**: Zod スキーマ単体では完全なバリデーションにならないが、責務の分離が明確になる

## Risks & Mitigations
- projects テーブルの CRUD API が未実装 → project_cases の親チェックはデータ層の直接クエリで対応
- standard_effort_masters のデータが未投入の可能性 → standardEffortId は任意フィールドとし、指定時のみ存在確認

## References
- Hono v4 ルーティング: 公式ドキュメント
- RFC 9457 Problem Details: https://www.rfc-editor.org/rfc/rfc9457
- 既存実装: `apps/backend/src/routes/businessUnits.ts`, `apps/backend/src/services/businessUnitService.ts`
