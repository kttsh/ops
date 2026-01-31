# Git ブランチ戦略 & ワークフロー規約

cc-sdd（Spec-Driven Development）と連携したGit運用ルール。

---

## ブランチ戦略

### ブランチ構成

```
main                          # 本番環境（保護ブランチ）
├── develop                   # 開発統合ブランチ（任意）
├── spec/<specId>             # 仕様単位のブランチ
│   └── spec/user-auth-oauth
│   └── spec/payment-integration
│   └── spec/photo-albums
└── hotfix/<issue-id>         # 緊急修正用
```

### ブランチ命名規則

| 種別 | 形式 | 例 |
|------|------|-----|
| 仕様実装 | `spec/<specId>` | `spec/user-auth-oauth` |
| 緊急修正 | `hotfix/<issue-id>` | `hotfix/fix-login-crash` |
| 実験的 | `experiment/<name>` | `experiment/new-db-schema` |

**specId** = `.kiro/specs/<specId>/` のディレクトリ名と一致させる

---

## ワークフロー

### 1. 仕様作成フェーズ

```bash
# 仕様初期化（cc-sdd）
/kiro:spec-init ユーザー認証機能

# この時点でブランチを切る
git checkout -b spec/user-auth
git push -u origin spec/user-auth
```

### 2. 実装フェーズ

```bash
# タスク実装前に最新化
git pull origin main
git merge main  # または rebase

# タスク単位でコミット（後述のコミット規約参照）
git commit -m "feat(user-auth): ログイン画面のUI実装"
git commit -m "feat(user-auth): OAuth認証フローの実装"
git commit -m "test(user-auth): 認証フローのユニットテスト追加"
```

### 3. PR作成フェーズ

タスク完了後、PRを作成してmainにマージ。

---

## コミットメッセージ規約

### フォーマット

```
<type>(<scope>): <概要>

[本文（任意）]

[フッター（任意）]
```

### Type一覧

| Type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング（機能変更なし） |
| `test` | テスト追加・修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードスタイル（フォーマット等） |
| `chore` | ビルド、CI/CD、依存関係等 |
| `perf` | パフォーマンス改善 |

### Scope

- cc-sddのspecIdを使用: `feat(user-auth): ...`
- 共通部分は機能名: `fix(api): ...`、`chore(ci): ...`

### 例

```bash
# 良い例
feat(user-auth): OAuth認証のリダイレクト処理を実装
fix(payment): 決済エラー時のロールバック漏れを修正
test(photo-albums): アップロード機能の境界値テストを追加
docs(readme): セットアップ手順を更新
chore(deps): hono を v4.6.0 にアップデート

# 悪い例
fix: バグ修正           # scopeがない、概要が曖昧
Update files            # type がない、英語
作業中                  # 意味不明
```

---

## Pull Request 規約

### PRタイトル

```
[<specId>] <概要>
```

例: `[user-auth] OAuth認証機能の実装`

### PR本文テンプレート

```markdown
## 概要
<!-- この PR で何を実現するか -->


## 関連する仕様
- Spec: `.kiro/specs/<specId>/`
- Requirements: `.kiro/specs/<specId>/requirements.md`
- Design: `.kiro/specs/<specId>/design.md`

## 変更内容
<!-- 主な変更点を箇条書き -->
- 
- 
- 

## 完了したタスク
<!-- tasks.md から該当タスクを記載 -->
- [x] TASK-001: ログイン画面の実装
- [x] TASK-002: OAuth認証フローの実装
- [x] TASK-003: テストの追加

## テスト
<!-- テスト方法、確認事項 -->
- [ ] ユニットテスト通過
- [ ] E2Eテスト通過
- [ ] 手動確認完了

## スクリーンショット（任意）
<!-- UI変更がある場合 -->

## 注意事項・レビューポイント
<!-- レビュアーに見てほしい箇所 -->

```

---

## CLAUDE.md への追記例

```markdown
## Git運用ルール

### ブランチ作成
- 仕様実装時: `spec/<specId>` で切る
- specIdは `.kiro/specs/` のディレクトリ名と一致

### コミット
- Conventional Commits形式: `<type>(<scope>): <概要>`
- scopeはspecIdを使用
- 日本語で記載

### PR
- タイトル: `[<specId>] <概要>`
- 本文: docs/git-workflow.md のテンプレートを使用

### 禁止事項
- mainへの直接push
- WIP、作業中などの曖昧なコミットメッセージ
```

---

## Claude Code への指示例

### ブランチ作成を依頼する

```
spec/user-auth-oauth のブランチを切って作業開始して
```

Claude Codeが実行すべきこと:
```bash
git checkout main
git pull origin main
git checkout -b spec/user-auth-oauth
```

### PR作成を依頼する

```
user-auth-oauth の実装が完了したのでPR作成して
```

Claude Codeが実行すべきこと:
1. `.kiro/specs/user-auth-oauth/tasks.md` を参照して完了タスクを確認
2. PRテンプレートに沿った本文を生成
3. `gh pr create` または GitHub UI用のテキストを出力

---

## チェックリスト

### 実装開始時
- [ ] specが作成済み（`.kiro/specs/<specId>/` が存在）
- [ ] ブランチ `spec/<specId>` を作成
- [ ] mainから最新を取得

### コミット時
- [ ] Conventional Commits形式
- [ ] scopeにspecIdを指定
- [ ] 意味のある単位でコミット

### PR作成時
- [ ] タイトルに `[<specId>]` を含む
- [ ] テンプレートに沿った本文
- [ ] 完了タスクの記載
- [ ] テスト確認済み

---

## FAQ

### Q: developブランチは必要？
develop無しで main + spec/* のシンプル構成でOK。チーム規模やリリースサイクルに応じて導入を検討。

### Q: specが複数タスクに分かれている場合は？
1spec = 1ブランチ。タスク単位ではなくspec単位でブランチを切る。タスクはコミット単位で管理。

### Q: 途中でspecの内容が変わったら？
spec内のドキュメント（requirements.md等）を更新し、その変更もコミット。PRの「変更内容」欄に経緯を記載。

### Q: hotfixの場合は？
本番障害など緊急時のみ `hotfix/<issue-id>` で切る。修正後は main と develop（あれば）両方にマージ。
