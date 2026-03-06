# Gap Analysis: workload-control-panel

## 要件と既存資産の対応マップ

| 要件 | 既存資産 | ギャップ |
|------|---------|---------|
| Req 1: タブラベル「チャート設定」 | SidePanel.tsx 行15-19 にハードコード「設定」 | **軽微** — ラベル文字列の変更のみ |
| Req 2: 二重スクロール解消 | SidePanelSettings.tsx 行267 `max-h-80 overflow-y-auto` | **軽微** — クラス削除のみ |
| Req 3: 案件色 Popover UI | SidePanelSettings.tsx 行277-289 で6色ボタン横並び | **Missing** — Popover コンポーネント未導入、色選択UIの再実装が必要 |
| Req 4: 容量シナリオ色 Popover UI | SidePanelSettings.tsx 行339-356 で全色ボタン横並び | **Missing** — Req 3 と同様 |
| Req 5: 色選択共通仕様 | なし | **Missing** — 共通 ColorPickerPopover コンポーネントの新規作成が必要 |

## 重要な発見事項

### 既存パターン
- 色状態は `SidePanelSettings.tsx` 内のローカル state（`projColors`, `capColors`）で管理
- 案件色変更は `colorMutation.mutate()` で API 送信済み（行179-185）
- 容量シナリオ色はローカル状態のみ（API 連携なし）
- チャート反映は `onProjectColorsChange` コールバック経由で親に通知済み
- 案件色は `PROJECT_TYPE_COLORS.slice(0, 6)` で6色表示、容量は `CAPACITY_COLORS` 全4色表示

### 未導入コンポーネント
- **`@radix-ui/react-popover`**: shadcn/ui の Popover は未インストール・未生成
- **`src/components/ui/popover.tsx`**: 存在しない — shadcn CLI で追加が必要

### 色選択の形状差異
- 案件色: `rounded-sm`（四角）、容量: `rounded-full`（円）— 統一方針の設計判断が必要

## 実装アプローチ

### Option A: 既存コンポーネントの拡張（非推奨）
SidePanelSettings.tsx 内に Popover ロジックを直接埋め込む。

**トレードオフ:**
- ✅ 新規ファイル不要
- ❌ SidePanelSettings.tsx がさらに肥大化（現在約360行）
- ❌ 案件色と容量シナリオ色で Popover ロジックが重複

### Option B: 新規 ColorPickerPopover コンポーネント作成（推奨）
`src/features/workload/components/ColorPickerPopover.tsx` を新規作成し、案件色・容量シナリオ色の両方で再利用。

**トレードオフ:**
- ✅ 単一責務・テスト容易性
- ✅ 案件色と容量色で同一コンポーネントを再利用（Issue の要件通り）
- ✅ SidePanelSettings.tsx の行数削減
- ❌ 新規ファイル1つ追加

### Option C: ハイブリッド — 不要
この機能は Option B で十分シンプルにカバーできる。

## 推奨アプローチ: Option B

**理由:**
1. Issue #37 が明示的に「ColorPickerPopover コンポーネントを新規作成」と指定
2. 案件色・容量シナリオ色の両方で同一 UI を使う要件がある
3. props で色パレット配列と選択色を渡すだけのシンプルなインターフェース

## 前提タスク

1. **shadcn/ui Popover の追加**: `npx shadcn@latest add popover` で `@radix-ui/react-popover` と `src/components/ui/popover.tsx` を生成
2. **ColorPickerPopover の設計**: props（`colors`, `value`, `onChange`）のインターフェース定義

## 工数・リスク評価

- **工数: S（1-3日）** — 既存パターンの延長、UIコンポーネント1つ新規 + 既存2ファイルの軽微修正
- **リスク: Low** — 既存の色管理ロジック（state, mutation, callback）はそのまま活用、UI層の変更のみ

## 設計フェーズへの引き継ぎ事項

1. ColorPickerPopover の props インターフェース設計（色パレット、現在値、onChange）
2. スウォッチの形状統一方針（rounded-sm vs rounded-full）
3. Popover の配置方向（side/align）の決定
4. Storybook story の作成方針
