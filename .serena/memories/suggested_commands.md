# Suggested Commands

## 依存関係
```bash
pnpm install
```

## ビルド
```bash
# 全パッケージ
pnpm build

# フロントエンドのみ
pnpm --filter frontend build
```

## 開発サーバー
```bash
# 全体
pnpm dev

# 個別
pnpm --filter frontend dev
pnpm --filter backend dev
```

## テスト
```bash
# 全体
pnpm test

# フロントエンドのみ
pnpm --filter frontend test

# Vitest (フロントエンド直接)
cd apps/frontend && npx vitest run
```

## リント
```bash
pnpm lint
```

## TypeScript型チェック
```bash
cd apps/frontend && npx tsc --noEmit
cd apps/backend && npx tsc --noEmit
```

## ルート生成 (TanStack Router)
```bash
cd apps/frontend && npx @tanstack/router-cli generate
```

## クリーンアップ
```bash
pnpm clean
```
