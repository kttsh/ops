# Research & Design Decisions

## Summary
- **Feature**: `capacity-scenario-simplification`
- **Discovery Scope**: Extension（既存システムの標準パターンへの統一）
- **Key Findings**:
  - 標準マスタ管理画面パターン（PageHeader + DataTableToolbar + DataTable + DetailSheet + useMasterSheet）は作業種類・ビジネスユニット・プロジェクト種類の3画面で完全に確立されている
  - CapacityScenario エンティティは `code`/`displayOrder` フィールドを持たず、`capacityScenarioId`（number）を主キーとする点が標準マスタと異なる
  - MonthlyCapacityTable はマスタ管理画面でのみ使用されており、安全に削除可能

## Research Log

### 標準マスタ管理画面パターンの分析
- **Context**: 稼働時間画面を標準パターンに統一するため、既存実装パターンを調査
- **Sources Consulted**: work-types, business-units, project-types のルートファイル・DetailSheet・useMasterSheet フック
- **Findings**:
  - 共通レイアウト: PageHeader → Card(DataTableToolbar + DataTable) → DetailSheet
  - 共通フック: `useMasterSheet<TEntity>()` で view/edit/create/closed の4モード管理
  - 共通カラムヘルパー: createSortableColumn, createStatusColumn, createDateTimeColumn, createRestoreActionColumn
  - DetailSheet は sheetState, isOpen, onOpenChange, openEdit, openView, close, onMutationSuccess の統一 Props
  - ルート定義: `createFileRoute()` + `validateSearch` による検索パラメータ管理
- **Implications**: 既存パターンをほぼそのまま適用可能。CapacityScenario 固有のフィールド（hoursPerPerson, isPrimary）は DetailSheet 内で表示

### CapacityScenario エンティティ構造の差異
- **Context**: 標準マスタ（code + name + displayOrder）と CapacityScenario のフィールド差異を分析
- **Sources Consulted**: `capacity-scenario.ts` 型定義
- **Findings**:
  - 標準マスタ: `xxxCode`(string), `name`(string), `displayOrder`(number) が共通
  - CapacityScenario: `capacityScenarioId`(number), `scenarioName`(string), `isPrimary`(boolean), `hoursPerPerson`(number), `description`(string|null)
  - `code` フィールドが存在しないため、DataTable のカラム構成は調整が必要
  - `displayOrder` もないため、一覧のソートはデフォルトで ID 順
- **Implications**: DataTable カラムは scenarioName, hoursPerPerson, isPrimary（バッジ表示）, ステータス, 更新日時, アクション に調整

### MonthlyCapacityTable の依存分析
- **Context**: MonthlyCapacityTable の削除影響を確認
- **Sources Consulted**: index.ts エクスポート、useCapacityScenariosPage フック、grep による使用箇所調査
- **Findings**:
  - MonthlyCapacityTable はマスタ管理画面（index.lazy.tsx）からのみ使用
  - useCapacityScenariosPage は monthlyCapacitiesQueryOptions を内包しており、マスタ管理画面専用
  - monthlyCapacitiesQueryOptions 自体は useCapacityScenariosPage 内でのみ使用
  - シミュレーション画面は独自の計算ロジック（useCapacityCalculation）を使用しており影響なし
- **Implications**: MonthlyCapacityTable, そのテスト、useCapacityScenariosPage フックは安全に削除可能

### 既存コンポーネントの再利用可否
- **Context**: CapacityScenarioList と ScenarioFormSheet の再利用を検討
- **Sources Consulted**: 各コンポーネントのソースコード
- **Findings**:
  - CapacityScenarioList: シミュレーション画面でも使用されているため、削除不可（マスタ画面からの参照のみ削除）
  - ScenarioFormSheet: DetailSheet 内のフォーム部分として再利用可能。ただし DetailSheet パターンに合わせた Props 調整が必要
- **Implications**: ScenarioFormSheet は DetailSheet 内に組み込む形で再利用する

## Design Decisions

### Decision: DataTable カラム構成
- **Context**: CapacityScenario には code/displayOrder がなく、標準マスタとカラム構成が異なる
- **Alternatives Considered**:
  1. 標準マスタと同じ code/name/displayOrder カラムに合わせてバックエンドも変更
  2. エンティティ固有のフィールドに合わせてカラムを調整
- **Selected Approach**: Option 2 — エンティティ固有のフィールドに合わせてカラムを調整
- **Rationale**: バックエンドの変更は Issue #54 のスコープ外。レイアウトとUIパターンの統一が目的であり、データモデルの変更は不要
- **Trade-offs**: カラム構成は他のマスタ画面と完全一致しないが、UIパターン（DataTable + DetailSheet）は統一される

### Decision: useCapacityScenariosPage フックの扱い
- **Context**: マスタ管理画面専用フックの廃止と代替
- **Alternatives Considered**:
  1. フックを簡素化して残す（monthlyCapacities 関連のみ削除）
  2. フック自体を削除し、ルートコンポーネント内で直接 query を使用（標準パターンに合わせる）
- **Selected Approach**: Option 2 — 標準パターンに合わせてフック削除
- **Rationale**: 標準マスタ画面ではルートコンポーネント内で useQuery + useMasterSheet を直接使用しており、専用フックは不要
- **Trade-offs**: コードの集約度は下がるが、パターンの一貫性が向上

### Decision: CapacityScenarioList コンポーネントの扱い
- **Context**: シミュレーション画面でも使用されているため削除不可
- **Selected Approach**: マスタ管理画面からの参照のみ削除し、コンポーネント自体は残す
- **Rationale**: シミュレーション画面のリスト表示UIは独自のままで問題ない

## Risks & Mitigations
- CapacityScenarioList がシミュレーション画面で引き続き使用されるため、エクスポート削除時に参照漏れがないか確認が必要 → grep で全使用箇所を検証
- ScenarioFormSheet の Props 変更時にシミュレーション画面への影響 → ScenarioFormSheet は変更せず DetailSheet 内で呼び出す形にする
