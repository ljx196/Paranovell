# GenNovel 代码审计：未落地逻辑与配置空转问题

> 审计时间：2026-02-27
> 范围：BFF 后端 (Go/Gin) + Admin 前端 (React/Ant Design) + 用户前端 (Expo/RN)

---

## 一、系统配置空转（Admin UI 可改 → 后端不读）

管理后台「系统配置」页面允许管理员修改 9 项配置，但**后端业务逻辑全部从 YAML 静态读取**，数据库中的 `system_configs` 表实质上是**只写不读**。

### 根因

服务在启动时从 `config.yaml` 加载 `BalanceConfig` 结构体，运行时所有业务逻辑读取的是这个内存中的静态值，从未查询 `system_configs` 表。

```
Admin UI → BatchUpdate() → 写入 system_configs 表 ✅
业务逻辑 → s.cfg.XXX → 从 config.yaml 内存结构体读取 ❌ (不读 DB)
```

### 逐项分析

| 配置键 | Seed 默认值 | 是否被读取 | 说明 |
|--------|------------|-----------|------|
| `registration.enabled` | `true` | **完全空转** | `auth_service.go` Register() 从不检查，任何人都可注册 |
| `registration.invite_only` | `false` | **完全空转** | Register() 不强制要求邀请码，code 为选填 |
| `registration.gift_points` | `1000` | 读 YAML，不读 DB | `balance_service.go` InitBalanceForNewUser() 读 `s.cfg.InitialGiftPoints` |
| `referral.referrer_reward` | `500` | **完全空转** | `HandleReferralReward` 已删除，注册时不再给推荐人发放奖励；充值返利由 `grantRechargeReferralBonus` 使用 `cfg.FirstRechargeBonusRate`，不读此字段 |
| `referral.referee_reward` | `300` | **完全空转** | 无任何代码使用此配置 |
| `balance.low_threshold` | `100` | 读 YAML，不读 DB | `balance_service.go` checkLowBalance() 读 `s.cfg.LowBalanceThreshold`；且 seed 值(100) 与 YAML 默认值(500) 不一致 |
| `recharge.rate` | `100` | 读 YAML，不读 DB | `recharge_service.go` GetConfig()/CreateOrder() 读 `s.cfg.ExchangeRate` |
| `recharge.min_amount` | `10` | 读 YAML，不读 DB | `recharge_service.go` 读 `s.cfg.MinRechargeYuan` |
| `recharge.presets` | `[10,30,50,100,200,500]` | 读 YAML，不读 DB | `recharge_service.go` GetConfig() 读 `s.cfg.RechargePresets` |

**影响**：管理员在后台改了配置 → 保存成功 → 但实际行为不变（需要重启 BFF 才能生效），且 `registration.enabled`、`registration.invite_only`、`referral.referee_reward` 三项即使重启也无效，因为代码中根本没有对应逻辑。

---

## 二、功能未实现 / Stub

### 2.1 ~~[P0] 登出不注销 Token~~ ✅ 已修复

- **文件**：`handler/auth_handler.go`、`middleware/auth.go`
- **修复**：`Logout()` 已实现 Redis Token 黑名单。调用 `blacklistToken(token)` 将 Token 的 SHA256 哈希写入 Redis（key: `token_blacklist:<hash>`，TTL 为 Token 剩余有效期）。`middleware/auth.go` 在每次请求验证时调用 `isTokenBlacklisted(token)` 检查黑名单，Redis 不可用时安全降级（不阻断请求）。

### 2.2 [P0] 支付签名验证是空壳

- **文件**：`service/recharge_service.go:239-241`
- **现状**：
  ```go
  func (s *RechargeService) verifySign(req *dto.PaymentCallbackRequest) bool {
      // TODO: 根据支付平台规则实现验签
      return req.Sign != ""
  }
  ```
  只检查 `Sign` 字段不为空，未做 HMAC/RSA 验签
- **影响**：任意伪造的回调请求都可通过验证，充值金额可被篡改

### 2.3 [P0] 支付下单是 Mock

- **文件**：`service/recharge_service.go:233-235`
- **现状**：
  ```go
  func (s *RechargeService) createPayment(order *model.RechargeOrder) string {
      // TODO: 对接支付宝/微信支付 SDK
      return fmt.Sprintf("/pay/mock?order_no=%s", order.OrderNo)
  }
  ```
  返回 mock URL，未接入真实支付
- **影响**：充值流程不可用于生产

---

## 三、安全隐患

### 3.1 [P0] 邮箱验证默认跳过

- **文件**：`service/auth_service.go:169-178`
- **现状**：
  ```go
  env := os.Getenv("ENV")
  if env == "" {
      env = "development"  // ← 未设置环境变量时默认 development
  }
  if env != "development" {
      return nil, nil, ErrEmailNotVerified
  }
  ```
  如果部署时忘记设置 `ENV` 环境变量，生产环境也会跳过邮箱验证
- **影响**：未验证邮箱的用户可直接登录使用所有功能

### 3.2 [P1] 限流器仅内存

- **文件**：`middleware/ratelimit.go:12`
- **现状**：简单的内存 map 计数，注释标注 `// Replace with Redis-based rate limiter for production`
- **缺陷**：
  - 不区分端点敏感度（登录/注册/支付回调应更严格）
  - 服务重启后状态丢失
  - 多实例部署时各自独立计数
- **影响**：暴力破解密码、批量注册等攻击缺乏有效防护

### 3.3 ~~[P1] 密码强度无要求~~ ✅ 已修复

- **文件**：`utils/password.go`、`handler/auth_handler.go`、`handler/user_handler.go`
- **修复**：新增 `ValidatePasswordComplexity()` 函数，要求密码必须同时包含字母和数字。在 Register、ResetPassword、ChangePassword 三个 Handler 中调用校验。DTO 层仍保留 `min=6,max=50` 长度约束。

### 3.4 [P2] 邮件链接硬编码 localhost

- **文件**：`service/email_service.go:65, 130`
- **现状**：
  ```go
  verifyURL := fmt.Sprintf("http://localhost:8081/verify-email?token=%s", token)
  resetURL  := fmt.Sprintf("http://localhost:8081/reset-password?token=%s", token)
  ```
  TODO 注释标注需要配置化，但尚未实现
- **影响**：生产环境邮件链接不可用

---

## 四、业务逻辑缺陷

### 4.1 ~~[P1] 首充返利异步执行，无事务保障~~ ✅ 已修复

- **文件**：`service/recharge_service.go`、`service/balance_service.go`
- **修复**：
  - `checkFirstRechargeBonus` 已删除，替换为 `grantRechargeReferralBonus`
  - 不再使用 `go func()` 异步执行，改为充值事务成功后**同步调用**（独立事务，失败仅记日志不影响充值主流程）
  - 逻辑从"首充返利"改为"**每次充值返利**"：被邀请人每次充值，推荐人均获得充值点数的 `FirstRechargeBonusRate%` 奖励
  - 注册时不再给推荐人发放奖励（`HandleReferralReward` 已删除）

### 4.2 [P2] 被邀请人奖励逻辑不存在

- **配置**：`referral.referee_reward = 300`（seed 写入 DB）
- **现状**：代码中 `config.go` 有 `RefereeGift` 字段但从未使用。被邀请人注册后不会收到额外奖励
- **影响**：配置存在但功能缺失，管理员可能误以为已生效

### 4.3 [P2] 流式对话用量记录可能丢失

- **文件**：`handler/chat_handler.go:198-202`
- **现状**：如果客户端在流式响应的最后 `done` 事件发送前断开连接，`lastUsage` 为 nil，用量不记录但扣费可能已发生
- **影响**：少量边缘情况下用量统计不准确

---

## 五、前后端不一致

| 问题 | 前端行为 | 后端行为 |
|------|---------|---------|
| 系统配置修改 | 保存成功提示 ✅ | 写入 DB 但不影响运行时行为 ❌ |
| 关闭注册开关 | UI 显示已关闭 | 注册接口仍然可用 |
| 启用仅邀请码注册 | UI 显示已启用 | 注册接口不要求邀请码 |
| 修改充值汇率/最小额 | UI 显示新值 | 实际仍使用 YAML 旧值 |
| 修改充值套餐 | UI 显示新套餐 | 用户端仍显示 YAML 旧套餐 |
| 修改低余额阈值 | UI 显示新阈值 | 预警仍按 YAML 值触发 |
| 删除通知消息 | 前端无删除按钮 | 后端无 DELETE 接口 | 双方一致，非问题 |

---

## 六、优先级汇总

| 优先级 | 问题 | 模块 |
|--------|------|------|
| **P0** | 支付签名验证空壳 | recharge_service |
| **P0** | 支付下单 Mock | recharge_service |
| ~~P0~~ | ~~登出不注销 Token~~ ✅ 已修复 | auth_handler |
| **P0** | 邮箱验证默认跳过 | auth_service |
| **P1** | 系统配置空转（全部 9 项） | 全局 |
| ~~P1~~ | ~~首充返利无事务保障~~ ✅ 已修复（改为同步+每次充值返利） | balance_service |
| **P1** | 限流器仅内存 | middleware |
| ~~P1~~ | ~~密码强度无要求~~ ✅ 已修复（ValidatePasswordComplexity） | dto/auth |
| **P2** | 被邀请人奖励逻辑缺失 | balance_service |
| **P2** | 邮件链接硬编码 | email_service |
| **P2** | 流式用量丢失边缘情况 | chat_handler |

---

## 七、建议修复路径

### 系统配置空转（统一方案）

1. 新建 `service/config_manager.go`，提供 `GetString(key)` / `GetInt(key)` / `GetBool(key)` 方法，从 `system_configs` 表读取并内存缓存（TTL 60s）
2. `admin_config_service.go` 的 `BatchUpdate()` 成功后清除缓存
3. 各业务 service 改用 `ConfigManager` 替代 `config.BalanceConfig` 静态结构体
4. `auth_service.go` Register() 增加 `registration.enabled` 和 `registration.invite_only` 检查

### 安全修复

1. ~~Token 黑名单：Redis SET + Auth 中间件检查~~ ✅ 已实现
2. 支付验签：对接支付平台 SDK（暂未上线可标注为 Coming Soon）
3. ENV 默认值改为 `"production"`
4. ~~密码规则增强~~ ✅ 已实现 `ValidatePasswordComplexity()`（要求字母+数字）
