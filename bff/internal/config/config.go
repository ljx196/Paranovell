package config

import (
	"os"
	"strconv"
	"time"

	"github.com/goccy/go-yaml"
)

// Config 应用配置
type Config struct {
	Env       string          `yaml:"env"`
	Server    ServerConfig    `yaml:"server"`
	Database  DatabaseConfig  `yaml:"database"`
	Redis     RedisConfig     `yaml:"redis"`
	JWT       JWTConfig       `yaml:"jwt"`
	Algorithm AlgorithmConfig `yaml:"algorithm"`
	Log       LogConfig       `yaml:"log"`
	Email     EmailConfig     `yaml:"email"`
	RateLimit RateLimitConfig `yaml:"rate_limit"`
	Balance   BalanceConfig   `yaml:"balance"`
	Admin     AdminConfig     `yaml:"admin"`
}

// AdminConfig 超级管理员配置
type AdminConfig struct {
	Email    string `yaml:"email"`
	Password string `yaml:"password"`
	Nickname string `yaml:"nickname"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port         string        `yaml:"port"`
	ReadTimeout  time.Duration `yaml:"read_timeout"`
	WriteTimeout time.Duration `yaml:"write_timeout"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host            string `yaml:"host"`
	Port            string `yaml:"port"`
	User            string `yaml:"user"`
	Password        string `yaml:"password"`
	DBName          string `yaml:"dbname"`
	SSLMode         string `yaml:"ssl_mode"`
	MaxOpenConns    int    `yaml:"max_open_conns"`
	MaxIdleConns    int    `yaml:"max_idle_conns"`
	ConnMaxLifetime int    `yaml:"conn_max_lifetime"` // minutes
}

// DSN 返回数据库连接字符串
func (d *DatabaseConfig) DSN() string {
	return "host=" + d.Host +
		" user=" + d.User +
		" password=" + d.Password +
		" dbname=" + d.DBName +
		" port=" + d.Port +
		" sslmode=" + d.SSLMode
}

// RedisConfig Redis 配置
type RedisConfig struct {
	Host     string `yaml:"host"`
	Port     string `yaml:"port"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
	PoolSize int    `yaml:"pool_size"`
}

// Addr 返回 Redis 地址
func (r *RedisConfig) Addr() string {
	return r.Host + ":" + r.Port
}

// JWTConfig JWT 配置
type JWTConfig struct {
	Secret          string `yaml:"secret"`
	AccessTokenTTL  int    `yaml:"access_token_ttl"`  // minutes
	RefreshTokenTTL int    `yaml:"refresh_token_ttl"` // days
	Issuer          string `yaml:"issuer"`
}

// AlgorithmConfig 算法后端配置
type AlgorithmConfig struct {
	BaseURL string `yaml:"base_url"`
	Timeout int    `yaml:"timeout"` // seconds
	Retry   int    `yaml:"retry"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level    string `yaml:"level"`
	Format   string `yaml:"format"`
	Output   string `yaml:"output"`
	FilePath string `yaml:"file_path"`
}

// EmailConfig 邮件配置
type EmailConfig struct {
	SMTPHost    string `yaml:"smtp_host"`
	SMTPPort    int    `yaml:"smtp_port"`
	Username    string `yaml:"username"`
	Password    string `yaml:"password"`
	FromAddress string `yaml:"from_address"`
	FromName    string `yaml:"from_name"`
}

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	Enabled           bool `yaml:"enabled"`
	RequestsPerSecond int  `yaml:"requests_per_second"`
	Burst             int  `yaml:"burst"`
}

// BalanceConfig 余额系统配置
type BalanceConfig struct {
	InitialGiftPoints        int64            `yaml:"initial_gift_points"`
	LowBalanceThreshold      int64            `yaml:"low_balance_threshold"`
	CriticalBalanceThreshold int64            `yaml:"critical_balance_threshold"`
	ExchangeRate             int              `yaml:"exchange_rate"`
	MinRechargeYuan          float64          `yaml:"min_recharge_yuan"`
	RechargePresets          []RechargePreset `yaml:"recharge_presets"`
	PaymentMethods           []string         `yaml:"payment_methods"`
	OrderTimeoutMinutes      int              `yaml:"order_timeout_minutes"`
	Models                   []ModelPricing   `yaml:"models"`
	Referral                 ReferralConfig   `yaml:"referral"`
}

// RechargePreset 充值档位配置
type RechargePreset struct {
	AmountYuan float64 `yaml:"amount_yuan" json:"amount_yuan"`
	Points     int64   `yaml:"points" json:"points"`
}

// ModelPricing 模型费率配置
type ModelPricing struct {
	Name        string `yaml:"name" json:"name"`
	DisplayName string `yaml:"display_name" json:"display_name"`
	InputPrice  int    `yaml:"input_price" json:"input_price"`
	OutputPrice int    `yaml:"output_price" json:"output_price"`
}

// ReferralConfig 邀请奖励配置
type ReferralConfig struct {
	ReferrerReward         int64 `yaml:"referrer_reward"`
	RefereeGift            int64 `yaml:"referee_gift"`
	FirstRechargeBonusRate int   `yaml:"first_recharge_bonus_rate"`
}

// Load 加载配置
// 优先级: 环境变量 > YAML 文件 > 默认值
func Load() (*Config, error) {
	cfg := defaultConfig()

	// 尝试从 YAML 文件加载
	if err := loadFromYAML(cfg, "config.yaml"); err != nil {
		// 如果文件不存在，使用默认值继续
		if !os.IsNotExist(err) {
			// 其他错误则记录但继续
		}
	}

	// 环境变量覆盖（最高优先级）
	loadFromEnv(cfg)

	return cfg, nil
}

// defaultConfig 返回默认配置
func defaultConfig() *Config {
	return &Config{
		Env: "development",
		Server: ServerConfig{
			Port:         "8080",
			ReadTimeout:  30 * time.Second,
			WriteTimeout: 30 * time.Second,
		},
		Database: DatabaseConfig{
			Host:            "localhost",
			Port:            "5432",
			User:            "postgres",
			Password:        "",
			DBName:          "postgres",
			SSLMode:         "disable",
			MaxOpenConns:    100,
			MaxIdleConns:    10,
			ConnMaxLifetime: 60,
		},
		Redis: RedisConfig{
			Host:     "localhost",
			Port:     "6379",
			Password: "",
			DB:       0,
			PoolSize: 100,
		},
		JWT: JWTConfig{
			Secret:          "your-secret-key",
			AccessTokenTTL:  15,
			RefreshTokenTTL: 7,
			Issuer:          "gennovelweb",
		},
		Algorithm: AlgorithmConfig{
			BaseURL: "http://localhost:8000",
			Timeout: 30,
			Retry:   3,
		},
		Log: LogConfig{
			Level:    "debug",
			Format:   "text",
			Output:   "stdout",
			FilePath: "./logs/bff.log",
		},
		Email: EmailConfig{
			SMTPPort: 587,
			FromName: "GenNovelWeb",
		},
		RateLimit: RateLimitConfig{
			Enabled:           true,
			RequestsPerSecond: 100,
			Burst:             200,
		},
		Admin: AdminConfig{
			Email:    "admin@gennovel.com",
			Password: "Admin@2026",
			Nickname: "超级管理员",
		},
		Balance: BalanceConfig{
			InitialGiftPoints:        1000,
			LowBalanceThreshold:      500,
			CriticalBalanceThreshold: 100,
			ExchangeRate:             100,
			MinRechargeYuan:          1,
			RechargePresets: []RechargePreset{
				{AmountYuan: 10, Points: 1000},
				{AmountYuan: 50, Points: 5000},
				{AmountYuan: 100, Points: 10000},
				{AmountYuan: 500, Points: 50000},
			},
			PaymentMethods:      []string{"alipay", "wechat"},
			OrderTimeoutMinutes: 30,
			Models: []ModelPricing{
				{Name: "standard", DisplayName: "标准模型", InputPrice: 1, OutputPrice: 2},
				{Name: "advanced", DisplayName: "高级模型", InputPrice: 3, OutputPrice: 6},
			},
			Referral: ReferralConfig{
				ReferrerReward:         500,
				RefereeGift:            1000,
				FirstRechargeBonusRate: 10,
			},
		},
	}
}

// loadFromYAML 从 YAML 文件加载配置
func loadFromYAML(cfg *Config, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return yaml.Unmarshal(data, cfg)
}

// loadFromEnv 从环境变量加载配置
func loadFromEnv(cfg *Config) {
	// 环境
	if v := os.Getenv("ENV"); v != "" {
		cfg.Env = v
	}

	// 服务器
	if v := os.Getenv("PORT"); v != "" {
		cfg.Server.Port = v
	}

	// 数据库
	if v := os.Getenv("DB_HOST"); v != "" {
		cfg.Database.Host = v
	}
	if v := os.Getenv("DB_PORT"); v != "" {
		cfg.Database.Port = v
	}
	if v := os.Getenv("DB_USER"); v != "" {
		cfg.Database.User = v
	}
	if v := os.Getenv("DB_PASSWORD"); v != "" {
		cfg.Database.Password = v
	}
	if v := os.Getenv("DB_NAME"); v != "" {
		cfg.Database.DBName = v
	}
	if v := os.Getenv("DB_SSL_MODE"); v != "" {
		cfg.Database.SSLMode = v
	}

	// Redis
	if v := os.Getenv("REDIS_HOST"); v != "" {
		cfg.Redis.Host = v
	}
	if v := os.Getenv("REDIS_PORT"); v != "" {
		cfg.Redis.Port = v
	}
	if v := os.Getenv("REDIS_PASSWORD"); v != "" {
		cfg.Redis.Password = v
	}

	// JWT
	if v := os.Getenv("JWT_SECRET"); v != "" {
		cfg.JWT.Secret = v
	}
	if v := os.Getenv("JWT_ACCESS_TOKEN_TTL"); v != "" {
		if ttl, err := strconv.Atoi(v); err == nil {
			cfg.JWT.AccessTokenTTL = ttl
		}
	}
	if v := os.Getenv("JWT_REFRESH_TOKEN_TTL"); v != "" {
		if ttl, err := strconv.Atoi(v); err == nil {
			cfg.JWT.RefreshTokenTTL = ttl
		}
	}

	// 管理员
	if v := os.Getenv("ADMIN_EMAIL"); v != "" {
		cfg.Admin.Email = v
	}
	if v := os.Getenv("ADMIN_PASSWORD"); v != "" {
		cfg.Admin.Password = v
	}
	if v := os.Getenv("ADMIN_NICKNAME"); v != "" {
		cfg.Admin.Nickname = v
	}

	// 算法后端
	if v := os.Getenv("ALGORITHM_BASE_URL"); v != "" {
		cfg.Algorithm.BaseURL = v
	}
	if v := os.Getenv("ALGORITHM_TIMEOUT"); v != "" {
		if timeout, err := strconv.Atoi(v); err == nil {
			cfg.Algorithm.Timeout = timeout
		}
	}
}

// Port 返回服务端口（兼容旧代码）
func (c *Config) Port() string {
	return c.Server.Port
}
