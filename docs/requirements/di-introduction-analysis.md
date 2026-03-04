# DI（依存性の注入）導入検討 — @praha/diva 調査レポート

## 目次

1. [はじめに](#1-はじめに)
2. [DI（依存性の注入）とは何か？](#2-di依存性の注入とは何か)
3. [@praha/diva の概要](#3-prahadiva-の概要)
4. [現状のアーキテクチャ分析](#4-現状のアーキテクチャ分析)
5. [diva 導入のメリット](#5-diva-導入のメリット)
6. [diva 導入のデメリット・リスク](#6-diva-導入のデメリットリスク)
7. [モジュール構成 Before / After](#7-モジュール構成-before--after)
8. [代表的なコードサンプル Before / After](#8-代表的なコードサンプル-before--after)
9. [フロントエンドへの適用可能性](#9-フロントエンドへの適用可能性)
10. [総合評価](#10-総合評価)

---

## 1. はじめに

### このドキュメントの目的

本ドキュメントは、当リポジトリ（ops）のバックエンド・フロントエンドに対して **DI（Dependency Injection: 依存性の注入）** を導入することの是非を検討するものである。

具体的には、PrAha, Inc. が開発する軽量 DI ライブラリ **[@praha/diva](https://github.com/praha-inc/diva)** の導入を想定し、以下を明らかにする。

- DI を導入するメリット・デメリット
- モジュール構成がどう変わるか（Before / After）
- 実際のコードがどのように変わるか（具体例）
- フロントエンドへの適用可能性
- 総合的な導入判断の材料

> **前提**: 現状コードからの移行コストや後方互換性の維持は考慮対象外とし、一括置き換えを前提とする。

---

## 2. DI（依存性の注入）とは何か？

### 2.1 DI を一言で言うと

> 「あるモジュールが使う部品（依存先）を、そのモジュール自身が直接取りに行くのではなく、外部から渡してもらう設計パターン」

### 2.2 具体例で理解する

#### DI なし（現状のパターン）

```typescript
// projectService.ts
import { projectData } from "@/data/projectData";          // ← 自分で取りに行く
import { businessUnitData } from "@/data/businessUnitData"; // ← 自分で取りに行く

export const projectService = {
  async create(data) {
    const bu = await businessUnitData.findByCode(data.businessUnitCode);
    // ...
    const created = await projectData.create(data);
    return created;
  },
};
```

この書き方では、`projectService` が `projectData` と `businessUnitData` を**直接 import して使っている**。これは以下のことを意味する。

- `projectService` を使うとき、必ず本物の `projectData`（= 実際のDB接続）が必要
- テスト時にDBを使わずモックに差し替えたい場合、モジュールモック（`vi.mock()`）などの仕組みに頼る必要がある
- `projectData` の実装を切り替えたい場合（例: MSSQL → PostgreSQL）、import 元を書き換える必要がある

#### DI あり（diva を使ったパターン）

```typescript
// projectService.ts
import { projectDataContext, businessUnitDataContext } from "@/contexts";

export const projectService = {
  async create(data) {
    const buData = businessUnitDataContext(); // ← 外部から注入されたものを受け取る
    const pData = projectDataContext();       // ← 外部から注入されたものを受け取る

    const bu = await buData.findByCode(data.businessUnitCode);
    const created = await pData.create(data);
    return created;
  },
};
```

- `projectService` は「誰が `projectData` を提供するか」を知らない
- 実行時に本物を、テスト時にモックを、外部から注入できる
- 実装を差し替えたいときも、注入する側を変えるだけ

### 2.3 DI の 3 つのメリット（教科書的な説明）

| メリット | 説明 |
|----------|------|
| **テスト容易性** | 依存先をモックに差し替えて、単体テストが書きやすくなる |
| **疎結合** | モジュール間が interface（型）でのみ結合し、具体実装に依存しない |
| **差し替え容易性** | DB ドライバ、外部 API クライアントなどを環境に応じて切り替えやすい |

### 2.4 DI の本質的な注意点

DI は「万能薬」ではない。以下のケースでは DI が逆にコードを複雑にする。

| 注意点 | 説明 |
|--------|------|
| **間接参照の増加** | コードを読むとき「実際にどの実装が動くのか」を追うのが難しくなる |
| **ボイラープレートの増加** | Context の定義、Provider の設定、型定義など、記述量が増える |
| **過剰設計のリスク** | 差し替える予定がないものまで DI 化すると、不要な複雑さが生まれる |

---

## 3. @praha/diva の概要

### 3.1 基本情報

| 項目 | 内容 |
|------|------|
| パッケージ名 | `@praha/diva` |
| バージョン | 1.0.2（2026年2月時点） |
| ライセンス | MIT |
| 開発元 | PrAha, Inc. |
| GitHub | https://github.com/praha-inc/diva |
| ソースサイズ | 約 150 行（非常に軽量） |

### 3.2 設計思想

diva は以下の思想に基づいている。

- **デコレータ不要** — クラスデコレータ（`@Injectable()` 等）を使わない
- **関数型** — `createContext()` が返すタプル `[resolver, provider]` を組み合わせる
- **AsyncLocalStorage ベース** — Node.js の `AsyncLocalStorage` を利用し、非同期処理でもスコープが維持される
- **型安全** — TypeScript ネイティブで型推論が効く

### 3.3 コア API

#### `createContext<T>()`

依存の定義と注入の基本単位。`[resolver, provider]` のタプルを返す。

```typescript
import { createContext } from '@praha/diva';

// 型を指定して Context を作成
const [getDatabase, withDatabase] = createContext<Database>();

// getDatabase: () => Database  — 依存を解決（取得）する関数
// withDatabase: Provider       — 依存を提供するスコープを作る関数
```

#### Provider（スコープの作成）

```typescript
// ファクトリ関数とスコープ関数を渡す
withDatabase(() => new Database(), () => {
  // このスコープ内で getDatabase() が使える
  const db = getDatabase(); // Database インスタンスを取得
});
```

**デフォルト動作（スコープド）**: 同一スコープ内で何度呼んでも同じインスタンスが返る。

```typescript
withDatabase(() => new Database(), () => {
  const db1 = getDatabase();
  const db2 = getDatabase();
  console.log(db1 === db2); // true（キャッシュされる）
});
```

**トランジェント**: 毎回新しいインスタンスが必要な場合。

```typescript
withDatabase.transient(() => new Database(), () => {
  const db1 = getDatabase();
  const db2 = getDatabase();
  console.log(db1 === db2); // false（毎回生成される）
});
```

#### `withContexts()`（複数コンテキストの合成）

複数の Provider をまとめて適用する。

```typescript
import { createContext, withContexts } from '@praha/diva';

const [getDB, withDB] = createContext<Database>();
const [getLogger, withLogger] = createContext<Logger>();

withContexts([
  withDB(() => new Database()),
  withLogger(() => new Logger()),
], () => {
  const db = getDB();
  const log = getLogger();
  // 両方使える
});
```

#### `mockContext()`（テスト用）

テスト時にモックを注入する。Provider スコープが不要。

```typescript
import { mockContext } from '@praha/diva/test';

// スコープドモック（同じインスタンスが返る）
mockContext(withDatabase, () => new MockDatabase());
const db = getDatabase(); // MockDatabase

// トランジェントモック（毎回新しいインスタンス）
mockContext.transient(withDatabase, () => new MockDatabase());
```

### 3.4 AsyncLocalStorage と非同期安全性

diva の内部は Node.js の `AsyncLocalStorage` を使用している。これにより：

- **HTTP リクエスト単位でスコープが分離される** — サーバーで複数リクエストが同時に処理されても、各リクエストは独自のコンテキストを持つ
- **async/await を跨いでもスコープが維持される** — `await` の前後で同じインスタンスが返る

```
リクエストA → withContexts([...providers]) → Service → Data → DB（スコープA）
リクエストB → withContexts([...providers]) → Service → Data → DB（スコープB）
// 互いに干渉しない
```

### 3.5 重要な制約: ブラウザ非対応

`AsyncLocalStorage` は **Node.js 専用 API** である。ブラウザ環境（= フロントエンド SPA）では動作しない。

→ **diva はバックエンド（Hono サーバー）専用** と考えるのが現実的。

---

## 4. 現状のアーキテクチャ分析

### 4.1 バックエンドの依存関係

```
┌─────────────────────────────────────────────────────────────┐
│                      Routes（HTTP層）                        │
│  projects.ts, businessUnits.ts, ...                         │
│  ・Hono ルートハンドラ                                       │
│  ・Zod バリデーション                                        │
│  ・import { projectService } from "@/services/..."          │
└───────────────────────────┬─────────────────────────────────┘
                            │ 直接 import
┌───────────────────────────▼─────────────────────────────────┐
│                    Services（ビジネスロジック層）              │
│  projectService.ts, businessUnitService.ts, ...             │
│  ・FK バリデーション                                         │
│  ・重複チェック                                              │
│  ・import { projectData } from "@/data/..."                 │
│  ・import { businessUnitData } from "@/data/..."  ← 他の Data も直接 import│
│  ・import { toProjectResponse } from "@/transform/..."      │
└───────────────────────────┬─────────────────────────────────┘
                            │ 直接 import
┌───────────────────────────▼─────────────────────────────────┐
│                      Data（データアクセス層）                  │
│  projectData.ts, businessUnitData.ts, ...                   │
│  ・SQL クエリ実行                                            │
│  ・import { getPool } from "@/database/client"              │
└───────────────────────────┬─────────────────────────────────┘
                            │ 直接 import
┌───────────────────────────▼─────────────────────────────────┐
│                    Database（接続管理）                       │
│  client.ts                                                  │
│  ・MSSQL ConnectionPool シングルトン                         │
│  ・環境変数から設定を読み込み                                 │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 現状の依存パターンの特徴

#### 特徴1: モジュールレベルのシングルトン（ES Module Singleton）

```typescript
// data/businessUnitData.ts
export const businessUnitData = {
  async findAll(params) { ... },
  async findByCode(code) { ... },
  // ...
};
```

各 Data/Service は `export const` でオブジェクトリテラルとして公開されている。ES Module のキャッシュ機構により、実質的にシングルトンとして動作する。

#### 特徴2: 直接 import による密結合

```typescript
// services/projectService.ts
import { projectData } from "@/data/projectData";           // ← 具体実装に直接依存
import { businessUnitData } from "@/data/businessUnitData"; // ← 他のリソースの Data にも直接依存
import { projectTypeData } from "@/data/projectTypeData";   // ← さらに別のリソースにも
```

`projectService` は 3 つの Data モジュールを**ファイルパスを指定して**直接 import している。テスト時に差し替えるには `vi.mock()` 等のモジュールモックが必要。

#### 特徴3: DB接続のグローバルシングルトン

```typescript
// database/client.ts
let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
  }
  return pool;
}
```

モジュールスコープの変数 `pool` で接続を管理。典型的なシングルトンパターン。

#### 特徴4: レイヤー間の契約が暗黙的

Data 層のインターフェースは型として明示的に定義されておらず、オブジェクトリテラルの形状から推論される。

```typescript
// businessUnitData の「暗黙のインターフェース」
{
  findAll(params): Promise<{ items: BusinessUnitRow[]; totalCount: number }>;
  findByCode(code: string): Promise<BusinessUnitRow | undefined>;
  findByCodeIncludingDeleted(code: string): Promise<BusinessUnitRow | undefined>;
  create(data): Promise<BusinessUnitRow>;
  update(code: string, data): Promise<BusinessUnitRow | undefined>;
  softDelete(code: string): Promise<BusinessUnitRow | undefined>;
  restore(code: string): Promise<BusinessUnitRow | undefined>;
  hasReferences(code: string): Promise<boolean>;
}
```

### 4.3 フロントエンドの依存関係

```
┌────────────────────────────────────────────────────────────────┐
│                     Routes（ページコンポーネント）               │
│  routes/master/business-units/index.tsx, new.tsx, edit.tsx     │
│  ・useQuery(businessUnitsQueryOptions(...))                    │
│  ・useCreateBusinessUnit()                                     │
└───────────────────────────┬────────────────────────────────────┘
                            │ import
┌───────────────────────────▼────────────────────────────────────┐
│                 Features（機能モジュール）                       │
│  features/business-units/api/queries.ts                        │
│  features/business-units/api/mutations.ts                      │
│  features/business-units/api/api-client.ts                     │
│  ・createCrudClient<T>(...) で CRUD クライアント生成            │
│  ・createQueryKeys / createCrudMutations でフック生成           │
└───────────────────────────┬────────────────────────────────────┘
                            │ import
┌───────────────────────────▼────────────────────────────────────┐
│                     lib/api（共通インフラ）                      │
│  client.ts, crud-client-factory.ts, query-key-factory.ts      │
│  mutation-hooks-factory.ts                                     │
│  ・fetch() ベースの HTTP クライアント                            │
│  ・TanStack Query 統合                                         │
└────────────────────────────────────────────────────────────────┘
```

フロントエンドは既にファクトリパターンで抽象化されており、DI の恩恵は相対的に小さい（後述）。

---

## 5. diva 導入のメリット

### 5.1 テスト容易性の大幅な向上

**現状の課題:**

バックエンドのサービス層をテストするには、`vi.mock()` で Data 層全体をモックする必要がある。

```typescript
// 現状: vi.mock() によるモジュールモック
vi.mock("@/data/projectData", () => ({
  projectData: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    // ... 全メソッドをモック
  },
}));

vi.mock("@/data/businessUnitData", () => ({
  businessUnitData: {
    findByCode: vi.fn(),
  },
}));
```

この方式の問題点:
- モジュールパスの文字列指定はタイポに弱い
- モック定義が型チェックされにくい
- テストファイルのトップレベルに `vi.mock()` が散らばる
- モックのリセット・状態管理が煩雑

**diva 導入後:**

```typescript
import { mockContext } from '@praha/diva/test';
import { withProjectData, withBusinessUnitData } from '@/contexts';

// 型安全なモック注入
mockContext(withProjectData, () => ({
  findAll: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  findById: vi.fn().mockResolvedValue(mockProject),
  create: vi.fn().mockResolvedValue(mockProject),
  // 型チェックにより不足メソッドがコンパイルエラーになる
}));

mockContext(withBusinessUnitData, () => ({
  findByCode: vi.fn().mockResolvedValue(mockBusinessUnit),
}));

// テスト実行 — Provider スコープ不要
const result = await projectService.create(input);
expect(result).toEqual(expected);
```

メリット:
- 型安全（インターフェースの不一致がコンパイル時に検出される）
- `vi.mock()` のモジュールパス文字列指定が不要
- テストの意図が明確

### 5.2 レイヤー間の契約が明示化される

diva を導入すると、各レイヤーのインターフェースを型として明示的に定義する動機が生まれる。

```typescript
// types/data-interfaces.ts
export interface BusinessUnitDataPort {
  findAll(params: FindAllParams): Promise<PaginatedResult<BusinessUnitRow>>;
  findByCode(code: string): Promise<BusinessUnitRow | undefined>;
  findByCodeIncludingDeleted(code: string): Promise<BusinessUnitRow | undefined>;
  create(data: CreateBusinessUnit): Promise<BusinessUnitRow>;
  update(code: string, data: UpdateBusinessUnit): Promise<BusinessUnitRow | undefined>;
  softDelete(code: string): Promise<BusinessUnitRow | undefined>;
  restore(code: string): Promise<BusinessUnitRow | undefined>;
  hasReferences(code: string): Promise<boolean>;
}
```

これにより:
- Data 層の仕様が型として文書化される
- Service 層は型（Port）にのみ依存し、具体実装を知らない
- DB を差し替える際のインターフェース互換性が保証される

### 5.3 非同期スコープによるリクエスト単位のリソース管理

diva の `AsyncLocalStorage` ベースのスコープは、Hono のミドルウェアと自然に統合できる。

```typescript
// リクエストごとにスコープを作成
app.use("*", async (c, next) => {
  await withContexts([
    withPool(() => getPool()),
    withLogger(() => createRequestLogger(c.req)),
    withAuth(() => extractAuth(c.req)),
  ], () => next());
});
```

これにより:
- リクエスト単位でのロガー設定（リクエストIDの自動付与等）
- 将来的なトランザクション管理の基盤
- 認証情報のスコープ伝播（Context の引き回しが不要）

### 5.4 環境別の実装切り替えが容易

```typescript
// production 環境
withContexts([
  withPool(() => createMssqlPool(productionConfig)),
  withMailer(() => new SendGridMailer()),
], () => startServer());

// development 環境
withContexts([
  withPool(() => createMssqlPool(devConfig)),
  withMailer(() => new ConsoleMailer()), // メール送信の代わりにコンソール出力
], () => startServer());

// テスト環境 — mockContext で一括注入
mockContext(withPool, () => createInMemoryDb());
mockContext(withMailer, () => new NoopMailer());
```

### 5.5 ライブラリの軽量さ

diva は約 150 行の実装で、依存ライブラリもない。

- バンドルサイズへの影響が最小限
- API がシンプルで学習コストが低い
- メンテナンスリスクが低い（シンプルゆえに壊れにくい）

---

## 6. diva 導入のデメリット・リスク

### 6.1 ブラウザ環境で使えない（フロントエンド非対応）

**これは最も重要な制約である。**

diva は `AsyncLocalStorage`（Node.js API）に依存しており、ブラウザ環境では動作しない。当プロジェクトのフロントエンドは Vite + React の SPA であり、diva は使用できない。

→ DI をバックエンドとフロントエンドで統一的に適用することはできない。

### 6.2 間接参照によるコードの読みにくさ

**現状:**

```typescript
import { projectData } from "@/data/projectData";
// ↑ Cmd+Click で即座に実装にジャンプできる
```

**diva 導入後:**

```typescript
const pData = projectDataContext();
// ↑ 「この関数を呼ぶと何が返るのか？」 は実行時の Provider 設定に依存する
// ↑ IDE での定義ジャンプが「型定義」に飛び、「具体実装」には直接飛べない
```

特に DI に不慣れな開発者にとって、「このコードが実行されるとき、どの実装が使われるのか」を追跡するのが難しくなる。

### 6.3 ボイラープレートの増加

DI 導入により、以下の追加コードが必要になる:

1. **インターフェース定義**（各 Data / Service の Port 型） — 約 20 ファイル
2. **Context 定義**（`createContext()` の呼び出し） — 約 20 定義
3. **Provider 設定**（ミドルウェアまたはエントリポイントでの注入） — 1 ファイル
4. **テスト用モック設定**（`mockContext()` のセットアップ） — テストファイルごと

現在の 22 サービス × 24 Data で、概算で **40〜60 の Context 定義 + 同数のインターフェース定義** が追加される。

### 6.4 現時点でのテスト戦略との整合性

**現状のテスト状況:**

調査の結果、バックエンドには `__tests__/` ディレクトリは存在するが、サービス層の単体テストがどの程度整備されているかは限定的に見える。

DI の最大の恩恵は「テスト容易性」だが、もしテストを積極的に書く文化・計画がなければ、DI 導入のコストに見合わない可能性がある。

### 6.5 エコシステムの成熟度

| 観点 | 評価 |
|------|------|
| npm ダウンロード数 | 少ない（新しいライブラリ） |
| GitHub スター数 | 発展途上 |
| ドキュメント | README のみ（詳細なガイドは未整備） |
| コミュニティ | 小規模 |
| メンテナンス | アクティブだが、1人の開発者に依存 |

対比として、Inversify や TSyringe などの成熟した DI ライブラリはコミュニティが大きいが、デコレータベースで diva とは設計思想が異なる。

### 6.6 AsyncLocalStorage のパフォーマンス影響

`AsyncLocalStorage` はゼロコストではない。各コンテキスト切り替え時にオーバーヘッドが発生する。
ただし、当プロジェクトの規模（社内業務ツール）では、このオーバーヘッドが問題になる可能性は極めて低い。

### 6.7 「過剰設計」のリスク

当プロジェクトの特徴:
- 社内業務アプリ（外部公開なし）
- DB は MSSQL 固定（切り替え予定なし）
- API は Hono 固定
- チーム規模は比較的小さい

このような状況では:
- DB 実装の差し替えは現実的に起こりにくい
- 外部サービスの差し替えも限定的
- DI で得られる「柔軟性」が実際に活かされる場面が少ない可能性がある

---

## 7. モジュール構成 Before / After

### 7.1 バックエンド Before（現状）

```
apps/backend/src/
├── index.ts                 # Hono アプリ初期化・ルート登録
├── routes/
│   ├── projects.ts          # import { projectService } from "@/services/..."
│   └── businessUnits.ts     # import { businessUnitService } from "@/services/..."
├── services/
│   ├── projectService.ts    # import { projectData } from "@/data/..."
│   │                        # import { businessUnitData } from "@/data/..."
│   └── businessUnitService.ts # import { businessUnitData } from "@/data/..."
├── data/
│   ├── projectData.ts       # import { getPool } from "@/database/client"
│   └── businessUnitData.ts  # import { getPool } from "@/database/client"
├── transform/
│   ├── projectTransform.ts
│   └── businessUnitTransform.ts
├── types/
│   ├── project.ts           # Zod スキーマ + 型定義
│   └── businessUnit.ts
├── database/
│   └── client.ts            # グローバル ConnectionPool
└── utils/
    ├── responseHelper.ts
    └── errorHelper.ts
```

**依存の流れ:**
```
routes → services → data → database/client
         ↓ (transform)
         transform
```

各モジュール間は **ファイルパス指定の直接 import** で結合。

### 7.2 バックエンド After（diva 導入後）

```
apps/backend/src/
├── index.ts                 # Hono アプリ初期化 + DI Provider 設定
├── contexts/                # ★ 新規: DI Context 定義
│   ├── index.ts             # 全 Context の re-export
│   ├── database.ts          # [getPool, withPool] = createContext<ConnectionPool>()
│   ├── data/
│   │   ├── project.ts       # [projectDataCtx, withProjectData] = createContext<ProjectDataPort>()
│   │   └── businessUnit.ts  # [businessUnitDataCtx, withBusinessUnitData] = createContext<BusinessUnitDataPort>()
│   └── services/
│       ├── project.ts       # [projectServiceCtx, withProjectService] = createContext<ProjectServicePort>()
│       └── businessUnit.ts  # [businessUnitServiceCtx, withBusinessUnitService] = createContext<BusinessUnitServicePort>()
├── ports/                   # ★ 新規: インターフェース定義
│   ├── index.ts
│   ├── data/
│   │   ├── project.ts       # export interface ProjectDataPort { ... }
│   │   └── businessUnit.ts  # export interface BusinessUnitDataPort { ... }
│   └── services/
│       ├── project.ts       # export interface ProjectServicePort { ... }
│       └── businessUnit.ts  # export interface BusinessUnitServicePort { ... }
├── providers/               # ★ 新規: Provider 設定（アプリ起動時の DI 構成）
│   └── index.ts             # withContexts([...]) の一括設定
├── routes/
│   ├── projects.ts          # import { projectServiceCtx } from "@/contexts"
│   └── businessUnits.ts     # ← Service の Context を resolve するだけ
├── services/
│   ├── projectService.ts    # import { projectDataCtx, businessUnitDataCtx } from "@/contexts"
│   └── businessUnitService.ts  # ← Data の Context を resolve するだけ
├── data/
│   ├── projectData.ts       # import { getPool } from "@/contexts" ← Pool も Context 経由
│   └── businessUnitData.ts
├── transform/               # 変更なし
├── types/                   # 変更なし
├── database/
│   └── client.ts            # ConnectionPool 生成ロジック（export は Provider 経由で使用）
└── utils/                   # 変更なし
```

**新規追加ディレクトリ:**

| ディレクトリ | 役割 | ファイル数（概算） |
|-------------|------|-------------------|
| `contexts/` | `createContext()` の定義 | 20〜30 |
| `ports/` | インターフェース（型）定義 | 20〜30 |
| `providers/` | Provider の一括設定 | 1〜3 |

### 7.3 依存関係の変化

```
Before:
routes ──import──▶ services ──import──▶ data ──import──▶ database/client
（具体実装に直接依存）

After:
routes ──resolve──▶ contexts ◀──register── providers
services ──resolve──▶ contexts              │
data ──resolve──▶ contexts                  │
                                            ▼
                              providers が「具体実装」と「Context」を紐付ける
```

**Before**: 各モジュールが「下位レイヤーの具体実装ファイル」を直接知っている
**After**: 各モジュールは「Context（型）」だけを知り、「何が注入されるか」は Provider が決める

---

## 8. 代表的なコードサンプル Before / After

### 8.1 DB接続管理

#### Before

```typescript
// database/client.ts
import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
  pool: { min: 0, max: 10 },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
  }
  return pool;
}
```

#### After

```typescript
// ports/database.ts — インターフェース定義
import type sql from "mssql";

export type PoolProvider = () => Promise<sql.ConnectionPool>;

// contexts/database.ts — Context 定義
import { createContext } from "@praha/diva";
import type { PoolProvider } from "@/ports/database";

export const [getPool, withPool] = createContext<PoolProvider>();

// database/client.ts — 具体実装（変更は最小限）
import sql from "mssql";

const config: sql.config = { /* 同じ */ };

let pool: sql.ConnectionPool | null = null;

export const mssqlPoolProvider = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
  }
  return pool;
};
```

### 8.2 Data 層（businessUnitData）

#### Before

```typescript
// data/businessUnitData.ts
import sql from "mssql";
import { getPool } from "@/database/client";  // ← 直接 import
import type { BusinessUnitRow } from "@/types/businessUnit";

export const businessUnitData = {
  async findByCode(code: string): Promise<BusinessUnitRow | undefined> {
    const pool = await getPool();  // ← グローバルシングルトンを取得
    const result = await pool
      .request()
      .input("code", sql.VarChar, code)
      .query<BusinessUnitRow>(
        `SELECT business_unit_code, name, display_order, created_at, updated_at, deleted_at
         FROM business_units
         WHERE business_unit_code = @code AND deleted_at IS NULL`,
      );
    return result.recordset[0];
  },
  // ... 他のメソッド
};
```

#### After

```typescript
// ports/data/businessUnit.ts — インターフェース定義
import type { BusinessUnitRow, CreateBusinessUnit, UpdateBusinessUnit } from "@/types/businessUnit";

export interface BusinessUnitDataPort {
  findAll(params: {
    page: number;
    pageSize: number;
    includeDisabled: boolean;
  }): Promise<{ items: BusinessUnitRow[]; totalCount: number }>;
  findByCode(code: string): Promise<BusinessUnitRow | undefined>;
  findByCodeIncludingDeleted(code: string): Promise<BusinessUnitRow | undefined>;
  create(data: CreateBusinessUnit): Promise<BusinessUnitRow>;
  update(code: string, data: UpdateBusinessUnit): Promise<BusinessUnitRow | undefined>;
  softDelete(code: string): Promise<BusinessUnitRow | undefined>;
  restore(code: string): Promise<BusinessUnitRow | undefined>;
  hasReferences(code: string): Promise<boolean>;
}

// contexts/data/businessUnit.ts — Context 定義
import { createContext } from "@praha/diva";
import type { BusinessUnitDataPort } from "@/ports/data/businessUnit";

export const [businessUnitDataCtx, withBusinessUnitData] =
  createContext<BusinessUnitDataPort>();

// data/businessUnitData.ts — 具体実装
import sql from "mssql";
import { getPool } from "@/contexts/database";  // ← Context 経由で取得
import type { BusinessUnitDataPort } from "@/ports/data/businessUnit";

export const businessUnitData: BusinessUnitDataPort = {
  async findByCode(code: string) {
    const pool = await getPool()();  // getPool() は PoolProvider を返す
    const result = await pool
      .request()
      .input("code", sql.VarChar, code)
      .query(
        `SELECT business_unit_code, name, display_order, created_at, updated_at, deleted_at
         FROM business_units
         WHERE business_unit_code = @code AND deleted_at IS NULL`,
      );
    return result.recordset[0];
  },
  // ... 他のメソッド（実装は同じ、型注釈が追加されるのみ）
};
```

### 8.3 Service 層（projectService）

#### Before

```typescript
// services/projectService.ts
import { HTTPException } from "hono/http-exception";
import { businessUnitData } from "@/data/businessUnitData";  // ← 直接 import
import { projectData } from "@/data/projectData";            // ← 直接 import
import { projectTypeData } from "@/data/projectTypeData";    // ← 直接 import
import { toProjectResponse } from "@/transform/projectTransform";
import type { CreateProject, Project } from "@/types/project";

export const projectService = {
  async create(data: CreateProject): Promise<Project> {
    // businessUnitCode の存在チェック
    const bu = await businessUnitData.findByCode(data.businessUnitCode);
    if (!bu) {
      throw new HTTPException(422, {
        message: `Business unit with code '${data.businessUnitCode}' not found`,
      });
    }

    // projectTypeCode の存在チェック（指定された場合）
    if (data.projectTypeCode) {
      const pt = await projectTypeData.findByCode(data.projectTypeCode);
      if (!pt) {
        throw new HTTPException(422, {
          message: `Project type with code '${data.projectTypeCode}' not found`,
        });
      }
    }

    // projectCode の重複チェック
    const existing = await projectData.findByProjectCode(data.projectCode);
    if (existing) {
      throw new HTTPException(409, {
        message: `Project with code '${data.projectCode}' already exists`,
      });
    }

    const created = await projectData.create(data);
    return toProjectResponse(created);
  },
  // ... 他のメソッド
};
```

#### After

```typescript
// services/projectService.ts
import { HTTPException } from "hono/http-exception";
import { businessUnitDataCtx } from "@/contexts/data/businessUnit";  // ← Context を resolve
import { projectDataCtx } from "@/contexts/data/project";            // ← Context を resolve
import { projectTypeDataCtx } from "@/contexts/data/projectType";    // ← Context を resolve
import { toProjectResponse } from "@/transform/projectTransform";
import type { CreateProject, Project } from "@/types/project";

export const projectService = {
  async create(data: CreateProject): Promise<Project> {
    const buData = businessUnitDataCtx();  // ← 注入された実装を取得
    const pData = projectDataCtx();        // ← 注入された実装を取得
    const ptData = projectTypeDataCtx();   // ← 注入された実装を取得

    // businessUnitCode の存在チェック
    const bu = await buData.findByCode(data.businessUnitCode);
    if (!bu) {
      throw new HTTPException(422, {
        message: `Business unit with code '${data.businessUnitCode}' not found`,
      });
    }

    // projectTypeCode の存在チェック（指定された場合）
    if (data.projectTypeCode) {
      const pt = await ptData.findByCode(data.projectTypeCode);
      if (!pt) {
        throw new HTTPException(422, {
          message: `Project type with code '${data.projectTypeCode}' not found`,
        });
      }
    }

    // projectCode の重複チェック
    const existing = await pData.findByProjectCode(data.projectCode);
    if (existing) {
      throw new HTTPException(409, {
        message: `Project with code '${data.projectCode}' already exists`,
      });
    }

    const created = await pData.create(data);
    return toProjectResponse(created);
  },
  // ... 他のメソッド
};
```

### 8.4 Route 層

#### Before

```typescript
// routes/projects.ts
import { Hono } from "hono";
import { projectService } from "@/services/projectService";  // ← 直接 import
// ...

const app = new Hono()
  .get("/", validate("query", projectListQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const result = await projectService.findAll({ /* ... */ });
    return c.json(buildPaginatedResponse(result, params), 200);
  })
  // ...
```

#### After

```typescript
// routes/projects.ts
import { Hono } from "hono";
import { projectServiceCtx } from "@/contexts/services/project";  // ← Context を resolve
// ...

const app = new Hono()
  .get("/", validate("query", projectListQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const service = projectServiceCtx();  // ← 注入された Service を取得
    const result = await service.findAll({ /* ... */ });
    return c.json(buildPaginatedResponse(result, params), 200);
  })
  // ...
```

### 8.5 Provider の設定（アプリ起動時）

```typescript
// providers/index.ts
import { withContexts } from "@praha/diva";
import { withPool } from "@/contexts/database";
import { withBusinessUnitData } from "@/contexts/data/businessUnit";
import { withProjectData } from "@/contexts/data/project";
import { withProjectTypeData } from "@/contexts/data/projectType";
import { withProjectService } from "@/contexts/services/project";
import { withBusinessUnitService } from "@/contexts/services/businessUnit";
// ... 他の Context

import { mssqlPoolProvider } from "@/database/client";
import { businessUnitData } from "@/data/businessUnitData";
import { projectData } from "@/data/projectData";
import { projectTypeData } from "@/data/projectTypeData";
import { projectService } from "@/services/projectService";
import { businessUnitService } from "@/services/businessUnitService";
// ... 他の具体実装

export function createAppProviders() {
  return withContexts([
    // Database
    withPool(() => mssqlPoolProvider),

    // Data 層
    withBusinessUnitData(() => businessUnitData),
    withProjectData(() => projectData),
    withProjectTypeData(() => projectTypeData),
    // ... 他の Data

    // Service 層
    withProjectService(() => projectService),
    withBusinessUnitService(() => businessUnitService),
    // ... 他の Service
  ]);
}
```

```typescript
// index.ts（Hono アプリ起動）
import { Hono } from "hono";
import { createAppProviders } from "@/providers";

const app = new Hono().basePath("/api/ops");

// 全リクエストに DI スコープを適用
app.use("*", async (c, next) => {
  await createAppProviders()(() => next());
});

// ルート登録（従来通り）
app.route("/business-units", businessUnits);
app.route("/projects", projects);
// ...
```

### 8.6 テストコード

#### Before（vi.mock）

```typescript
// __tests__/services/projectService.test.ts
import { vi, describe, it, expect } from "vitest";

vi.mock("@/data/projectData", () => ({
  projectData: {
    findByProjectCode: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/data/businessUnitData", () => ({
  businessUnitData: {
    findByCode: vi.fn(),
  },
}));

vi.mock("@/data/projectTypeData", () => ({
  projectTypeData: {
    findByCode: vi.fn(),
  },
}));

import { projectData } from "@/data/projectData";
import { businessUnitData } from "@/data/businessUnitData";
import { projectService } from "@/services/projectService";

describe("projectService.create", () => {
  it("should create a project", async () => {
    (businessUnitData.findByCode as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ business_unit_code: "BU001" });
    (projectData.findByProjectCode as ReturnType<typeof vi.fn>)
      .mockResolvedValue(undefined);
    (projectData.create as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ project_id: 1, project_code: "P001", /* ... */ });

    const result = await projectService.create({
      projectCode: "P001",
      name: "テスト案件",
      businessUnitCode: "BU001",
      // ...
    });

    expect(result.projectCode).toBe("P001");
  });
});
```

#### After（mockContext）

```typescript
// __tests__/services/projectService.test.ts
import { describe, it, expect, vi } from "vitest";
import { mockContext } from "@praha/diva/test";
import { withProjectData } from "@/contexts/data/project";
import { withBusinessUnitData } from "@/contexts/data/businessUnit";
import { withProjectTypeData } from "@/contexts/data/projectType";
import { projectService } from "@/services/projectService";

describe("projectService.create", () => {
  it("should create a project", async () => {
    // 型安全なモック注入
    mockContext(withBusinessUnitData, () => ({
      findByCode: vi.fn().mockResolvedValue({ business_unit_code: "BU001" }),
      findByCodeIncludingDeleted: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      hasReferences: vi.fn(),
    }));

    mockContext(withProjectData, () => ({
      findByProjectCode: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({
        project_id: 1, project_code: "P001", name: "テスト案件",
        business_unit_code: "BU001", /* ... */
      }),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByIdIncludingDeleted: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      hasReferences: vi.fn(),
    }));

    mockContext(withProjectTypeData, () => ({
      findByCode: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      hasReferences: vi.fn(),
      findByCodeIncludingDeleted: vi.fn(),
    }));

    const result = await projectService.create({
      projectCode: "P001",
      name: "テスト案件",
      businessUnitCode: "BU001",
      startYearMonth: "202601",
      totalManhour: 100,
      status: "active",
    });

    expect(result.projectCode).toBe("P001");
  });
});
```

> **注意**: mockContext を使う場合、インターフェース全体を満たすモックオブジェクトが必要。テストで使わないメソッドも定義する必要がある点は、`vi.mock()` と比較してやや冗長。ただし `Partial` や ヘルパー関数で緩和できる。

---

## 9. フロントエンドへの適用可能性

### 9.1 結論: diva はフロントエンドに適用できない

前述の通り、diva は `AsyncLocalStorage`（Node.js API）に依存しており、ブラウザ環境では動作しない。

### 9.2 フロントエンドは既に「DI 的」な設計になっている

当プロジェクトのフロントエンドは、以下の仕組みで実質的に DI パターンを実現している。

| 機能 | DI に相当する仕組み |
|------|---------------------|
| API クライアントの差し替え | `createCrudClient<T>()` ファクトリパターン |
| 状態管理の注入 | React Context + TanStack Query Provider |
| テスト時のモック | MSW（Mock Service Worker）で API レベルでモック |
| コンポーネントの依存注入 | props / hooks パターン |

React のエコシステムでは、DI コンテナよりも **React Context + hooks + MSW** の組み合わせが主流であり、diva の導入は不要と判断する。

### 9.3 フロントエンドで DI が必要になるケース

将来的に以下のような要件が出た場合は、フロントエンド用の DI を再検討してもよい。

- SSR（Server-Side Rendering）の導入 → リクエスト単位のスコープが必要になる
- Web Worker での処理分離 → ワーカーコンテキストでの依存管理
- プラグインシステム → 動的な実装の差し替え

ただし、現時点では SPA 構成であり、上記の要件は見込まれない。

---

## 10. 総合評価

### 10.1 評価マトリクス

| 評価項目 | 重み | 評価 | コメント |
|----------|------|------|----------|
| テスト容易性 | 高 | ★★★★☆ | mockContext による型安全なモック注入は魅力的 |
| コードの可読性 | 高 | ★★☆☆☆ | 間接参照の増加により、コードの追跡が難しくなる |
| 学習コスト | 中 | ★★★★☆ | diva の API はシンプルで学びやすい |
| ボイラープレート | 中 | ★★☆☆☆ | Context・Port の定義が大量に必要 |
| 将来の柔軟性 | 低 | ★★★★☆ | 実装の差し替えが容易になる（が、現時点で需要は低い） |
| ライブラリの安定性 | 中 | ★★★☆☆ | 軽量で壊れにくいが、コミュニティは小さい |
| フロントエンド統一性 | 高 | ★☆☆☆☆ | ブラウザ非対応のため、統一的な DI は不可能 |
| 現状との親和性 | 高 | ★★★☆☆ | 既存の3層アーキテクチャとは自然に統合できる |

### 10.2 推奨判断

#### バックエンドへの導入: 条件付き推奨

**推奨するケース:**
- サービス層の単体テストを本格的に整備する計画がある場合
- 将来的に DB の切り替え（例: テスト用の SQLite）やリポジトリパターンの導入を予定している場合
- チームメンバーが DI の概念を理解し、受け入れる土壌がある場合

**推奨しないケース:**
- テストは E2E テストが主で、サービス層の単体テストの優先度が低い場合
- チームが小規模で、コードの直接的な読みやすさを重視する場合
- 現状の `vi.mock()` ベースのテストで十分な場合

#### フロントエンドへの導入: 非推奨

ブラウザ環境で動作しないため、導入不可。既存の React Context + hooks + MSW パターンで十分。

### 10.3 導入する場合の推奨アプローチ

**段階的導入（推奨）:**

1. **Phase 1**: `database/client.ts` の `getPool` を Context 化（影響範囲が小さく、効果を検証しやすい）
2. **Phase 2**: 1〜2 つのリソース（例: `businessUnit`）で Data 層を Context 化し、単体テストを整備
3. **Phase 3**: 効果を検証した上で、残りのリソースに展開

**一括導入（本ドキュメントの前提だが非推奨）:**

22 サービス × 24 Data を一括で Context 化すると、大量のボイラープレートが一度に発生し、レビュー負荷が高い。

### 10.4 代替案

diva を導入しなくても、以下のアプローチでテスト容易性を向上させることができる。

#### 代替案 A: 関数引数による DI（最もシンプル）

```typescript
// services/projectService.ts
export function createProjectService(deps: {
  projectData: ProjectDataPort;
  businessUnitData: BusinessUnitDataPort;
  projectTypeData: ProjectTypeDataPort;
}) {
  return {
    async create(data: CreateProject): Promise<Project> {
      const bu = await deps.businessUnitData.findByCode(data.businessUnitCode);
      // ...
    },
  };
}

// 本番
export const projectService = createProjectService({
  projectData,
  businessUnitData,
  projectTypeData,
});

// テスト
const testService = createProjectService({
  projectData: mockProjectData,
  businessUnitData: mockBusinessUnitData,
  projectTypeData: mockProjectTypeData,
});
```

メリット: 外部ライブラリ不要、学習コストゼロ、型安全
デメリット: 依存が深い場合の引き回しが煩雑

#### 代替案 B: vi.mock() の改善

```typescript
// test-helpers/mocks.ts
export function mockProjectData(overrides?: Partial<ProjectDataPort>) {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    ...overrides,
  };
}
```

メリット: 現状の仕組みを踏襲、移行コストゼロ
デメリット: モジュールパスの文字列依存は残る

### 10.5 最終結論

| 判断 | 内容 |
|------|------|
| **バックエンド** | テスト整備が優先課題であれば **段階的に導入する価値あり**。ただし、代替案A（関数引数 DI）の方がシンプルで同等の効果が得られる可能性もある。チーム内で PoC を行い、開発体験を比較した上で判断することを推奨。 |
| **フロントエンド** | **導入不可**（ブラウザ非対応）。既存パターンで十分。 |
| **diva の評価** | API 設計はエレガントで学習コストも低い。ただし、エコシステムの成熟度とコミュニティサイズは懸念材料。**Node.js バックエンド専用**であることを理解した上で採用を検討すべき。 |

---

## 付録: 参考リンク

- [@praha/diva GitHub](https://github.com/praha-inc/diva)
- [@praha/diva npm](https://www.npmjs.com/package/@praha/diva)
- [AsyncLocalStorage (Node.js)](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
- [Dependency Injection (Wikipedia)](https://en.wikipedia.org/wiki/Dependency_injection)
