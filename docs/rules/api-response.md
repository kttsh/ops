# ⭐APIレスポンス規約

## 🤔目的
この規約は、以下の目的を達成するために定められています：
1.  **品質向上**  
    APIレスポンスの形式やエラーハンドリングを標準化することで、システム全体の品質を一定に保ち、不具合や不整合を未然に防ぎます。これにより、信頼性の高いサービスを提供します。
2.  **一貫性の確保**  
    開発チーム全体で統一されたレスポンス構造とエラー表現を採用することで、API利用者に対して予測可能で一貫したインターフェースを提供します。
3.  **保守性の向上**  
    レスポンス仕様を明確化することで、将来的な機能追加や改修時に影響範囲を把握しやすくし、メンテナンスコストを削減します。
4.  **効率化**  
    標準化されたレスポンス形式により、クライアント側の実装やデバッグ、障害対応を迅速化し、開発効率を高めます。
5.  **利用者支援**  
    API利用者がレスポンス構造やエラーの意味を容易に理解できるようにすることで、開発者体験を向上させ、学習コストを低減します。

## 共通ポリシー

- **成功時のコンテンツタイプ**: すべてのリクエスト/レスポンスで `application/json; charset=utf-8`
- **エラー時のコンテンツタイプ**: `application/problem+json; charset=utf-8` **(RFC 9457 Section 3)**
- **識別子の命名規則**: 
  - リソースは英小文字の複数形（例: `ewps`, `cwps`, `pwps`, `drawings`, `pcls`）  
  - パスパラメータは `camelCase`（例: `{projectId}`, `{ewpCd}`）

```json
{
  "data": { /* リソース、配列、またはnull */ },
  "meta": { 
    "pagination": { /* ページ情報 */ },
    "warnings": [ /* 警告メッセージ（任意） */ ]
  },
  "links": { /* HAT EOAS リンク */ }
}
```

- **HTTP ステータスコード**:
  - `200 OK`: 単一リソース取得 / 成功した更新
  - `201 Created`: 新規作成完了（`Location` ヘッダでリソース URL を返す）
  - `202 Accepted`: 非同期処理を受け付けた場合
  - `204 No Content`: 削除またはコンテンツ不要な更新
  - `400/401/403/404/409/412/422/428/429/500/503` を状況に応じて使用

---

## エラーレスポンス形式

エラー時は **RFC 9457 Problem Details** 形式を採用する。Content-Type は `application/problem+json` を使用。

### 基本構造

```json
{
  "type": "https://example.com:9999/awp/api/problems/validation-error",
  "status": 422,
  "title": "Validation Error",
  "detail": "Request contains invalid parameters",
  "instance": "/projects/563500/ewps?page[size]=-1",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-22T10:30:00Z",
  "errors": [
    {
      "pointer": "/page/size",
      "keyword": "minimum",
      "message": "must be greater than or equal to 1",
      "params": {
        "minimum": 1,
        "actual": -1
      }
    }
  ]
}
```

### 必須および推奨メンバー

| フィールド | 型 | 必須 | RFC 9457 参照 | 説明 |
|-----------|-----|------|--------------|------|
| `type` | string (URI) | 推奨 | Section 3.1.1 | 問題タイプを識別する URI。省略時は `about:blank` と見なされる。絶対 URI推奨。 |
| `status` | number | 推奨 | Section 3.1.2 | HTTP ステータスコード（実際のレスポンスのステータスコードと一致させる必要がある） |
| `title` | string | 推奨 | Section 3.1.3 | 問題タイプの要約。同じ `type` では固定。|
| `detail` | string | 任意 | Section 3.1.4 | この問題発生に特有の説明。|
| `instance` | string (URI) | 任意 | Section 3.1.5 | この問題発生を一意に識別する URI|

### 拡張メンバー

- **`errors`**: バリデーションエラー等、複数のエラー詳細を含む配列（任意）
  - `pointer`: JSON Pointer形式のフィールドパス（例: `/page/size`, `/ewpCd`）
  - `keyword`: JSON Schema validation keyword（例: `required`, `minimum`, `maximum`, `pattern`）
  - `message`: エラーメッセージ
  - `params`: エラーに関連するパラメータ情報
- **`requestId`**: トレーシング用のリクエスト ID（`X-Request-ID` ヘッダの値と同じ）
- **`timestamp`**: エラー発生時刻（ISO 8601 形式）

### 問題タイプの定義

```
https://example.com:9999/awp/api/problems/{problem-type}
```

主な問題タイプ:
- `validation-error`: バリデーションエラー (422)
- `resource-not-found`: リソースが見つからない (404)
- `conflict`: 競合エラー (409)
- `precondition-required`: 前提条件必須 (428)
- `precondition-failed`: 前提条件失敗 (412)
- `rate-limit-exceeded`: レート制限超過 (429)
- `internal-error`: 内部サーバーエラー (500)

---

## 主要なエラータイプの定義

### 1. バリデーションエラー (422 Unprocessable Entity)

```json
{
  "type": "https://example.com:9999/awp/api/problems/validation-error",
  "status": 422,
  "title": "Request Validation Failed",
  "detail": "The request contains invalid parameters",
  "instance": "/projects/563500/ewps",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-22T10:30:00Z",
  "errors": [
    {
      "pointer": "/page/size",
      "keyword": "maximum",
      "message": "must be less than or equal to 1000",
      "params": {
        "maximum": 1000,
        "actual": 2000
      }
    },
    {
      "pointer": "/ewpCd",
      "keyword": "required",
      "message": "must not be empty",
      "params": {}
    }
  ]
}
```

### 2. リソースが見つからない (404 Not Found)

```json
{
  "type": "https://example.com:9999/awp/api/problems/resource-not-found",
  "status": 404,
  "title": "Resource Not Found",
  "detail": "EWP with ID 'EWP-9999' not found in project '563500'",
  "instance": "/projects/563500/ewps/EWP-9999",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2025-01-22T10:31:00Z"
}
```

### 3. 競合エラー (409 Conflict)

```json
{
  "type": "https://example.com:9999/awp/api/problems/conflict",
  "status": 409,
  "title": "Resource Conflict",
  "detail": "EWP with ID 'EWP-001' already exists in project '563500'",
  "instance": "/projects/563500/ewps",
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "timestamp": "2025-01-22T10:32:00Z",
  "conflictingResource": {
    "type": "ewp",
    "id": "EWP-001",
    "href": "/projects/563500/ewps/EWP-001"
  }
}
```

### 4. 前提条件必須 (428 Precondition Required)

```json
{
  "type": "https://example.com:9999/awp/api/problems/precondition-required",
  "status": 428,
  "title": "Precondition Required",
  "detail": "This request requires an 'If-Match' header for optimistic locking",
  "instance": "/projects/563500/ewps/EWP-001",
  "requestId": "550e8400-e29b-41d4-a716-446655440003",
  "timestamp": "2025-01-22T10:33:00Z",
  "requiredHeader": "If-Match",
  "documentation": "https://example.com:9999/docs/optimistic-locking"
}
```

### 5. 前提条件失敗 (412 Precondition Failed)

```json
{
  "type": "https://example.com:9999/awp/api/problems/precondition-failed",
  "status": 412,
  "title": "Precondition Failed",
  "detail": "The resource has been modified by another request. Expected revision 3, but current revision is 5",
  "instance": "/projects/563500/ewps/EWP-001",
  "requestId": "550e8400-e29b-41d4-a716-446655440004",
  "timestamp": "2025-01-22T10:34:00Z",
  "expectedRevision": 3,
  "currentRevision": 5
}
```

---

## ソフトデリート

- **ソフトデリート**: 論理削除は `DELETE` で `204 No Content` を返し、実体は非表示。
- 復元は `POST {resource}/{id}/actions/restore` を利用。
- 削除済みリソースへのアクセスは `404 Not Found` を返す
- 削除済みリソースを含める場合は `filter[includeDisabled]=true` を使用（すべてのリソースで統一）
