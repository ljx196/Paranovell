# GenNovelWeb

Chat 聊天应用 - 支持 Web / iOS / Android

## 项目结构

```
GenNovelWeb/
├── docs/                    # 文档
│   ├── architecture.md      # 架构设计
│   ├── features.md          # 功能需求
│   └── database.md          # 数据库设计
├── frontend/                # Expo 前端
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── screens/         # 页面
│   │   ├── store/           # Zustand 状态管理
│   │   ├── services/        # API 服务
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript 类型
│   ├── App.tsx
│   └── package.json
└── bff/                     # Go BFF 后端
    ├── cmd/server/          # 主入口
    ├── internal/
    │   ├── config/          # 配置
    │   ├── handler/         # 请求处理
    │   ├── middleware/      # 中间件
    │   ├── model/           # 数据模型
    │   ├── repository/      # 数据访问
    │   └── service/         # 业务逻辑
    ├── pkg/                  # 公共包
    └── go.mod
```

## 技术栈

### 前端
- Expo (React Native)
- TypeScript
- Zustand (状态管理)
- NativeWind (Tailwind CSS)
- FlashList (高性能列表)

### BFF
- Go
- Gin (Web 框架)
- GORM (ORM)
- gorilla/websocket

### 数据层
- PostgreSQL
- Redis

## 快速开始

### 前端

```bash
cd frontend
npm install
npm start
```

### BFF

```bash
cd bff
cp .env.example .env
# 编辑 .env 配置
go run cmd/server/main.go
```

## 运行命令

### 前端
- `npm start` - 启动开发服务器
- `npm run android` - Android 设备运行
- `npm run ios` - iOS 设备运行
- `npm run web` - Web 浏览器运行

### BFF
- `go run cmd/server/main.go` - 启动服务
- `go build -o server cmd/server/main.go` - 构建

## 文档

- [架构设计](./docs/architecture.md)
- [功能需求](./docs/features.md)
- [数据库设计](./docs/database.md)
