# 📁ディレクトリ構成

## ✅前提条件
1. 本規約では、TanStack Routerを利用することを前提とし、File-based routingを採用します。
2. features同士の依存は極力排除したディレクトリ構成を目指します。
3. フロントエンド単体構成とモノレポ構成の両方を記載します。
4. バックエンドの構成はREST APIを採用することを前提としています。
5. テストのディレクトリ構成は[**テスト**](https://qmusaz-01-0099.mhi.co.jp/a0010-sof4/coding-guidelines/-/blob/main/sof4-react-rules-test.md)のページをご確認ください。

## 🚲目次
- 🧩[フロントエンド単体構成](#フロントエンド単体構成)
- 🧱[モノレポ構成](#モノレポ構成)
  
## 🧩フロントエンド単体構成
```
.
├── src
|   ├── main.tsx          メインアプリケーションコンポーネント
|   |
|   ├── assets            画像、フォントなどのすべての静的ファイル
|   |
|   ├── components        アプリケーション全体で使用される共有コンポーネント
|   |
|   ├── config            グローバル設定、エクスポートされた環境変数など
|   |
|   ├── features          機能ベースのモジュール
|   |
|   ├── routes            ルーティングを定義するコンポーネント
|   |
|   ├── hooks             アプリケーション全体で使用される共有フック
|   |
|   ├── lib               アプリケーション用に事前構成された再利用可能なライブラリ
|   |
|   ├── stores            グローバル状態ストア
|   |
|   ├── test              テストユーティリティとモック
|   |
|   ├── types             アプリケーション全体で使用される共有タイプ
|   |
|   ├── utils             共有ユーティリティ関数
|   |
|   ├── styles            アプリケーション全体で使用されるスタイル
|   |
|   ├── constants         アプリ全体で使う定数
|   |
|   └── services          アプリケーション全体で使用されるライブラリの設定
|
└── tsconfig.json 他      自動生成の設定ファイル
```
### src/features
⚠features/components配下には、フォルダを作成しないでください。
```
src/features
└── [awesome-feature]
     ├── api              特定の機能に関連するAPIリクエスト宣言とapi hooks
     │
     ├── assets           特定の機能でのみ使用する静的コンテンツ
     │
     ├── components       特定の機能のコンポーネント
     │
     ├── hooks            特定の機能のhooks
     │
     ├── stores           特定の機能の状態管理
     │
     ├── types            特定の機能の型
     │
     ├── utils            特定の機能の関数
     │
     ├── styles           特定の機能のスタイル
     |
     ├── constants        特定の機能の定数
     │
     └── index.ts         特定の機能のエントリーポイント
                          指定された機能のパブリックAPIとして機能します
                          その機能の外部で使用されるすべてのものをエクスポートします
```
### src/routes
```
src/routes
├── __root.tsx              すべての画面のエントリーポイント
│        
├── [screen-name].tsx       /[screen-name]
│        
└── [awesome-route]         システムや機能
      ├── route.tsx         特定のシステムや機能専用のエントリーポイント
      │
      ├── index.tsx         /[awesome-route]
      │
      └── [screen-name].tsx /[awesome-route]/[screen-name]
```
### src/components
⚠[screen-name].tsxは、画面のレイアウトとなる記述を100行前後で記述し、極力ルーティング定義のみ記述することを避けてください。
```
src/components
├── ui                      Shadcn/ui等の自動生成ファイル
│        
├── [awesome-feature]       特定の機能が複数のコンポーネントからなる場合、フォルダで切り出す
│
└── [awesome-feature].tsx   特定の機能のコンポーネント
```

## 🧱モノレポ構成
本プロジェクトは **Turborepo + pnpm** を使用したモノレポ構成を採用しています。
`apps/frontend` 配下のディレクトリ構成は[**フロントエンド単体構成**](#フロントエンド単体構成)を参考にしてください。
```
.
├── apps                    アプリケーション
|   ├── frontend            フロントエンドアプリ
|   └── backend             バックエンドアプリ
|
├── packages                共有パッケージ
|   ├── ui                  共有UIコンポーネント（例）
|   ├── utils               共有ユーティリティ（例）
|   └── types               共有型定義（例）
|
├── package.json            ルートpackage.json（turboスクリプト定義）
├── pnpm-workspace.yaml     pnpmワークスペース設定
└── turbo.json              Turborepoタスク設定
```
### apps/backend
```
apps/backend
├── src
|   ├── routes              エンドポイント定義
|   |
|   ├── data                DBアクセスとクエリ実行
|   |
|   ├── database            DB接続設定
|   |
|   ├── types               バックエンドで使用される共有タイプ
|   |
|   ├── services            ビジネスロジック
|   |
|   ├── transform           データ変換処理
|   |
|   └── utils               汎用関数
|
├── package.json            パッケージ設定
└── tsconfig.json 他        自動生成の設定ファイル
```
### packages（共有パッケージ）
共有パッケージは必要に応じて作成します。以下は代表的な例です。
```
packages/ui                 共有UIコンポーネント
├── src
|   ├── components          共有コンポーネント
|   └── index.ts            エクスポート定義
├── package.json
└── tsconfig.json

packages/utils              共有ユーティリティ
├── src
|   └── index.ts
├── package.json
└── tsconfig.json

packages/types              共有型定義
├── src
|   └── index.ts
├── package.json
└── tsconfig.json
```
共有パッケージをアプリから使用する場合は、`package.json` で依存関係を追加します。
```json
{
  "dependencies": {
    "@ops/ui": "workspace:*",
    "@ops/utils": "workspace:*"
  }
}
```
