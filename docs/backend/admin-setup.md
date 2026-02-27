# 管理后台 — 部署与配置指南

## 1. 超级管理员账号

### 1.1 自动创建机制

BFF 服务启动时会自动检查并创建超级管理员账号，逻辑如下：

1. 读取 `config.yaml` 或环境变量中的 `admin` 配置
2. 查询数据库中是否已存在该邮箱的用户
3. **不存在** → 创建用户（role=`super_admin`，email_verified=`true`），同时创建余额记录
4. **已存在但 role 非 super_admin** → 更新 role 为 `super_admin`
5. **已存在且 role 正确** → 跳过，不修改密码

该流程在 `database.InitSchema()` 之后、Redis 初始化之前执行，代码位于：

```
bff/internal/database/seed.go → EnsureAdmin()
bff/cmd/server/main.go        → 调用 EnsureAdmin()
```

### 1.2 配置方式

#### 方式一：config.yaml（开发环境）

```yaml
admin:
  email: "admin@gennovel.com"
  password: "Admin@2026"
  nickname: "超级管理员"
```

#### 方式二：环境变量（生产环境推荐）

```bash
export ADMIN_EMAIL="admin@gennovel.com"
export ADMIN_PASSWORD="your-strong-password"
export ADMIN_NICKNAME="超级管理员"
```

环境变量优先级高于 config.yaml。

### 1.3 默认值

| 字段 | 默认值 | 说明 |
|------|--------|------|
| email | `admin@gennovel.com` | 登录邮箱 |
| password | `Admin@2026` | 登录密码 |
| nickname | `超级管理员` | 显示昵称 |

> **安全提醒**：生产环境部署前务必修改默认密码，建议通过环境变量传入。

### 1.4 修改密码

管理员账号创建后，修改密码有两种方式：

1. **修改配置 + 删除数据库记录**：删除 `bff_schema.users` 中该邮箱的记录，修改配置后重启服务
2. **通过 API**：登录后调用 `PUT /api/v1/user/password` 接口

注意：若账号已存在，重启服务**不会**覆盖已有密码，仅确保 role 为 `super_admin`。

---

## 2. 测试数据生成

项目提供了独立的 seed 脚本，用于填充测试数据：

```bash
cd bff && go run cmd/seed/main.go
```

生成内容：

| 数据 | 数量 | 说明 |
|------|------|------|
| 管理员 | 1 | 使用 config 中配置的账号 |
| 普通用户 | 20 | 含 2 个封禁用户、1 个未验证用户 |
| 用户余额 | 20 | 余额 0~48500 不等 |
| 充值订单 | ~60 | 4 种状态混合 |
| 交易流水 | ~120 | 5 种类型 |
| 系统公告 | 140 | 7 条公告 × 20 用户 |
| 系统配置 | 9 | 注册/邀请/余额/充值 |
| 审计日志 | 12 | 封禁/调账/公告/配置等 |

seed 脚本具有幂等性：已存在的数据不会重复创建。

---

## 3. 启动步骤

### 3.1 开发环境

```bash
# 1. 启动后端（自动创建管理员账号 + 初始化表结构）
cd bff && go run cmd/server/main.go

# 2. （可选）填充测试数据
cd bff && go run cmd/seed/main.go

# 3. 启动管理前端
cd admin && npm run dev
```

访问 `http://localhost:3001/admin/login`，使用配置中的管理员账号登录。

### 3.2 生产环境

```bash
# 通过环境变量配置管理员账号
export ADMIN_EMAIL="admin@yourcompany.com"
export ADMIN_PASSWORD="$(openssl rand -base64 24)"
export ADMIN_NICKNAME="系统管理员"

# 构建并启动
cd bff && go build -o server cmd/server/main.go
./server
```

---

## 4. 服务架构

```
启动流程:
  Load Config
    ↓
  Init JWT
    ↓
  Init Database + Schema Migration
    ↓
  EnsureAdmin ← 自动创建/验证管理员账号
    ↓
  Init Redis
    ↓
  Init Services (Balance, Recharge, Admin, ...)
    ↓
  Register Routes (/api/v1/*, /api/admin/*)
    ↓
  Start HTTP Server (:8080)
```

管理端 API 路径：`/api/admin/*`，需要 JWT Token + role 为 `admin` 或 `super_admin`。

---

*文档版本：1.0*
*创建日期：2026-02-07*
