# ギャップ分析: backend-transform-simplification

## 1. 現状調査

### Transform ファイル分類（全21ファイル）

| カテゴリ | ファイル数 | 対象ファイル |
|---------|-----------|------------|
| **Cat.1: 純粋マッピング** | 14 | businessUnit, chartColorPalette, chartColorSetting, chartStackOrderSetting, indirectWorkTypeRatio, monthlyCapacity, monthlyHeadcountPlan, monthlyIndirectWorkLoad, projectCase, projectChangeHistory, projectLoad, projectType, workType, (capacityScenario は Cat.2 に修正) |
| **Cat.2: 軽微変換付き** | 6 | project (`toLowerCase`), chartViewProjectItem (`!!`, ネスト構造), chartViewIndirectWorkItem (`!!`), chartView (JSON.parse), capacityScenario (`??`), headcountPlanCase (`??`), indirectWorkCase (`??`) |
| **Cat.3: 複合ロジック** | 1 | standardEffortMaster (3関数、相互参照あり) |

### サービス層の利用パターン

- **100% 一貫**: 全サービスが `toXxxResponse(row)` または `.map(toXxxResponse)` で呼び出し
- **追加変換なし**: サービス層で Transform 結果に手を加えるケースはゼロ
- **インポートパターン**: `import { toXxxResponse } from "@/transform/xxxTransform"` で統一
- **例外**: `capacityScenarioService.ts` のみ2つの Transform 関数をインポート

### Row 型のパターン

- **定義方式**: `type` エイリアス（`interface` ではない）
- **フィールド名**: snake_case（DB カラム名と一致）
- **Date フィールド**: `Date` 型（DB ドライバが変換済み）。`deleted_at` は `Date | null`
- **JOIN フィールド**: Row 型に直接含む（例: `business_unit_name`）

### 既存ユーティリティ

- `utils/` にフィールドマッピング関連のユーティリティは**存在しない**
- 既存: `errorHelper.ts`, `responseHelper.ts`, `validate.ts`, `parseParams.ts`

### テストカバレッジ

- **7/21 ファイル** にテストあり（33%）
  - businessUnit, project, projectType, workType, chartColorPalette, indirectWorkTypeRatio, standardEffortMaster
- テストは snake_case → camelCase 変換、Date → ISO 8601、null 保持、フィールド除外を検証

---

## 2. 要件 → 既存資産マッピング

| 要件 | 既存資産 | ギャップ |
|------|---------|---------|
| Req 1: 汎用フィールドマッパー | なし | **Missing** — 新規作成が必要 |
| Req 2: カスタム変換サポート | 各 Transform にインライン実装 | **Missing** — 汎用的な仕組みが必要 |
| Req 3: 既存ファイル移行 | 20ファイル（Cat.1: 14, Cat.2: 6）| **実装工数** — 移行作業のみ |
| Req 4: 複合ロジック保全 | standardEffortMasterTransform.ts | **対応不要** — そのまま維持 |
| Req 5: 後方互換性 | テスト 7 件 | **Constraint** — テスト未整備の Transform が14ファイル |

### 複雑性シグナル

- **純粋なリファクタリング**: ビジネスロジックの追加・変更なし
- **パターンが極めて均一**: 21ファイル中20ファイルが単一関数の同一構造
- **型安全性の課題**: Row → Response の任意フィールド除外（`deleted_at` 等）を型で表現する設計が鍵

---

## 3. 実装アプローチの選択肢

### Option A: 宣言的マッピング定義 + 汎用変換関数

**概要**: フィールドマッピングを設定オブジェクトで定義し、`createFieldMapper<TRow, TResponse>(config)` で変換関数を生成

```typescript
// fieldMapper.ts
export function createFieldMapper<TRow, TResponse>(
  mapping: FieldMapping<TRow, TResponse>
): (row: TRow) => TResponse;

// 使用例: businessUnitTransform.ts
export const toBusinessUnitResponse = createFieldMapper<BusinessUnitRow, BusinessUnit>({
  businessUnitCode: 'business_unit_code',
  name: 'name',
  displayOrder: 'display_order',
  createdAt: { field: 'created_at', transform: dateToISO },
  updatedAt: { field: 'updated_at', transform: dateToISO },
});
```

**トレードオフ**:
- ✅ 型安全（Row 型と Response 型の両方を参照するマッピング定義）
- ✅ カスタム変換を自然に表現できる（`transform` プロパティ）
- ✅ 既存のエクスポートシグネチャを完全に維持可能
- ❌ マッピング定義のボイラープレートは残る（フィールド列挙が必要）
- ❌ 型定義が複雑になる可能性

### Option B: 自動 snake_case → camelCase 変換 + 除外/オーバーライド

**概要**: Row オブジェクトのキーを自動で camelCase に変換し、Date 型は自動で ISO 文字列化。フィールド除外やオーバーライドをオプションで指定

```typescript
// fieldMapper.ts
export function createAutoMapper<TRow, TResponse>(
  options?: { exclude?: string[]; overrides?: Partial<...> }
): (row: TRow) => TResponse;

// 使用例
export const toBusinessUnitResponse = createAutoMapper<BusinessUnitRow, BusinessUnit>();
```

**トレードオフ**:
- ✅ ボイラープレート最小（純粋マッピング型は1行で完結）
- ✅ Date 自動変換で手動コード不要
- ❌ **型安全性が弱い**（ランタイム依存、Row と Response のフィールド不一致を検出しにくい）
- ❌ JOIN フィールドの命名不一致（`business_unit_name` → `businessUnitName` は OK だが、ネスト構造には対応困難）
- ❌ `deleted_at` の除外を明示的に指定する必要がある

### Option C: ハイブリッド（推奨）

**概要**: Option A のファクトリパターンをベースに、Cat.1 ファイル向けの簡略構文も提供

```typescript
// Cat.1: 純粋マッピング - 短縮構文
export const toBusinessUnitResponse = createFieldMapper<BusinessUnitRow, BusinessUnit>([
  'business_unit_code:businessUnitCode',
  'name',
  'display_order:displayOrder',
  { from: 'created_at', to: 'createdAt', transform: dateToISO },
  { from: 'updated_at', to: 'updatedAt', transform: dateToISO },
]);

// Cat.2: カスタム変換付き - 完全構文
export const toProjectResponse = createFieldMapper<ProjectRow, Project>([
  ...commonMappings,
  { from: 'status', to: 'status', transform: (v) => v.toLowerCase() },
]);
```

**トレードオフ**:
- ✅ 型安全とボイラープレート削減のバランス
- ✅ Cat.1 は簡潔、Cat.2 はカスタマイズ可能
- ❌ 2つの構文を理解する必要がある
- ❌ 型定義の複雑度は Option A と同等

---

## 4. 実装の複雑度とリスク

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **S（1-3日）** | パターンが均一、ビジネスロジック変更なし、ファクトリ1つ + 20ファイルの機械的置換 |
| **リスク** | **Low** | 既存パターンの延長、テスト7件で回帰検証可能、型システムが不整合を検出 |

### リスク要因

1. **テストカバレッジ不足**: 14/21 ファイルにテストなし → 移行時に目視確認が必要
2. **型定義の複雑度**: `createFieldMapper` の型パラメータ設計を誤ると DX が低下
3. **サービス層への波及**: エクスポートシグネチャを維持すれば影響なし（関数名・引数・戻り値型が同一であれば呼び出し側は無変更）

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option A（宣言的マッピング定義）

**理由**:
- 型安全性を最優先（TypeScript strict mode の方針と整合）
- ランタイム変換の暗黙性を避ける（Option B の自動変換はデバッグ困難）
- Option C の複数構文は認知負荷が高い

### 設計フェーズで決定すべき事項

1. **`FieldMapping` 型の詳細設計**: Row → Response のフィールド対応をどの程度型で強制するか
2. **Date 変換の自動検出 vs 明示指定**: `Date` 型フィールドを自動で `.toISOString()` するか、明示的に `dateToISO` を指定させるか
3. **ネストオブジェクト対応**: `chartViewProjectItemTransform` のような入れ子構造をマッピング定義でどう表現するか
4. **テスト戦略**: 既存テスト7件の移行 + テスト未整備ファイルへの対応方針

### Research Needed

- TypeScript の mapped types / conditional types を活用した `FieldMapping` 型の設計パターン
