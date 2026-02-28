package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/model"
	"github.com/go-redis/redis/v8"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB
var Redis *redis.Client

// Init 初始化数据库连接
func Init(cfg *config.DatabaseConfig) error {
	var err error

	// 配置 GORM 日志
	gormLogger := logger.Default.LogMode(logger.Info)

	// 连接数据库
	DB, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	// 获取底层 *sql.DB 以配置连接池
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// 配置连接池
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.ConnMaxLifetime) * time.Minute)

	// 测试连接
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Database connected successfully: %s:%s/%s", cfg.Host, cfg.Port, cfg.DBName)
	return nil
}

// InitSchema 初始化数据库 Schema 和表结构
func InitSchema() error {
	// 创建 bff_schema
	if err := DB.Exec("CREATE SCHEMA IF NOT EXISTS bff_schema").Error; err != nil {
		return fmt.Errorf("failed to create bff_schema: %w", err)
	}
	log.Println("Schema bff_schema created or already exists")

	// 创建 chat_schema（BFF 只读，但需要存在以便查询）
	if err := DB.Exec("CREATE SCHEMA IF NOT EXISTS chat_schema").Error; err != nil {
		return fmt.Errorf("failed to create chat_schema: %w", err)
	}
	log.Println("Schema chat_schema created or already exists")

	// 自动迁移 BFF 管理的表
	if err := DB.AutoMigrate(
		&model.User{},
		&model.UserPreference{},
		&model.Referral{},
		&model.SystemMessage{},
		&model.TokenUsage{},
		&model.UserBalance{},
		&model.Transaction{},
		&model.RechargeOrder{},
		&model.AdminAuditLog{},
		&model.SystemConfig{},
		&model.SensitiveWord{},
		&model.ContentReview{},
		&model.QuickReply{},
	); err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}
	log.Println("Database tables migrated successfully")

	// 创建额外的索引（GORM AutoMigrate 可能不会创建所有索引）
	if err := createAdditionalIndexes(); err != nil {
		log.Printf("Warning: failed to create some indexes: %v", err)
	}

	return nil
}

// createAdditionalIndexes 创建额外的数据库索引
func createAdditionalIndexes() error {
	indexes := []string{
		// users 表索引
		`CREATE INDEX IF NOT EXISTS idx_users_status ON bff_schema.users(status)`,

		// system_messages 表索引
		`CREATE INDEX IF NOT EXISTS idx_system_messages_user_unread
		 ON bff_schema.system_messages(user_id, is_read) WHERE is_read = FALSE`,

		// token_usage 表索引
		`CREATE INDEX IF NOT EXISTS idx_token_usage_user_date
		 ON bff_schema.token_usage(user_id, created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_token_usage_conversation
		 ON bff_schema.token_usage(conversation_id)`,

		// user_balance 表索引
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_balance_user_id
		 ON bff_schema.user_balance(user_id)`,

		// transactions 表索引
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_type
		 ON bff_schema.transactions(user_id, type)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_user_date
		 ON bff_schema.transactions(user_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_reference
		 ON bff_schema.transactions(reference_id)`,

		// recharge_orders 表索引
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_recharge_orders_order_no
		 ON bff_schema.recharge_orders(order_no)`,
		`CREATE INDEX IF NOT EXISTS idx_recharge_orders_user_status
		 ON bff_schema.recharge_orders(user_id, status)`,

		// users role 索引
		`CREATE INDEX IF NOT EXISTS idx_users_role
		 ON bff_schema.users(role)`,

		// admin_audit_logs 表索引
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id
		 ON bff_schema.admin_audit_logs(admin_id)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_action
		 ON bff_schema.admin_audit_logs(action)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_target
		 ON bff_schema.admin_audit_logs(target_type, target_id)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_time
		 ON bff_schema.admin_audit_logs(created_at DESC)`,

		// system_configs 表索引
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_system_configs_key
		 ON bff_schema.system_configs(config_key)`,

		// sensitive_words 表索引
		`CREATE INDEX IF NOT EXISTS idx_sensitive_words_category
		 ON bff_schema.sensitive_words(category)`,
		`CREATE INDEX IF NOT EXISTS idx_sensitive_words_enabled
		 ON bff_schema.sensitive_words(is_enabled)`,

		// content_reviews 表索引
		`CREATE INDEX IF NOT EXISTS idx_content_reviews_conversation
		 ON bff_schema.content_reviews(conversation_id)`,
		`CREATE INDEX IF NOT EXISTS idx_content_reviews_user
		 ON bff_schema.content_reviews(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_content_reviews_status
		 ON bff_schema.content_reviews(status)`,
		`CREATE INDEX IF NOT EXISTS idx_content_reviews_created
		 ON bff_schema.content_reviews(created_at DESC)`,
	}

	for _, idx := range indexes {
		if err := DB.Exec(idx).Error; err != nil {
			log.Printf("Warning: index creation failed: %v", err)
		}
	}

	return nil
}

// Close 关闭数据库连接
func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetDB 返回数据库实例
func GetDB() *gorm.DB {
	return DB
}

// InitRedis 初始化 Redis 连接
func InitRedis(cfg *config.RedisConfig) error {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr(),
		Password: cfg.Password,
		DB:       cfg.DB,
		PoolSize: cfg.PoolSize,
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		// 连接失败，关闭客户端并返回错误
		client.Close()
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	// 连接成功才赋值给全局变量
	Redis = client
	log.Printf("Redis connected successfully: %s", cfg.Addr())
	return nil
}

// GetRedis 返回 Redis 客户端
func GetRedis() *redis.Client {
	return Redis
}

// CloseRedis 关闭 Redis 连接
func CloseRedis() error {
	if Redis != nil {
		return Redis.Close()
	}
	return nil
}
