# BFF 与算法后端 API 对接文档

## 1. 概述

GenNovelWeb 采用 BFF（Backend For Frontend）+ 算法后端的架构。BFF 负责用户认证、余额管理、消息通知等业务逻辑，算法后端负责 AI 对话、小说生成等核心 AI 能力。

本文档定义算法后端需要实现的所有 API 接口规范。**BFF 侧已全部实现，等待算法后端对接。**

### BFF 实现状态

| 接口 | BFF 状态 |
|------|---------|
| 2.1 创建会话 | ✅ 已实现 |
| 2.2 获取会话列表 | ✅ 已实现 |
| 2.3 删除会话 | ✅ 已实现 |
| 2.4 获取消息列表 | ✅ 已实现 |
| 2.5 发送消息（同步） | ✅ 已实现（含余额预检 + 扣费 + 用量记录） |
| 2.6 流式对话（SSE） | ✅ 已实现（含余额预检 + 扣费 + 用量记录） |

### 算法后端配置

```yaml
# config.yaml
algorithm:
  base_url: "http://localhost:8000"   # 算法后端地址
  timeout: 30                         # 超时时间（秒）
  retry: 3                            # 重试次数
```

环境变量覆盖：
- `ALGORITHM_BASE_URL` — 覆盖 base_url
- `ALGORITHM_TIMEOUT` — 覆盖 timeout

---

## 2. 通用约定

### 2.1 响应格式

所有算法后端 API **必须**返回以下 JSON envelope 格式：

```json
{
  "code": 0,
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | `0` 表示成功，非 `0` 表示业务错误 |
| `data` | object | 成功时的数据（各接口不同） |
| `message` | string | 可选，错误描述或成功提示 |

### 2.2 HTTP 状态码约定

算法后端应返回合适的 HTTP 状态码，BFF 会根据状态码进行错误映射：

| HTTP 状态码 | BFF 处理 | 说明 |
|-------------|---------|------|
| 200 | 解析 data 字段 | 成功 |
| 400 | 返回前端 400 "请求参数错误" | 参数校验失败 |
| 404 | 返回前端 404 "会话不存在" | 会话/消息不存在 |
| 500 | 返回前端 500 "服务异常" | 算法后端内部错误 |
| 503 | 返回前端 503 "AI 服务暂时不可用" | 模型服务不可用 |

### 2.3 重试机制

BFF 内置重试机制：
- **5xx / 网络超时**：自动重试，最多 3 次，指数退避（100ms → 200ms → 400ms）
- **4xx**：不重试，直接返回错误
- **流式接口（SSE）**：不重试

### 2.4 请求头

所有请求包含以下 Header：
```
Content-Type: application/json
```

---

## 3. API 接口详细定义

### 3.1 创建会话

```
POST {algorithm_base_url}/api/conversations
```

**请求体：**
```json
{
  "user_id": 123,
  "title": "新对话",
  "model": "standard"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 是 | 用户 ID |
| title | string | 否 | 会话标题，可为空 |
| model | string | 否 | 模型名称，默认 "standard" |

**成功响应（200）：**
```json
{
  "code": 0,
  "data": {
    "id": "conv_abc123",
    "title": "新对话",
    "model": "standard",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 会话唯一标识 |
| title | string | 会话标题 |
| model | string | 使用的模型名称 |
| created_at | string (ISO 8601) | 创建时间 |

---

### 3.2 获取会话列表

```
GET {algorithm_base_url}/api/conversations?user_id=123&page=1&page_size=20
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 是 | 用户 ID |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 20 |

**成功响应（200）：**
```json
{
  "code": 0,
  "data": {
    "conversations": [
      {
        "id": "conv_abc123",
        "title": "小说创作讨论",
        "model": "standard",
        "last_message": "好的，我来帮你构思...",
        "message_count": 12,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T12:00:00Z"
      }
    ],
    "total": 1
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| conversations | array | 会话列表 |
| conversations[].id | string | 会话 ID |
| conversations[].title | string | 会话标题 |
| conversations[].model | string | 模型名称 |
| conversations[].last_message | string | 最后一条消息内容（可选） |
| conversations[].message_count | int | 消息数量 |
| conversations[].created_at | string | 创建时间 |
| conversations[].updated_at | string | 更新时间 |
| total | int | 会话总数（用于分页） |

---

### 3.3 删除会话

```
DELETE {algorithm_base_url}/api/conversations/{conversation_id}?user_id=123
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conversation_id | string | 是 | URL 路径参数，会话 ID |
| user_id | uint | 是 | Query 参数，用户 ID |

**成功响应（200）：**
```json
{
  "code": 0,
  "message": "会话已删除"
}
```

**会话不存在（404）：**
```json
{
  "code": -1,
  "message": "会话不存在"
}
```

---

### 3.4 获取会话消息列表

```
GET {algorithm_base_url}/api/conversations/{conversation_id}/messages?user_id=123&page=1&page_size=50
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conversation_id | string | 是 | URL 路径参数，会话 ID |
| user_id | uint | 是 | Query 参数，用户 ID |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 50 |

**成功响应（200）：**
```json
{
  "code": 0,
  "data": {
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "帮我写一个武侠小说的开头",
        "created_at": "2025-01-01T10:00:00Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "天边的残阳如血，映照着...",
        "input_tokens": 25,
        "output_tokens": 150,
        "model": "standard",
        "created_at": "2025-01-01T10:00:05Z"
      }
    ],
    "total": 2
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| messages[].id | string | 消息 ID |
| messages[].role | string | `"user"` 或 `"assistant"` |
| messages[].content | string | 消息内容 |
| messages[].input_tokens | int | 输入 token 数（仅 assistant） |
| messages[].output_tokens | int | 输出 token 数（仅 assistant） |
| messages[].model | string | 使用的模型（仅 assistant） |
| messages[].created_at | string | 创建时间 |
| total | int | 消息总数 |

---

### 3.5 发送消息 — 同步模式

```
POST {algorithm_base_url}/api/conversations/{conversation_id}/messages
```

**请求体：**
```json
{
  "user_id": 123,
  "content": "帮我写一个武侠小说的开头",
  "model": "standard"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 是 | 用户 ID |
| content | string | 是 | 用户消息内容（最大 10000 字符） |
| model | string | 否 | 模型名称，默认 "standard" |

**成功响应（200）：**
```json
{
  "code": 0,
  "data": {
    "message": {
      "id": "msg_002",
      "role": "assistant",
      "content": "天边的残阳如血，映照着...",
      "created_at": "2025-01-01T10:00:05Z"
    },
    "usage": {
      "input_tokens": 25,
      "output_tokens": 150,
      "total_tokens": 175,
      "model": "standard"
    }
  }
}
```

> **重要**：`usage` 字段是**必须**的。BFF 依赖此字段进行积分计费和扣费。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message.id | string | 是 | AI 回复消息 ID |
| message.role | string | 是 | 固定为 `"assistant"` |
| message.content | string | 是 | AI 回复内容 |
| message.created_at | string | 是 | 消息创建时间 |
| usage.input_tokens | int | 是 | 输入 token 数 |
| usage.output_tokens | int | 是 | 输出 token 数 |
| usage.total_tokens | int | 是 | 总 token 数 |
| usage.model | string | 是 | 实际使用的模型名称 |

**BFF 侧处理流程：**

```
用户发送消息
    ↓
1. [BFF] 验证用户认证 + 解析请求体
    ↓
2. [BFF] 调用 BalanceService.CheckBalance() 检查余额
    ↓ 余额不足 → 返回 402 错误（不会调用算法后端）
3. [BFF → 算法后端] POST /api/conversations/{id}/messages
    ↓
4. [BFF] 从响应中提取 usage（input_tokens, output_tokens, model）
    ↓
5. [BFF] 计算积分消耗：
    points = (input_tokens × 输入价格 + output_tokens × 输出价格) ÷ 1000
    ↓
6. [BFF] 调用 BalanceService.Deduct() 扣除积分
    ↓
7. [BFF] 写入 token_usage 表（用量追踪）
    ↓
8. [BFF] 返回 AI 回复 + 用量信息给前端
```

---

### 3.6 流式对话 — SSE 模式 ⭐ 核心

```
POST {algorithm_base_url}/api/conversations/{conversation_id}/stream
Content-Type: application/json
```

**请求体：**
```json
{
  "user_id": 123,
  "content": "帮我写一个武侠小说的开头",
  "model": "standard"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 是 | 用户 ID |
| content | string | 是 | 用户消息内容（最大 10000 字符） |
| model | string | 否 | 模型名称，默认 "standard" |

**成功响应：**

响应 Header：
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

响应 Body（SSE 事件流）：

```
data: {"type": "token", "content": "天"}

data: {"type": "token", "content": "边"}

data: {"type": "token", "content": "的"}

data: {"type": "token", "content": "残阳"}

...

data: {"type": "done", "usage": {"input_tokens": 25, "output_tokens": 150, "total_tokens": 175, "model": "standard"}}

```

#### SSE 事件类型

**token 事件** — 逐 token 输出：
```json
{"type": "token", "content": "天"}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"token"` |
| content | string | 一个或多个 token 的文本 |

**done 事件** — 流结束，包含用量统计：
```json
{
  "type": "done",
  "usage": {
    "input_tokens": 25,
    "output_tokens": 150,
    "total_tokens": 175,
    "model": "standard"
  }
}
```

> **重要**：`done` 事件中的 `usage` 字段是**必须**的。BFF 在流结束后依赖此字段进行积分扣费。如果缺少 usage，BFF 将记录警告日志但不会扣费。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定 `"done"` |
| usage.input_tokens | int | 是 | 输入 token 数 |
| usage.output_tokens | int | 是 | 输出 token 数 |
| usage.total_tokens | int | 是 | 总 token 数 |
| usage.model | string | 是 | 实际使用的模型名称 |

**error 事件** — 流式过程中发生错误：
```json
{"type": "error", "error": "模型推理超时"}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 固定 `"error"` |
| error | string | 错误描述 |

#### SSE 格式注意事项

1. 每行以 `data: ` 开头（注意冒号后有一个空格）
2. 每个事件之间用空行 (`\n\n`) 分隔
3. JSON 必须在一行内，不能跨行
4. 流结束后关闭连接

**BFF 侧处理流程：**

```
用户发送流式消息
    ↓
1. [BFF] 验证用户认证 + 解析请求体
    ↓
2. [BFF] 调用 BalanceService.CheckBalance() 检查余额
    ↓ 余额不足 → 返回 402（不会调用算法后端）
3. [BFF → 算法后端] POST /api/conversations/{id}/stream
    ↓
4. [BFF] 设置 SSE headers，逐行读取算法后端返回的事件流
    ↓
5. [BFF → 前端] 实时转发每一个 token 事件
    ↓
6. [BFF] 拦截 "done" 事件，提取 usage 信息
    ↓
7. [BFF] 流结束后：计算积分 → 调用 BalanceService.Deduct() → 写入 token_usage 表
```

---

## 4. 用量追踪（BFF 已实现）

以下 BFF 接口已实现，对接后会自动产生 `token_usage` 数据：

| BFF 路由 | 说明 | 状态 |
|----------|------|------|
| `GET /api/v1/usage` | 用量概览 | ✅ 已实现 |
| `GET /api/v1/usage/daily` | 每日用量（30天） | ✅ 已实现 |
| `GET /api/v1/usage/daily-extended` | 每日用量+积分 | ✅ 已实现 |
| `GET /api/v1/usage/conversations` | 会话消耗排行 | ✅ 已实现 |

**TokenUsage 数据模型（BFF 自动写入，无需算法后端处理）：**

```go
type TokenUsage struct {
    ID             uint      // 主键
    UserID         uint      // 用户 ID
    ConversationID string    // 会话 ID
    MessageID      string    // 消息 ID
    InputTokens    int       // 输入 token 数
    OutputTokens   int       // 输出 token 数
    TotalTokens    int       // 总 token 数
    Model          string    // 模型名称
    PointsConsumed int64     // 消耗积分
    CreatedAt      time.Time // 创建时间
}
```

---

## 5. 余额与扣费（BFF 已实现）

以下逻辑 BFF 已完全实现，算法后端**无需关心**，只需在响应中返回 `usage` 字段即可：

| 环节 | BFF 处理 |
|------|---------|
| 余额预检 | 发送消息前自动检查余额，不足返回 402 |
| 积分计算 | `points = (input_tokens × 输入价格 + output_tokens × 输出价格) ÷ 1000` |
| 余额扣除 | AI 回复后自动调用 `BalanceService.Deduct()` |
| 用量记录 | 自动写入 `token_usage` 表 |
| 交易记录 | 自动写入 `transactions` 表 |

**扣费时机：**
- **同步消息**（3.5）：收到完整响应后立即扣费
- **流式消息**（3.6）：流结束后（收到 `done` 事件）扣费

模型定价配置在 BFF 的 `config.yaml` 中：
```yaml
balance:
  models:
    - name: "standard"
      display_name: "标准模型"
      input_price: 1    # 每 1000 token 消耗 1 积分
      output_price: 2   # 每 1000 token 消耗 2 积分
    - name: "advanced"
      display_name: "高级模型"
      input_price: 3
      output_price: 6
```

---

## 6. 支付对接（非算法后端，待实现）

以下接口需要对接第三方支付平台（支付宝/微信支付），非算法后端：

| BFF 路由 | 说明 | 状态 |
|----------|------|------|
| `POST /api/v1/recharge/create` | 创建充值订单 | ⚠️ 支付 URL 为 Stub |
| `POST /api/v1/recharge/callback` | 支付回调 | ⚠️ 验签为 Stub |

---

## 7. API 接口汇总

### 算法后端需实现的接口清单

| # | 方法 | URL | 说明 | 请求体 |
|---|------|-----|------|--------|
| 1 | POST | `/api/conversations` | 创建会话 | `{user_id, title?, model?}` |
| 2 | GET | `/api/conversations?user_id=&page=&page_size=` | 获取会话列表 | — |
| 3 | DELETE | `/api/conversations/{id}?user_id=` | 删除会话 | — |
| 4 | GET | `/api/conversations/{id}/messages?user_id=&page=&page_size=` | 获取消息列表 | — |
| 5 | POST | `/api/conversations/{id}/messages` | 发送消息（同步） | `{user_id, content, model?}` |
| 6 | POST | `/api/conversations/{id}/stream` | 流式对话（SSE） | `{user_id, content, model?}` |

### 关键要求

1. **所有响应**必须使用 `{"code": 0, "data": {...}}` 格式
2. **发送消息响应**（接口 5）必须包含 `usage` 字段（input_tokens, output_tokens, total_tokens, model）
3. **SSE 流**（接口 6）结束时必须发送 `done` 事件，包含 `usage` 字段
4. **HTTP 状态码**应正确返回（200/400/404/500/503）
5. **user_id** 由 BFF 传入，算法后端应据此隔离不同用户的数据

---

## 8. 联调测试清单

BFF 已有完整单元测试（31 个），联调时可按以下步骤验证：

| # | 测试场景 | 预期结果 |
|---|---------|---------|
| 1 | `POST /api/v1/chat/conversations` | 创建会话成功，返回会话 ID |
| 2 | `GET /api/v1/chat/conversations` | 返回会话列表 |
| 3 | `POST /api/v1/chat/conversations/{id}/messages` | AI 回复 + 积分扣除 |
| 4 | `POST /api/v1/chat/conversations/{id}/messages/stream` | SSE 逐 token 输出 + 流结束扣费 |
| 5 | `GET /api/v1/chat/conversations/{id}/messages` | 返回历史消息 |
| 6 | `DELETE /api/v1/chat/conversations/{id}` | 删除会话成功 |
| 7 | `GET /api/v1/balance` | 确认积分已扣除 |
| 8 | `GET /api/v1/usage` | 确认 token 用量已记录 |
| 9 | 余额不足时发送消息 | 返回 402 错误 |
| 10 | 算法后端不可用时 | 返回 503 错误 |
