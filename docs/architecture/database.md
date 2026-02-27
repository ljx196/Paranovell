# GenNovelWeb 数据库设计文档

## 概述

数据库使用 PostgreSQL，通过 Schema 隔离 BFF 和算法后端的数据。

| Schema | 管理方 | BFF 权限 |
|--------|--------|----------|
| `bff_schema` | BFF | 读写 |
| `chat_schema` | 算法后端 | 只读 |

---

## Schema 划分

```
PostgreSQL
├── bff_schema (BFF 读写)
│   ├── users              # 用户表（含 role 字段）
│   ├── user_preferences   # 用户偏好表
│   ├── referrals          # 推荐关系表
│   ├── system_messages    # 系统消息表
│   ├── token_usage        # Token 用量表
│   ├── user_balance       # 用户余额表
│   ├── transactions       # 交易流水表
│   ├── recharge_orders    # 充值订单表
│   ├── admin_audit_logs   # 管理审计日志表
│   └── system_configs     # 系统配置表
│
└── chat_schema (BFF 只读，算法后端读写)
    ├── conversations      # 会话表
    └── messages           # 消息表
```

---

## bff_schema 表设计

### 1. users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 用户 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| nickname | VARCHAR(50) | | 昵称 |
| avatar_url | VARCHAR(500) | | 头像 URL |
| email_verified | BOOLEAN | DEFAULT FALSE | 邮箱是否验证 |
| invite_code | VARCHAR(20) | UNIQUE, NOT NULL | 用户的邀请码 |
| role | VARCHAR(20) | DEFAULT 'user' | 角色：user / admin / super_admin |
| status | SMALLINT | DEFAULT 1 | 状态：1-正常 0-禁用 -1-注销 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | | 删除时间（软删除） |

**索引：**
```sql
CREATE UNIQUE INDEX idx_users_email ON bff_schema.users(email);
CREATE UNIQUE INDEX idx_users_invite_code ON bff_schema.users(invite_code);
CREATE INDEX idx_users_status ON bff_schema.users(status);
CREATE INDEX idx_users_role ON bff_schema.users(role);
```

---

### 2. user_preferences（用户偏好表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| user_id | BIGINT | UNIQUE, NOT NULL, FK | 用户 ID |
| theme | VARCHAR(20) | DEFAULT 'system' | 主题：light/dark/system |
| language | VARCHAR(10) | DEFAULT 'zh-CN' | 语言 |
| notification_enabled | BOOLEAN | DEFAULT TRUE | 是否开启通知 |
| settings_json | JSONB | | 其他设置（扩展用） |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引：**
```sql
CREATE UNIQUE INDEX idx_user_preferences_user_id ON bff_schema.user_preferences(user_id);
```

---

### 3. referrals（推荐关系表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| referrer_id | BIGINT | NOT NULL, FK | 推荐人 ID |
| referee_id | BIGINT | UNIQUE, NOT NULL, FK | 被推荐人 ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 绑定时间 |

**约束：**
- `referee_id` 唯一，一个用户只能被推荐一次
- `referrer_id != referee_id`

**索引：**
```sql
CREATE UNIQUE INDEX idx_referrals_referee_id ON bff_schema.referrals(referee_id);
CREATE INDEX idx_referrals_referrer_id ON bff_schema.referrals(referrer_id);
```

---

### 4. system_messages（系统消息表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| user_id | BIGINT | NOT NULL, FK | 接收用户 ID |
| title | VARCHAR(100) | NOT NULL | 消息标题 |
| content | TEXT | NOT NULL | 消息内容 |
| msg_type | VARCHAR(20) | NOT NULL | 类型：account/notice/usage |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| read_at | TIMESTAMP | | 阅读时间 |

**索引：**
```sql
CREATE INDEX idx_system_messages_user_id ON bff_schema.system_messages(user_id);
CREATE INDEX idx_system_messages_user_unread ON bff_schema.system_messages(user_id, is_read) WHERE is_read = FALSE;
```

---

### 5. token_usage（Token 用量表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| user_id | BIGINT | NOT NULL, FK | 用户 ID |
| conversation_id | BIGINT | NOT NULL | 会话 ID |
| message_id | BIGINT | NOT NULL | 消息 ID |
| input_tokens | INT | NOT NULL | 输入 Token 数 |
| output_tokens | INT | NOT NULL | 输出 Token 数 |
| total_tokens | INT | NOT NULL | 总 Token 数 |
| points_consumed | DECIMAL(10,2) | DEFAULT 0 | 消耗点数 |
| model | VARCHAR(50) | | 使用的模型 |
| created_at | TIMESTAMP | DEFAULT NOW() | 记录时间 |

**索引：**
```sql
CREATE INDEX idx_token_usage_user_id ON bff_schema.token_usage(user_id);
CREATE INDEX idx_token_usage_user_date ON bff_schema.token_usage(user_id, created_at);
CREATE INDEX idx_token_usage_conversation ON bff_schema.token_usage(conversation_id);
```

---

### 6. user_balance（用户余额表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| user_id | BIGINT | UNIQUE, NOT NULL, FK | 用户 ID |
| balance | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | 当前余额（点数） |
| total_recharged | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | 累计充值 |
| total_consumed | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | 累计消费 |
| total_gifted | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | 累计赠送 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引：**
```sql
CREATE UNIQUE INDEX idx_user_balance_user_id ON bff_schema.user_balance(user_id);
```

---

### 7. transactions（交易流水表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| user_id | BIGINT | NOT NULL, FK | 用户 ID |
| type | VARCHAR(20) | NOT NULL | 类型：recharge/consume/gift/adjust |
| amount | DECIMAL(12,2) | NOT NULL | 变动金额（正为收入，负为支出） |
| balance_after | DECIMAL(12,2) | NOT NULL | 变动后余额 |
| ref_type | VARCHAR(30) | | 关联类型：recharge_order/token_usage/admin_adjust |
| ref_id | VARCHAR(100) | | 关联 ID |
| description | VARCHAR(200) | | 描述 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引：**
```sql
CREATE INDEX idx_transactions_user_id ON bff_schema.transactions(user_id);
CREATE INDEX idx_transactions_user_date ON bff_schema.transactions(user_id, created_at);
CREATE INDEX idx_transactions_type ON bff_schema.transactions(type);
```

---

### 8. recharge_orders（充值订单表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| user_id | BIGINT | NOT NULL, FK | 用户 ID |
| order_no | VARCHAR(64) | UNIQUE, NOT NULL | 订单号 |
| amount | DECIMAL(10,2) | NOT NULL | 充值金额（元） |
| points | DECIMAL(12,2) | NOT NULL | 获得点数 |
| payment_method | VARCHAR(20) | | 支付方式：alipay/wechat |
| status | SMALLINT | NOT NULL, DEFAULT 0 | 状态：0-待支付 1-已支付 2-已取消 3-已退款 |
| paid_at | TIMESTAMP | | 支付时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引：**
```sql
CREATE UNIQUE INDEX idx_recharge_orders_order_no ON bff_schema.recharge_orders(order_no);
CREATE INDEX idx_recharge_orders_user_id ON bff_schema.recharge_orders(user_id);
CREATE INDEX idx_recharge_orders_status ON bff_schema.recharge_orders(status);
CREATE INDEX idx_recharge_orders_created ON bff_schema.recharge_orders(created_at);
```

---

### 9. admin_audit_logs（管理审计日志表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| admin_id | BIGINT | NOT NULL, FK | 操作管理员 ID |
| action | VARCHAR(50) | NOT NULL | 操作类型：ban_user/adjust_balance/... |
| target_type | VARCHAR(30) | NOT NULL | 目标类型：user/order/announcement/config |
| target_id | VARCHAR(100) | | 目标 ID |
| detail | JSONB | | 操作详情（JSON） |
| ip_address | VARCHAR(45) | | 操作 IP |
| created_at | TIMESTAMP | DEFAULT NOW() | 操作时间 |

**索引：**
```sql
CREATE INDEX idx_admin_audit_logs_admin_id ON bff_schema.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON bff_schema.admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_target ON bff_schema.admin_audit_logs(target_type, target_id);
CREATE INDEX idx_admin_audit_logs_created ON bff_schema.admin_audit_logs(created_at);
```

---

### 10. system_configs（系统配置表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 主键 |
| config_key | VARCHAR(100) | UNIQUE, NOT NULL | 配置键 |
| config_value | JSONB | NOT NULL | 配置值（JSON） |
| description | VARCHAR(200) | | 配置说明 |
| updated_by | BIGINT | | 最后更新的管理员 ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**预置配置项：**

| config_key | 说明 | 默认值示例 |
|------------|------|-----------|
| `register_gift_points` | 注册赠送点数 | `100` |
| `referral_reward_points` | 推荐奖励点数 | `50` |
| `point_rate` | 点数费率（每 1000 Token） | `1.0` |
| `daily_free_points` | 每日免费点数 | `0` |
| `maintenance_mode` | 维护模式 | `false` |

**索引：**
```sql
CREATE UNIQUE INDEX idx_system_configs_key ON bff_schema.system_configs(config_key);
```

---

## chat_schema 表设计

> 以下表由算法后端管理，BFF 只读访问

### 1. conversations（会话表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 会话 ID |
| user_id | BIGINT | NOT NULL | 用户 ID |
| title | VARCHAR(100) | | 会话标题 |
| status | SMALLINT | DEFAULT 1 | 状态：1-正常 0-删除 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引：**
```sql
CREATE INDEX idx_conversations_user_id ON chat_schema.conversations(user_id);
CREATE INDEX idx_conversations_user_status ON chat_schema.conversations(user_id, status);
```

---

### 2. messages（消息表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 消息 ID |
| conversation_id | BIGINT | NOT NULL, FK | 会话 ID |
| user_id | BIGINT | NOT NULL | 用户 ID |
| role | VARCHAR(20) | NOT NULL | 角色：user/assistant/system |
| content | TEXT | NOT NULL | 消息内容 |
| status | SMALLINT | DEFAULT 1 | 状态：0-发送中 1-成功 2-失败 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引：**
```sql
CREATE INDEX idx_messages_conversation_id ON chat_schema.messages(conversation_id);
CREATE INDEX idx_messages_conversation_created ON chat_schema.messages(conversation_id, created_at);
```

---

## ER 图

```
bff_schema

┌─────────────────┐       ┌─────────────────────┐
│     users       │       │  user_preferences   │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │───1:1─│ user_id (FK,UK)     │
│ email (UK)      │       │ theme               │
│ password_hash   │       │ language            │
│ nickname        │       │ notification_enabled│
│ avatar_url      │       │ settings_json       │
│ email_verified  │       └─────────────────────┘
│ invite_code (UK)│
│ role            │       ┌─────────────────────┐
│ status          │       │    referrals        │
└────────┬────────┘       ├─────────────────────┤
         │                │ referrer_id (FK)    │
         ├───1:N──────────│ referee_id (FK,UK)  │
         │                └─────────────────────┘
         │
         │                ┌─────────────────────┐
         ├───1:N──────────│  system_messages    │
         │                ├─────────────────────┤
         │                │ user_id (FK)        │
         │                │ title, content      │
         │                │ msg_type, is_read   │
         │                └─────────────────────┘
         │
         │                ┌─────────────────────┐
         ├───1:N──────────│    token_usage      │
         │                ├─────────────────────┤
         │                │ user_id (FK)        │
         │                │ conversation_id     │
         │                │ tokens, points      │
         │                └─────────────────────┘
         │
         │                ┌─────────────────────┐
         ├───1:1──────────│   user_balance      │
         │                ├─────────────────────┤
         │                │ user_id (FK,UK)     │
         │                │ balance             │
         │                │ total_recharged     │
         │                │ total_consumed      │
         │                └─────────────────────┘
         │
         │                ┌─────────────────────┐
         ├───1:N──────────│   transactions      │
         │                ├─────────────────────┤
         │                │ user_id (FK)        │
         │                │ type, amount        │
         │                │ balance_after       │
         │                │ ref_type, ref_id    │
         │                └─────────────────────┘
         │
         │                ┌─────────────────────┐
         ├───1:N──────────│  recharge_orders    │
         │                ├─────────────────────┤
         │                │ user_id (FK)        │
         │                │ order_no (UK)       │
         │                │ amount, points      │
         │                │ status              │
         │                └─────────────────────┘
         │
         │  (admin_id)    ┌─────────────────────┐
         ├───1:N──────────│ admin_audit_logs    │
         │                ├─────────────────────┤
         │                │ admin_id (FK)       │
         │                │ action              │
         │                │ target_type/id      │
         │                │ detail (JSONB)      │
         │                │ ip_address          │
         │                └─────────────────────┘

                          ┌─────────────────────┐
                          │  system_configs     │
                          ├─────────────────────┤
                          │ config_key (UK)     │
                          │ config_value (JSONB)│
                          │ description         │
                          │ updated_by          │
                          └─────────────────────┘


chat_schema

┌─────────────────┐       ┌─────────────────────┐
│  conversations  │       │      messages       │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │───1:N─│ conversation_id(FK) │
│ user_id         │       │ user_id             │
│ title           │       │ role                │
│ status          │       │ content             │
└─────────────────┘       │ status              │
                          └─────────────────────┘
```

---

## 统计查询示例

### 用户 Token 用量汇总（按日）

```sql
SELECT
    DATE(created_at) AS date,
    SUM(input_tokens) AS total_input,
    SUM(output_tokens) AS total_output,
    SUM(total_tokens) AS total
FROM bff_schema.token_usage
WHERE user_id = ?
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 用户推荐人数统计

```sql
SELECT COUNT(*) AS referral_count
FROM bff_schema.referrals
WHERE referrer_id = ?;
```

### 用户未读消息数

```sql
SELECT COUNT(*) AS unread_count
FROM bff_schema.system_messages
WHERE user_id = ? AND is_read = FALSE;
```

### 仪表盘统计（管理后台）

```sql
-- 用户总数 & 今日新增
SELECT
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS today_new
FROM bff_schema.users
WHERE deleted_at IS NULL;

-- 总充值金额 & 今日充值
SELECT
    COALESCE(SUM(amount), 0) AS total_revenue,
    COALESCE(SUM(amount) FILTER (WHERE DATE(paid_at) = CURRENT_DATE), 0) AS today_revenue
FROM bff_schema.recharge_orders
WHERE status = 1;

-- 总消费点数
SELECT COALESCE(SUM(total_consumed), 0) AS total_consumed
FROM bff_schema.user_balance;
```

### 审计日志查询

```sql
SELECT al.*, u.nickname AS admin_name
FROM bff_schema.admin_audit_logs al
LEFT JOIN bff_schema.users u ON al.admin_id = u.id
WHERE al.created_at >= ? AND al.created_at <= ?
ORDER BY al.created_at DESC
LIMIT 20 OFFSET 0;
```

---

## 数据库权限设置

```sql
-- 创建 Schema
CREATE SCHEMA IF NOT EXISTS bff_schema;
CREATE SCHEMA IF NOT EXISTS chat_schema;

-- BFF 用户权限
GRANT USAGE ON SCHEMA bff_schema TO bff_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bff_schema TO bff_user;

GRANT USAGE ON SCHEMA chat_schema TO bff_user;
GRANT SELECT ON ALL TABLES IN SCHEMA chat_schema TO bff_user;

-- 算法后端用户权限
GRANT USAGE ON SCHEMA chat_schema TO algo_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA chat_schema TO algo_user;
```

---

*文档创建时间：2026-02-02*
*最后更新时间：2026-02-07*
