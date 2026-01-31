# Project Structure

## Organization Philosophy

**モノレポ + レイヤードアーキテクチャ**。アプリケーション層（`apps/`）と共有パッケージ層（`packages/`）を分離し、各アプリ内部はレイヤードパターンで責務を分割する。フロントエンドは機能ベース（feature-first）で構成する。

## Directory Patterns

### Monorepo Root
**Location**: `/`
**Purpose**: ワークスペース管理・共通設定
**Pattern**: `apps/` にアプリ、`packages/` に共有ライブラリ（現在は未使用）、`docs/` にドキュメント

### Backend Layers (apps/backend/src/)
**Purpose**: レイヤードアーキテクチャでリクエストからDBまでの責務を分離
**Pattern**:
- `routes/` → エンドポイント定義・リクエスト受付
- `services/` → ビジネスロジック（`[entity]Service.ts`）
- `data/` → DB アクセス・SQL 実行（`[entity]Data.ts`）
- `transform/` → DB 行 ↔ API レスポンス変換（`[entity]Transform.ts`）
- `types/` → Zod スキーマ・TypeScript 型定義（`[entity].ts`）
- `database/` → DB 接続設定
- `utils/` → 共有ユーティリティ
- `__tests__/` → テスト（ソース構造をミラー）

**Example**: `businessUnits` エンティティ →
`routes/businessUnits.ts` → `services/businessUnitService.ts` → `data/businessUnitData.ts` + `transform/businessUnitTransform.ts` + `types/businessUnit.ts`

### Frontend Features (apps/frontend/src/)
**Purpose**: 機能単位でコードを凝集し、機能間の依存を最小化
**Pattern**:
- `features/[feature]/` → api, components, hooks, stores, types を内包
- `features/[feature]/index.ts` → パブリック API のエクスポート
- `components/ui/` → shadcn/ui 等のデザインシステムプリミティブ
- `routes/` → TanStack Router のファイルベースルーティング（`routeTree.gen.ts` 自動生成）
- `styles/` → グローバルスタイル
- `lib/` → 共有ユーティリティ

### Documentation
**Location**: `docs/`
**Pattern**:
- `domain/` → ビジネスドメイン知識
- `database/` → DB スキーマ仕様
- `rules/` → 開発ルール・ガイドライン（フレームワーク別にサブディレクトリ）

### Specifications
**Location**: `.kiro/specs/`
**Purpose**: Kiro Spec-Driven Development の仕様管理
**Pattern**: `.kiro/specs/[feature-name]/` に requirements.md, design.md, tasks.md を配置

## Naming Conventions

- **ファイル（バックエンド）**: camelCase（`businessUnitService.ts`）
- **ファイル（フロントエンド）**: kebab-case for routes, PascalCase for components
- **DB テーブル**: snake_case・複数形（`business_units`）
- **DB カラム**: snake_case（`business_unit_code`）
- **API エンドポイント**: kebab-case・複数形（`/business-units`）
- **API レスポンスフィールド**: camelCase（`businessUnitCode`）
- **TypeScript 型**: PascalCase（`BusinessUnit`）
- **変数・関数**: camelCase（`businessUnitService`）
- **Zod スキーマ**: camelCase（`businessUnitSchema`）

## Import Organization

```typescript
// @ エイリアスによる絶対パスインポート
import { businessUnitService } from '@/services/businessUnitService'
import { BusinessUnit } from '@/types/businessUnit'

// 同一レイヤー内は相対パス可
import { toResponse } from './businessUnitTransform'
```

**Path Aliases**:
- `@/*` → `./src/*`（apps/backend, apps/frontend 共通）

## Code Organization Principles

- **レイヤー間の依存方向**: routes → services → data（逆方向禁止）
- **features 間の依存禁止**: 共有が必要な場合は `packages/` に抽出
- **Transform 層の独立**: DB の snake_case と API の camelCase の変換を一箇所に集約
- **Zod スキーマ中心**: 型定義・バリデーション・API ドキュメントの単一ソース

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
