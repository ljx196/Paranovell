package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/model"
	"github.com/gennovelweb/bff/internal/utils"
	"gorm.io/gorm"
)

func main() {
	log.Println("=== GenNovel Admin Test Data Seed ===")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := database.Init(&cfg.Database); err != nil {
		log.Fatalf("Failed to init database: %v", err)
	}
	defer database.Close()

	if err := database.InitSchema(); err != nil {
		log.Fatalf("Failed to init schema: %v", err)
	}

	db := database.GetDB()

	// ==================== 1. 管理员账号 ====================
	adminUser := seedAdmin(db)
	log.Printf("[1/7] 管理员账号就绪: %s (ID:%d)", adminUser.Email, adminUser.ID)

	// ==================== 2. 普通用户 ====================
	users := seedUsers(db)
	log.Printf("[2/7] 创建了 %d 个测试用户", len(users))

	// ==================== 3. 用户余额 ====================
	seedBalances(db, users)
	log.Printf("[3/7] 用户余额已生成")

	// ==================== 4. 充值订单 ====================
	seedOrders(db, users)
	log.Printf("[4/7] 充值订单已生成")

	// ==================== 5. 交易流水 ====================
	seedTransactions(db, users)
	log.Printf("[5/7] 交易流水已生成")

	// ==================== 6. 系统公告 ====================
	seedAnnouncements(db, users)
	log.Printf("[6/7] 系统公告已生成")

	// ==================== 7. 系统配置 + 审计日志 ====================
	seedConfigs(db)
	seedAuditLogs(db, adminUser, users)
	log.Printf("[7/7] 系统配置 + 审计日志已生成")

	fmt.Println("\n==========================================")
	fmt.Println("  测试数据生成完毕!")
	fmt.Println("  管理员邮箱: admin@gennovel.com")
	fmt.Println("  管理员密码: Admin@2026")
	fmt.Println("==========================================")
}

// ==================== 管理员 ====================

func seedAdmin(db *gorm.DB) model.User {
	email := "admin@gennovel.com"
	var existing model.User
	if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
		if existing.Role != "super_admin" {
			db.Model(&existing).Update("role", "super_admin")
		}
		return existing
	}

	hash, _ := utils.HashPassword("Admin@2026")
	admin := model.User{
		Email:         email,
		PasswordHash:  hash,
		Nickname:      "超级管理员",
		Role:          "super_admin",
		Status:        1,
		EmailVerified: true,
		InviteCode:    utils.GenerateInviteCode(),
	}
	db.Create(&admin)
	db.Create(&model.UserBalance{UserID: admin.ID, Balance: 999999})
	return admin
}

// ==================== 普通用户 ====================

func seedUsers(db *gorm.DB) []model.User {
	type userSeed struct {
		email    string
		nickname string
		status   int8
		verified bool
	}

	seeds := []userSeed{
		{"zhang.san@example.com", "张三", 1, true},
		{"li.si@example.com", "李四", 1, true},
		{"wang.wu@example.com", "王五", 1, true},
		{"zhao.liu@example.com", "赵六", 1, true},
		{"chen.qi@example.com", "陈七", 1, true},
		{"liu.ba@example.com", "刘八", 1, false},
		{"sun.jiu@example.com", "孙九", 1, true},
		{"zhou.shi@example.com", "周十", 0, true}, // 封禁
		{"wu.shiyi@example.com", "吴十一", 1, true},
		{"zheng.shier@example.com", "郑十二", 1, true},
		{"feng.shisan@example.com", "冯十三", 1, true},
		{"zhu.shisi@example.com", "朱十四", 0, true}, // 封禁
		{"qian.shiwu@example.com", "钱十五", 1, true},
		{"hu.shiliu@example.com", "胡十六", 1, true},
		{"gao.shiqi@example.com", "高十七", 1, true},
		{"lin.shiba@example.com", "林十八", 1, true},
		{"he.shijiu@example.com", "何十九", 1, true},
		{"ma.ershi@example.com", "马二十", 1, true},
		{"luo.ershiyi@example.com", "罗二十一", 1, true},
		{"xiao.ershier@example.com", "肖二十二", 1, true},
	}

	hash, _ := utils.HashPassword("Test@1234")
	var users []model.User
	now := time.Now()

	for i, s := range seeds {
		var existing model.User
		if err := db.Where("email = ?", s.email).First(&existing).Error; err == nil {
			users = append(users, existing)
			continue
		}

		daysAgo := rand.Intn(90) + 1
		user := model.User{
			Email:         s.email,
			PasswordHash:  hash,
			Nickname:      s.nickname,
			Role:          "user",
			Status:        s.status,
			EmailVerified: s.verified,
			InviteCode:    utils.GenerateInviteCode(),
			CreatedAt:     now.AddDate(0, 0, -daysAgo),
		}

		if i < 5 {
			user.AvatarURL = fmt.Sprintf("https://api.dicebear.com/7.x/avataaars/svg?seed=%s", s.nickname)
		}

		db.Create(&user)
		users = append(users, user)
	}

	return users
}

// ==================== 用户余额 ====================

func seedBalances(db *gorm.DB, users []model.User) {
	balanceSets := []struct {
		balance   int64
		recharged int64
		consumed  int64
		gifted    int64
	}{
		{15800, 20000, 5200, 1000},
		{3200, 5000, 2800, 1000},
		{48500, 50000, 2500, 1000},
		{800, 10000, 10200, 1000},
		{22000, 30000, 9000, 1000},
		{1000, 0, 0, 1000},
		{9500, 10000, 1500, 1000},
		{0, 5000, 5000, 0},
		{35000, 50000, 16000, 1000},
		{12500, 20000, 8500, 1000},
		{6800, 10000, 4200, 1000},
		{0, 2000, 2000, 0},
		{28000, 30000, 3000, 1000},
		{4500, 5000, 1500, 1000},
		{18000, 20000, 3000, 1000},
		{7200, 10000, 3800, 1000},
		{950, 2000, 2050, 1000},
		{42000, 50000, 9000, 1000},
		{13500, 20000, 7500, 1000},
		{5000, 5000, 1000, 1000},
	}

	for i, u := range users {
		var existing model.UserBalance
		if err := db.Where("user_id = ?", u.ID).First(&existing).Error; err == nil {
			continue
		}
		idx := i % len(balanceSets)
		b := balanceSets[idx]
		db.Create(&model.UserBalance{
			UserID:         u.ID,
			Balance:        b.balance,
			TotalRecharged: b.recharged,
			TotalConsumed:  b.consumed,
			TotalGifted:    b.gifted,
		})
	}
}

// ==================== 充值订单 ====================

func seedOrders(db *gorm.DB, users []model.User) {
	var count int64
	db.Model(&model.RechargeOrder{}).Count(&count)
	if count > 10 {
		return
	}

	now := time.Now()
	methods := []string{"alipay", "wechat"}
	presets := []struct {
		yuan   float64
		points int64
	}{
		{10, 1000}, {30, 3200}, {50, 5500}, {100, 12000},
		{200, 25000}, {500, 65000},
	}

	orderIdx := 0
	for _, u := range users {
		numOrders := rand.Intn(4) + 1
		for j := 0; j < numOrders; j++ {
			orderIdx++
			p := presets[rand.Intn(len(presets))]
			method := methods[rand.Intn(2)]
			daysAgo := rand.Intn(60) + 1
			createdAt := now.AddDate(0, 0, -daysAgo).Add(time.Duration(rand.Intn(86400)) * time.Second)

			status := int8(1) // 大部分已支付
			var paidAt *time.Time
			r := rand.Intn(10)
			if r < 2 {
				status = 0 // 待支付
			} else if r < 3 {
				status = 2 // 已取消
			} else if r < 4 {
				status = 3 // 已退款
			}

			if status == 1 || status == 3 {
				t := createdAt.Add(time.Duration(rand.Intn(300)+30) * time.Second)
				paidAt = &t
			}

			order := model.RechargeOrder{
				UserID:        u.ID,
				OrderNo:       fmt.Sprintf("ORD%s%04d", now.Format("20060102"), orderIdx),
				AmountYuan:    p.yuan,
				Points:        p.points,
				PaymentMethod: method,
				Status:        status,
				PaidAt:        paidAt,
				CreatedAt:     createdAt,
			}
			db.Create(&order)
		}
	}
}

// ==================== 交易流水 ====================

func seedTransactions(db *gorm.DB, users []model.User) {
	var count int64
	db.Model(&model.Transaction{}).Count(&count)
	if count > 20 {
		return
	}

	now := time.Now()
	txTypes := []struct {
		typ    string
		desc   string
		amount int64
	}{
		{"recharge", "充值 ¥100 套餐", 12000},
		{"recharge", "充值 ¥50 套餐", 5500},
		{"recharge", "充值 ¥30 套餐", 3200},
		{"consumption", "AI 对话消耗", -150},
		{"consumption", "AI 小说生成消耗", -800},
		{"consumption", "AI 对话消耗", -200},
		{"consumption", "AI 角色创建消耗", -500},
		{"gift", "新用户注册赠送", 1000},
		{"referral", "邀请好友奖励", 500},
		{"refund", "订单退款", 5500},
	}

	for _, u := range users {
		balance := int64(20000)
		numTx := rand.Intn(8) + 3
		for j := 0; j < numTx; j++ {
			tx := txTypes[rand.Intn(len(txTypes))]
			daysAgo := rand.Intn(60) + 1

			amount := tx.amount
			if tx.typ == "consumption" {
				amount = -(int64(rand.Intn(800)) + 50)
			}
			balance += amount
			if balance < 0 {
				balance = int64(rand.Intn(5000))
			}

			db.Create(&model.Transaction{
				UserID:       u.ID,
				Type:         tx.typ,
				Amount:       amount,
				BalanceAfter: balance,
				Description:  tx.desc,
				CreatedAt:    now.AddDate(0, 0, -daysAgo).Add(time.Duration(rand.Intn(86400)) * time.Second),
			})
		}
	}
}

// ==================== 系统公告 ====================

func seedAnnouncements(db *gorm.DB, users []model.User) {
	var count int64
	db.Model(&model.SystemMessage{}).Where("msg_type = 'notice'").Count(&count)
	if count > 5 {
		return
	}

	now := time.Now()
	announcements := []struct {
		title   string
		content string
		msgType string
		daysAgo int
	}{
		{"系统升级通知", "平台将于本周六凌晨 2:00-4:00 进行系统升级，届时服务将短暂中断，请提前保存您的工作。", "notice", 1},
		{"春节充值优惠", "即日起至 2 月底，充值 ¥100 额外赠送 2000 点！充值 ¥500 赠送 12000 点！", "notice", 3},
		{"新功能上线：AI 角色创建", "全新 AI 角色创建功能已上线，支持自定义角色性格、背景、说话风格，快来试试吧！", "notice", 7},
		{"账户安全提醒", "近期发现部分用户密码过于简单，请及时修改密码以保护账户安全。", "account", 5},
		{"用量提醒", "您本月的 Token 消耗已达到上限的 80%，请关注余额变化。", "usage", 2},
		{"服务器迁移完成", "我们已完成服务器迁移至新机房，响应速度提升 50%，感谢您的耐心等待。", "notice", 14},
		{"写作大赛通知", "GenNovel 首届 AI 写作大赛即将开始，一等奖 50000 点积分！报名截止 3 月 1 日。", "notice", 10},
	}

	for _, a := range announcements {
		// 给所有用户发送公告
		for _, u := range users {
			isRead := rand.Float64() < 0.6
			var readAt *time.Time
			createdAt := now.AddDate(0, 0, -a.daysAgo)
			if isRead {
				t := createdAt.Add(time.Duration(rand.Intn(86400*2)) * time.Second)
				readAt = &t
			}

			db.Create(&model.SystemMessage{
				UserID:    u.ID,
				Title:     a.title,
				Content:   a.content,
				MsgType:   a.msgType,
				IsRead:    isRead,
				CreatedAt: createdAt,
				ReadAt:    readAt,
			})
		}
	}
}

// ==================== 系统配置 ====================

func seedConfigs(db *gorm.DB) {
	var count int64
	db.Model(&model.SystemConfig{}).Count(&count)
	if count > 0 {
		return
	}

	configs := []struct {
		key   string
		value interface{}
		desc  string
	}{
		{"registration.enabled", true, "是否开放注册"},
		{"registration.invite_only", false, "是否仅限邀请码注册"},
		{"registration.gift_points", 1000, "新用户注册赠送积分"},
		{"referral.referrer_reward", 500, "邀请人奖励积分"},
		{"referral.referee_reward", 300, "被邀请人奖励积分"},
		{"balance.low_threshold", 100, "低余额预警阈值"},
		{"recharge.rate", 100, "充值兑换比率（元→点）"},
		{"recharge.min_amount", 10, "最低充值金额（元）"},
		{"recharge.presets", []int{10, 30, 50, 100, 200, 500}, "充值套餐预设"},
	}

	for _, c := range configs {
		val, _ := json.Marshal(c.value)
		db.Create(&model.SystemConfig{
			ConfigKey:   c.key,
			ConfigValue: val,
			Description: c.desc,
		})
	}
}

// ==================== 审计日志 ====================

func seedAuditLogs(db *gorm.DB, admin model.User, users []model.User) {
	var count int64
	db.Model(&model.AdminAuditLog{}).Count(&count)
	if count > 5 {
		return
	}

	now := time.Now()

	logs := []struct {
		action     string
		targetType string
		targetID   string
		detail     map[string]interface{}
		daysAgo    int
	}{
		{
			model.AuditUserDisable, model.TargetTypeUser,
			fmt.Sprintf("%d", users[7].ID),
			map[string]interface{}{"email": users[7].Email, "reason": "发布违规内容，多次警告无效"},
			2,
		},
		{
			model.AuditUserDisable, model.TargetTypeUser,
			fmt.Sprintf("%d", users[11].ID),
			map[string]interface{}{"email": users[11].Email, "reason": "恶意刷量，滥用 API"},
			5,
		},
		{
			model.AuditUserAdjustBal, model.TargetTypeUser,
			fmt.Sprintf("%d", users[0].ID),
			map[string]interface{}{"email": users[0].Email, "type": "increase", "amount": 5000, "reason": "活动补偿"},
			1,
		},
		{
			model.AuditUserAdjustBal, model.TargetTypeUser,
			fmt.Sprintf("%d", users[3].ID),
			map[string]interface{}{"email": users[3].Email, "type": "decrease", "amount": 2000, "reason": "扣除异常积分"},
			3,
		},
		{
			model.AuditUserResetPwd, model.TargetTypeUser,
			fmt.Sprintf("%d", users[4].ID),
			map[string]interface{}{"email": users[4].Email, "send_email": true},
			4,
		},
		{
			model.AuditMsgBroadcast, model.TargetTypeMessage,
			"batch",
			map[string]interface{}{"title": "系统升级通知", "target": "all", "recipient_count": len(users)},
			1,
		},
		{
			model.AuditMsgBroadcast, model.TargetTypeMessage,
			"batch",
			map[string]interface{}{"title": "春节充值优惠", "target": "all", "recipient_count": len(users)},
			3,
		},
		{
			model.AuditConfigUpdate, model.TargetTypeConfig,
			"registration.gift_points",
			map[string]interface{}{"key": "registration.gift_points", "old_value": "500", "new_value": "1000"},
			6,
		},
		{
			model.AuditConfigUpdate, model.TargetTypeConfig,
			"recharge.rate",
			map[string]interface{}{"key": "recharge.rate", "old_value": "80", "new_value": "100"},
			8,
		},
		{
			model.AuditOrderRefund, model.TargetTypeOrder,
			"ORD20260205001",
			map[string]interface{}{"order_no": "ORD20260205001", "amount_yuan": 50, "reason": "用户申请退款"},
			7,
		},
		{
			model.AuditMsgDelete, model.TargetTypeMessage,
			"batch",
			map[string]interface{}{"title": "过期活动通知", "reason": "活动已结束"},
			10,
		},
		{
			model.AuditUserEnable, model.TargetTypeUser,
			fmt.Sprintf("%d", users[2].ID),
			map[string]interface{}{"email": users[2].Email, "reason": "申诉通过，解除封禁"},
			12,
		},
	}

	ips := []string{"192.168.1.100", "10.0.0.15", "172.16.0.88", "192.168.3.2"}

	for _, l := range logs {
		detail, _ := json.Marshal(l.detail)
		db.Create(&model.AdminAuditLog{
			AdminID:    admin.ID,
			Action:     l.action,
			TargetType: l.targetType,
			TargetID:   l.targetID,
			Detail:     detail,
			IPAddress:  ips[rand.Intn(len(ips))],
			CreatedAt:  now.AddDate(0, 0, -l.daysAgo).Add(time.Duration(rand.Intn(43200)) * time.Second),
		})
	}
}
