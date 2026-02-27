package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/handler"
	"github.com/gennovelweb/bff/internal/middleware"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("=== GenNovelWeb BFF Server ===")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	log.Printf("Environment: %s", cfg.Env)
	log.Printf("Server port: %s", cfg.Server.Port)
	log.Printf("Database: %s:%s/%s", cfg.Database.Host, cfg.Database.Port, cfg.Database.DBName)

	// Initialize JWT
	utils.InitJWT(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenTTL,
		cfg.JWT.RefreshTokenTTL,
		cfg.JWT.Issuer,
	)
	log.Println("JWT initialized")

	// Initialize database
	if err := database.Init(&cfg.Database); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Initialize database schema and tables
	if err := database.InitSchema(); err != nil {
		log.Fatalf("Failed to initialize schema: %v", err)
	}

	// Ensure super admin account exists
	if err := database.EnsureAdmin(&cfg.Admin); err != nil {
		log.Printf("Warning: Failed to ensure admin account: %v", err)
	}

	// Initialize Redis
	if err := database.InitRedis(&cfg.Redis); err != nil {
		log.Printf("Warning: Failed to initialize Redis: %v (email features will be limited)", err)
	} else {
		defer database.CloseRedis()
	}

	// Initialize email service
	handler.InitEmailService(&cfg.Email, database.GetRedis())

	// Initialize balance-related services
	handler.InitBalanceService(&cfg.Balance)
	handler.InitRechargeService(&cfg.Balance, handler.GetBalanceService())
	handler.InitPricingService(&cfg.Balance)

	// Initialize chat service (algorithm backend integration)
	handler.InitChatService(&cfg.Algorithm, handler.GetBalanceService(), handler.GetPricingService())
	log.Printf("Chat service initialized (algorithm backend: %s)", cfg.Algorithm.BaseURL)

	// Inject BalanceService into AuthService for registration flow
	service.SetBalanceService(handler.GetBalanceService())

	// Initialize admin services
	auditSvc := service.NewAdminAuditService()
	handler.InitAdminAuditService(auditSvc)
	handler.InitAdminConfigService(service.NewAdminConfigService(auditSvc))
	handler.InitAdminDashboardService(service.NewAdminDashboardService())
	handler.InitAdminUserService(handler.GetBalanceService(), auditSvc)
	handler.InitAdminOrderService()
	handler.InitAdminAnnounceService(auditSvc)

	// Initialize P1 admin services: content review + referral management
	sensitiveWordSvc := service.NewAdminSensitiveWordService(auditSvc)
	contentSvc := service.NewAdminContentService(handler.GetAlgorithmClient(), auditSvc, handler.GetAdminUserService())
	scanSvc := service.NewContentScanService(handler.GetAlgorithmClient(), sensitiveWordSvc, auditSvc)
	handler.InitAdminContentService(contentSvc, sensitiveWordSvc, scanSvc)
	handler.InitAdminReferralService(service.NewAdminReferralService())
	log.Println("Admin services initialized (P0 + P1)")

	// Set gin mode
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	r := gin.Default()

	// Global middleware
	r.Use(middleware.CORS())
	r.Use(middleware.RateLimiter())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"version": "1.0.0",
		})
	})

	// API routes
	api := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", handler.Register)
			auth.POST("/login", handler.Login)
			auth.POST("/logout", middleware.Auth(), handler.Logout)
			auth.POST("/refresh", handler.RefreshToken)
			auth.POST("/forgot-password", handler.ForgotPassword)
			auth.POST("/reset-password", handler.ResetPassword)
			auth.POST("/verify-email", handler.VerifyEmail)
		}

		// User routes (protected)
		user := api.Group("/user")
		user.Use(middleware.Auth())
		{
			user.GET("/profile", handler.GetProfile)
			user.PUT("/profile", handler.UpdateProfile)
			user.PUT("/password", handler.ChangePassword)
			user.DELETE("/account", handler.DeleteAccount)
			user.GET("/referral-code", handler.GetReferralCode)
		}

		// System messages routes (protected)
		messages := api.Group("/messages")
		messages.Use(middleware.Auth())
		{
			messages.GET("", handler.ListMessages)
			messages.GET("/:id", handler.GetMessage)
			messages.PUT("/:id/read", handler.MarkAsRead)
			messages.PUT("/read-all", handler.MarkAllAsRead)
			messages.GET("/unread-count", handler.GetUnreadCount)
		}

		// Token usage routes (protected)
		usage := api.Group("/usage")
		usage.Use(middleware.Auth())
		{
			usage.GET("", handler.GetUsageSummary)
			usage.GET("/daily", handler.GetDailyUsage)
			usage.GET("/daily-extended", handler.GetDailyUsageExtended)
			usage.GET("/detail", handler.GetUsageDetail)
			usage.GET("/conversations", handler.GetConversationRanking)
		}

		// Balance routes (protected)
		balance := api.Group("/balance")
		balance.Use(middleware.Auth())
		{
			balance.GET("", handler.GetBalance)
			balance.GET("/check", handler.CheckBalance)
		}

		// Transaction routes (protected)
		transactions := api.Group("/transactions")
		transactions.Use(middleware.Auth())
		{
			transactions.GET("", handler.GetTransactions)
		}

		// Recharge routes (protected)
		recharge := api.Group("/recharge")
		recharge.Use(middleware.Auth())
		{
			recharge.GET("/config", handler.GetRechargeConfig)
			recharge.POST("/create", handler.CreateRechargeOrder)
			recharge.GET("/status/:order_no", handler.GetOrderStatus)
		}

		// Payment callback (no auth - called by payment platform)
		api.POST("/recharge/callback", handler.PaymentCallback)

		// Pricing routes (protected)
		pricing := api.Group("/pricing")
		pricing.Use(middleware.Auth())
		{
			pricing.GET("", handler.GetPricing)
		}

		// Chat routes (protected) - proxy to algorithm backend
		chat := api.Group("/chat")
		chat.Use(middleware.Auth())
		{
			chat.GET("/conversations", handler.ListConversations)
			chat.POST("/conversations", handler.CreateConversation)
			chat.DELETE("/conversations/:id", handler.DeleteConversation)
			chat.GET("/conversations/:id/messages", handler.GetMessages)
			chat.POST("/conversations/:id/messages", handler.SendMessage)
			chat.POST("/conversations/:id/messages/stream", handler.StreamMessage)
		}

		// WebSocket endpoint
		api.GET("/ws", middleware.Auth(), handler.WebSocketHandler)
	}

	// Admin API routes
	admin := r.Group("/api/admin")
	admin.Use(middleware.Auth(), middleware.Admin())
	{
		// Dashboard
		admin.GET("/dashboard/stats", handler.AdminGetDashboardStats)
		admin.GET("/dashboard/trends", handler.AdminGetDashboardTrends)
		admin.GET("/dashboard/recent-logs", handler.AdminGetRecentLogs)

		// User management
		admin.GET("/users", handler.AdminGetUsers)
		admin.GET("/users/:id", handler.AdminGetUserDetail)
		admin.PUT("/users/:id/status", handler.AdminUpdateUserStatus)
		admin.POST("/users/:id/adjust-balance", handler.AdminAdjustBalance)
		admin.POST("/users/:id/reset-password", handler.AdminResetPassword)

		// Order management
		admin.GET("/orders", handler.AdminGetOrders)
		admin.GET("/orders/summary", handler.AdminGetOrderSummary)

		// Transaction management
		admin.GET("/transactions", handler.AdminGetTransactions)

		// Announcement management
		admin.GET("/announcements", handler.AdminGetAnnouncements)
		admin.POST("/announcements", handler.AdminCreateAnnouncement)
		admin.DELETE("/announcements/:id", handler.AdminDeleteAnnouncement)

		// System config
		admin.GET("/configs", handler.AdminGetConfigs)
		admin.PUT("/configs", handler.AdminUpdateConfigs)

		// Audit logs
		admin.GET("/audit-logs", handler.AdminGetAuditLogs)
		admin.GET("/audit-logs/:id", handler.AdminGetAuditLogDetail)

		// Content review (P1)
		admin.GET("/content/conversations", handler.AdminGetConversations)
		admin.GET("/content/conversations/:id/messages", handler.AdminGetConversationMessages)
		admin.POST("/content/conversations/:id/flag", handler.AdminFlagConversation)
		admin.POST("/content/conversations/:id/review", handler.AdminReviewConversation)
		admin.GET("/content/reviews", handler.AdminGetReviews)
		admin.GET("/content/sensitive-words", handler.AdminGetSensitiveWords)
		admin.POST("/content/sensitive-words", handler.AdminCreateSensitiveWords)
		admin.PUT("/content/sensitive-words/:id", handler.AdminUpdateSensitiveWord)
		admin.DELETE("/content/sensitive-words/:id", handler.AdminDeleteSensitiveWord)
		admin.POST("/content/scan", handler.AdminScanContent)

		// Referral management (P1)
		admin.GET("/referrals/stats", handler.AdminGetReferralStats)
		admin.GET("/referrals", handler.AdminGetReferrals)
		admin.GET("/referrals/:user_id", handler.AdminGetReferrerDetail)
	}

	// Start scheduled task: cancel expired recharge orders
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			rs := service.NewRechargeService(&cfg.Balance, handler.GetBalanceService())
			if count, err := rs.CancelExpiredOrders(); err != nil {
				log.Printf("Failed to cancel expired orders: %v", err)
			} else if count > 0 {
				log.Printf("Cancelled %d expired orders", count)
			}
		}
	}()
	log.Println("Scheduled task started: cancel expired orders (every 5 min)")

	// Graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Shutting down server...")
		database.Close()
		os.Exit(0)
	}()

	// Start server
	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
