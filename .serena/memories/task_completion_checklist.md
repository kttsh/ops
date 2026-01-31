# Task Completion Checklist

コード変更後に確認すべき項目:

## 必須チェック
1. TypeScript 型チェック: `npx tsc --noEmit`
2. テスト実行: `pnpm test` or `npx vitest run`
3. ビルド確認: `pnpm build`
4. リント: `pnpm lint`

## コード品質
- パスエイリアス `@/*` を使用しているか
- features 間の依存を避けているか
- ルートコンポーネントは100行前後か
- `erasableSyntaxOnly` に対応しているか（パラメータプロパティ使用不可）

## API 関連
- エラーレスポンスは RFC 9457 Problem Details 形式か
- 成功レスポンスは `{ data, meta, links }` 形式か
- ソフトデリート対応しているか

## Spec Driven Development
- tasks.md のチェックボックスを更新したか
- spec.json の phase を更新したか
