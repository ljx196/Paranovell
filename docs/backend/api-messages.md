# 系统消息 API 文档

## 概述

系统消息 API 用于管理用户的系统通知，包括账户通知、系统公告和用量提醒。

### 基础信息

| 项目 | 说明 |
|------|------|
| 基础路径 | `/api/v1/messages` |
| 认证方式 | Bearer Token（JWT） |
| 内容类型 | `application/json` |

### 认证说明

所有接口都需要在请求头中携带有效的 JWT Token：

```http
Authorization: Bearer <access_token>
```

---

## 数据结构

### 消息类型 (msg_type)

| 值 | 说明 | 示例场景 |
|-----|------|----------|
| `account` | 账户通知 | 密码修改、邮箱验证、账户安全 |
| `notice` | 系统公告 | 系统维护、新功能上线、活动通知 |
| `usage` | 用量提醒 | Token 用量预警、配额提醒 |

### SystemMessage 对象

```typescript
interface SystemMessage {
  id: number;           // 消息 ID
  title: string;        // 消息标题
  content: string;      // 消息内容（纯文本）
  msg_type: string;     // 消息类型：account | notice | usage
  is_read: boolean;     // 是否已读
  created_at: string;   // 创建时间 (ISO 8601)
  read_at?: string;     // 阅读时间 (ISO 8601)，未读时为 null
}
```

---

## API 接口

### 1. 获取消息列表

获取当前用户的系统消息列表，支持分页和类型筛选。

**请求**

```http
GET /api/v1/messages
```

**Query 参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | int | 否 | 1 | 页码，从 1 开始 |
| `page_size` | int | 否 | 20 | 每页数量，范围 1-100 |
| `msg_type` | string | 否 | - | 消息类型筛选：`account` / `notice` / `usage` |

**请求示例**

```bash
# 获取所有消息（默认分页）
curl -X GET "http://localhost:8080/api/v1/messages" \
  -H "Authorization: Bearer <token>"

# 获取第2页，每页10条
curl -X GET "http://localhost:8080/api/v1/messages?page=2&page_size=10" \
  -H "Authorization: Bearer <token>"

# 只获取账户类型消息
curl -X GET "http://localhost:8080/api/v1/messages?msg_type=account" \
  -H "Authorization: Bearer <token>"
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "messages": [
      {
        "id": 1,
        "title": "密码修改成功",
        "content": "您的账户密码已于 2024年2月2日 14:30 成功修改...",
        "msg_type": "account",
        "is_read": false,
        "created_at": "2024-02-02T14:30:00Z",
        "read_at": null
      },
      {
        "id": 2,
        "title": "系统维护通知",
        "content": "平台将于 2024年2月5日 凌晨进行维护...",
        "msg_type": "notice",
        "is_read": true,
        "created_at": "2024-02-01T09:00:00Z",
        "read_at": "2024-02-01T10:15:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "page_size": 20
  }
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `messages` | array | 消息列表 |
| `total` | int | 符合条件的消息总数 |
| `page` | int | 当前页码 |
| `page_size` | int | 每页数量 |

**错误响应**

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 400 | 400 | 参数错误（msg_type 值无效） |
| 401 | 401 | 未授权（Token 无效或过期） |
| 500 | 500 | 服务器内部错误 |

---

### 2. 获取消息详情

获取单条消息的完整内容。

**请求**

```http
GET /api/v1/messages/:id
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | int | 是 | 消息 ID |

**请求示例**

```bash
curl -X GET "http://localhost:8080/api/v1/messages/1" \
  -H "Authorization: Bearer <token>"
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "密码修改成功",
    "content": "您的账户密码已于 2024年2月2日 14:30 成功修改。\n\n如果这不是您本人的操作，请立即联系客服。\n\n安全提示：\n• 请勿将密码告知他人\n• 定期更换密码以保障账户安全",
    "msg_type": "account",
    "is_read": false,
    "created_at": "2024-02-02T14:30:00Z",
    "read_at": null
  }
}
```

**错误响应**

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 400 | 400 | 无效的消息 ID |
| 401 | 401 | 未授权 |
| 404 | 404 | 消息不存在 |

---

### 3. 标记单条消息已读

将指定消息标记为已读状态。

**请求**

```http
PUT /api/v1/messages/:id/read
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | int | 是 | 消息 ID |

**请求示例**

```bash
curl -X PUT "http://localhost:8080/api/v1/messages/1/read" \
  -H "Authorization: Bearer <token>"
```

**成功响应**

```json
{
  "code": 0,
  "message": "已标记为已读"
}
```

**错误响应**

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 400 | 400 | 无效的消息 ID |
| 401 | 401 | 未授权 |
| 404 | 404 | 消息不存在或已读 |

**说明**
- 如果消息已经是已读状态，返回 404
- 标记成功后会同时更新 `read_at` 字段

---

### 4. 标记全部消息已读

将当前用户的所有未读消息标记为已读。

**请求**

```http
PUT /api/v1/messages/read-all
```

**请求示例**

```bash
curl -X PUT "http://localhost:8080/api/v1/messages/read-all" \
  -H "Authorization: Bearer <token>"
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "marked_count": 5
  }
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `marked_count` | int | 本次标记为已读的消息数量 |

**错误响应**

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 401 | 401 | 未授权 |
| 500 | 500 | 服务器内部错误 |

**说明**
- 如果没有未读消息，`marked_count` 返回 0
- 不会返回错误

---

### 5. 获取未读消息数量

获取当前用户的未读消息总数。

**请求**

```http
GET /api/v1/messages/unread-count
```

**请求示例**

```bash
curl -X GET "http://localhost:8080/api/v1/messages/unread-count" \
  -H "Authorization: Bearer <token>"
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "count": 3
  }
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `count` | int | 未读消息数量 |

**错误响应**

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 401 | 401 | 未授权 |
| 500 | 500 | 服务器内部错误 |

**使用场景**
- 页面初始化时获取未读数，显示在铃铛图标上
- 定时轮询获取最新未读数

---

## 前端集成指南

### TypeScript 类型定义

```typescript
// types/message.ts

export type MessageType = 'account' | 'notice' | 'usage';

export interface SystemMessage {
  id: number;
  title: string;
  content: string;
  msg_type: MessageType;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface MessageListParams {
  page?: number;
  page_size?: number;
  msg_type?: MessageType;
}

export interface MessageListResponse {
  messages: SystemMessage[];
  total: number;
  page: number;
  page_size: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllReadResponse {
  marked_count: number;
}
```

### API 调用示例

```typescript
// services/messageApi.ts

import { apiClient } from './api';

// 获取消息列表
export async function getMessages(params?: MessageListParams): Promise<MessageListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));
  if (params?.msg_type) query.set('msg_type', params.msg_type);

  const response = await apiClient.request(`/messages?${query.toString()}`);
  return response.data;
}

// 获取消息详情
export async function getMessage(id: number): Promise<SystemMessage> {
  const response = await apiClient.request(`/messages/${id}`);
  return response.data;
}

// 标记单条已读
export async function markAsRead(id: number): Promise<void> {
  await apiClient.request(`/messages/${id}/read`, { method: 'PUT' });
}

// 标记全部已读
export async function markAllAsRead(): Promise<MarkAllReadResponse> {
  const response = await apiClient.request('/messages/read-all', { method: 'PUT' });
  return response.data;
}

// 获取未读数量
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.request('/messages/unread-count');
  return response.data.count;
}
```

### 消息图标映射

```typescript
export const MESSAGE_ICONS: Record<MessageType, string> = {
  account: '🔐',
  notice: '📢',
  usage: '📊',
};

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  account: '账户',
  notice: '公告',
  usage: '用量',
};
```

### 时间格式化

```typescript
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN');
}
```

---

## 错误码说明

| HTTP 状态码 | code | message | 说明 |
|-------------|------|---------|------|
| 200 | 0 | success | 请求成功 |
| 400 | 400 | 参数错误 | 请求参数格式错误 |
| 401 | 401 | 未授权 | Token 无效或已过期 |
| 404 | 404 | 消息不存在 | 指定的消息 ID 不存在或无权访问 |
| 500 | 500 | 服务器内部错误 | 服务端异常 |

---

## 数据库表结构

```sql
-- bff_schema.system_messages
CREATE TABLE bff_schema.system_messages (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  title       VARCHAR(100) NOT NULL,
  content     TEXT NOT NULL,
  msg_type    VARCHAR(20) NOT NULL,  -- account | notice | usage
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW(),
  read_at     TIMESTAMP
);

-- 索引
CREATE INDEX idx_system_messages_user_id ON bff_schema.system_messages(user_id);
CREATE INDEX idx_system_messages_user_unread ON bff_schema.system_messages(user_id, is_read)
  WHERE is_read = FALSE;
```

---

## 测试用例

### 使用 curl 测试

```bash
# 设置 Token
TOKEN="your_access_token"

# 1. 获取消息列表
curl -X GET "http://localhost:8080/api/v1/messages" \
  -H "Authorization: Bearer $TOKEN"

# 2. 获取账户类型消息
curl -X GET "http://localhost:8080/api/v1/messages?msg_type=account" \
  -H "Authorization: Bearer $TOKEN"

# 3. 获取消息详情
curl -X GET "http://localhost:8080/api/v1/messages/1" \
  -H "Authorization: Bearer $TOKEN"

# 4. 标记单条已读
curl -X PUT "http://localhost:8080/api/v1/messages/1/read" \
  -H "Authorization: Bearer $TOKEN"

# 5. 标记全部已读
curl -X PUT "http://localhost:8080/api/v1/messages/read-all" \
  -H "Authorization: Bearer $TOKEN"

# 6. 获取未读数量
curl -X GET "http://localhost:8080/api/v1/messages/unread-count" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2026-02-04 | 初始版本，包含完整的消息 CRUD 接口 |

---

*文档版本：1.0*
*创建时间：2026-02-04*
