# Research & Design Decisions

## Summary
- **Feature**: `workload-control-panel`
- **Discovery Scope**: Extension（既存UIコンポーネントの改善）
- **Key Findings**:
  - `@radix-ui/react-popover` は未インストール — shadcn CLI で追加が必要
  - 既存の色選択ロジック（state管理、mutation、コールバック）はそのまま再利用可能
  - スウォッチ形状は `rounded-full`（円形）に統一が自然

## Research Log

### shadcn/ui Popover コンポーネント
- **Context**: 色選択UIをPopoverベースに変更するため、shadcn/ui Popoverの導入が必要
- **Sources Consulted**: プロジェクト内 package.json、既存 UI コンポーネント構成
- **Findings**:
  - `@radix-ui/react-popover` は未インストール（alert-dialog, dialog, select, tooltip 等は導入済み）
  - `src/components/ui/popover.tsx` は未生成
  - `npx shadcn@latest add popover` で追加可能
  - Radix Popover は Trigger + Content パターンで、Portal経由でレンダリング
- **Implications**: 新規依存追加だが、既存の Radix エコシステムと完全互換

### 色選択の既存実装パターン
- **Context**: 現行の色選択UIと状態管理を理解し、置き換え範囲を特定
- **Findings**:
  - 案件色: `SidePanelSettings.tsx` 行277-289、`PROJECT_TYPE_COLORS.slice(0, 6)` で6色表示
  - 容量色: `SidePanelSettings.tsx` 行339-356、`CAPACITY_COLORS` 全4色表示
  - 案件色変更: `colorMutation.mutate()` で API送信（行179-185）
  - 容量色変更: ローカル state のみ（API連携なし）
  - チャート反映: `onProjectColorsChange` コールバック経由で親に通知
- **Implications**: UI層のみの置き換えで、ビジネスロジック・API層は変更不要

### スウォッチ形状の統一
- **Context**: 案件色は `rounded-sm`、容量色は `rounded-full` で形状が異なる
- **Findings**:
  - 色選択UIは「丸型スウォッチ」が一般的なパターン（Material Design、Figma等）
  - 要件3.1で「丸型スウォッチ」を明示指定
- **Implications**: `rounded-full` に統一

## Design Decisions

### Decision: ColorPickerPopover を workload feature 内に配置
- **Context**: 色選択 Popover コンポーネントの配置先
- **Alternatives Considered**:
  1. `src/components/shared/ColorPickerPopover.tsx` — 共有コンポーネント
  2. `src/features/workload/components/ColorPickerPopover.tsx` — feature内配置
- **Selected Approach**: feature 内配置（Option 2）
- **Rationale**: 現時点では workload feature 内でのみ使用。他 feature で必要になった時点で shared に昇格
- **Trade-offs**: feature 内に閉じることで依存関係が明確。将来の共有化は容易

### Decision: Popover 配置方向
- **Context**: 色スウォッチクリック時の Popover 展開方向
- **Selected Approach**: `side="bottom"`, `align="start"`
- **Rationale**: SidePanel 内の横幅制約（600px）を考慮し、下方向に展開が自然

## Risks & Mitigations
- **Risk**: Popover がパネル外にはみ出す可能性 → Radix の collision detection が自動調整
- **Risk**: 色数が多い場合の Popover サイズ → 最大10色（PROJECT_TYPE_COLORS）なので問題なし
