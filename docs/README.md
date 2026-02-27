# GenNovelWeb 文档目录

## 目录结构

```
docs/
├── README.md                      # 本文件
├── audit-gaps.md                  # 代码审计：未落地逻辑与安全隐患
├── test-report.md                 # 集成测试与接口测试报告
├── architecture/                  # 系统架构
│   ├── overview.md               # 架构概览、技术栈、部署架构
│   └── database.md               # 数据库设计、表结构、ER图
├── prd/                          # 产品需求文档
│   ├── system-messages.md        # 系统消息功能 PRD
│   ├── account-balance.md        # 账户余额管理系统 PRD
│   └── admin-panel.md            # 管理后台 PRD
├── backend/                      # 后端文档
│   ├── api-messages.md           # 系统消息 API 文档
│   ├── api-account-balance.md    # 账户余额后端技术方案
│   ├── api-admin-panel.md        # 管理后台后端技术方案
│   ├── admin-setup.md            # 管理后台部署与配置指南
│   └── algorithm-api-integration.md  # 算法后端 API 集成方案
├── frontend/                     # 前端文档
│   ├── design-language-modern-minimal.md  # 设计语言 (Modern Minimal)
│   ├── design-system.md          # UI 设计系统技术规范
│   ├── plan-ui-optimization.md   # UI 优化执行计划
│   ├── changelog-ui-optimization.md  # UI 优化变更日志
│   ├── tech-messages.md          # 系统消息页面技术设计
│   ├── tech-account-balance.md   # 账户余额前端技术方案
│   ├── tech-settings.md          # 统一设置页技术方案
│   ├── uiux-admin-panel.md       # 管理后台 UI/UX 设计稿
│   ├── tech-admin-panel.md       # 管理后台前端技术方案
│   └── demos/
│       └── login-modern-minimal.html  # 登录页设计 Demo
└── frontend/ (legacy demos)
    └── demo-admin-panel.html     # 管理后台可交互 Demo
```

---

## 文档索引

### 系统架构

| 文档 | 说明 |
|------|------|
| [架构概览](./architecture/overview.md) | 系统整体架构、技术选型、部署方案 |
| [数据库设计](./architecture/database.md) | Schema 设计、表结构、索引策略 |

### 产品需求 (PRD)

| 文档 | 说明 |
|------|------|
| [系统消息](./prd/system-messages.md) | 消息功能需求、交互设计、验收标准 |
| [账户余额管理](./prd/account-balance.md) | 余额管理、充值、交易流水、用量统计 |
| [管理后台](./prd/admin-panel.md) | 管理后台 PRD（仪表盘、用户/订单/公告管理、系统配置、审计日志） |

### 后端文档

| 文档 | 说明 |
|------|------|
| [消息 API](./backend/api-messages.md) | 系统消息接口文档、请求/响应示例 |
| [账户余额技术方案](./backend/api-account-balance.md) | 余额后端架构、Service 设计、并发安全、API 实现 |
| [管理后台技术方案](./backend/api-admin-panel.md) | 管理后台后端架构、Admin API、中间件、审计日志 |
| [管理后台部署指南](./backend/admin-setup.md) | 超级管理员自动创建、配置方式、测试数据生成、启动步骤 |

### 前端文档 — 设计与规划

| 文档 | 说明 |
|------|------|
| [设计语言](./frontend/design-language-modern-minimal.md) | Modern Minimal 风格规范、交互范式、各页面应用指南 |
| [设计系统](./frontend/design-system.md) | 颜色、字体、间距、组件样式技术规范 |
| [UI 优化计划](./frontend/plan-ui-optimization.md) | 用户端页面 UI 优化执行计划（Phase 0~6） |

### 前端文档 — 功能技术方案

| 文档 | 说明 |
|------|------|
| [消息技术设计](./frontend/tech-messages.md) | 消息页面组件设计、状态管理 |
| [账户余额技术方案](./frontend/tech-account-balance.md) | 余额前端架构、组件设计、Store、API |
| [统一设置页技术方案](./frontend/tech-settings.md) | 设置页整合、导航变更、Bug 修复记录 |

### 前端文档 — 管理后台（独立系统，不参与 UI 优化）

| 文档 | 说明 |
|------|------|
| [管理后台 UI/UX](./frontend/uiux-admin-panel.md) | 管理后台界面设计、布局规格、组件规范 |
| [管理后台技术方案](./frontend/tech-admin-panel.md) | 管理后台前端架构、类型定义、API、Store |

### 前端文档 — 变更记录

| 文档 | 说明 |
|------|------|
| [UI 优化变更日志](./frontend/changelog-ui-optimization.md) | UI 优化各阶段变更记录 |

### 质量保障与审计

| 文档 | 说明 |
|------|------|
| [代码审计报告](./audit-gaps.md) | 代码审计：未落地逻辑、配置空转、安全隐患 |
| [测试报告](./test-report.md) | 集成测试与接口测试报告 |

### 后端文档 — 算法集成

| 文档 | 说明 |
|------|------|
| [算法 API 集成](./backend/algorithm-api-integration.md) | BFF 与算法后端 API 集成方案 |

### 可交互 Demo

| 文档 | 说明 |
|------|------|
| [登录页 Demo](./frontend/demos/login-modern-minimal.html) | Modern Minimal 登录页设计原型 |
| [管理后台 Demo](./frontend/demo-admin-panel.html) | 管理后台界面可交互原型 |

---

## 文档规范

### 命名规则

- 使用小写字母和短横线：`api-messages.md`
- PRD 文档：`功能名.md`
- API 文档：`api-功能名.md`
- 技术设计：`tech-功能名.md`
- 设计文档：`design-*.md`
- 执行计划：`plan-*.md`

### 更新流程

1. 新功能开发前，先编写 PRD
2. 技术评审后，编写技术设计文档
3. 开发完成后，补充 API 文档
4. 文档变更需在末尾更新版本号和日期

---

*最后更新：2026-02-27*
