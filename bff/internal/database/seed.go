package database

import (
	"log"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/model"
	"github.com/gennovelweb/bff/internal/utils"
)

// EnsureAdmin 确保超级管理员账号存在
// 服务启动时自动调用，若账号已存在则跳过（不覆盖密码）
func EnsureAdmin(cfg *config.AdminConfig) error {
	if cfg.Email == "" || cfg.Password == "" {
		log.Println("Admin config not set, skipping admin seed")
		return nil
	}

	db := GetDB()

	var existing model.User
	if err := db.Where("email = ?", cfg.Email).First(&existing).Error; err == nil {
		// 账号已存在，仅确保 role 正确
		if existing.Role != "super_admin" {
			db.Model(&existing).Update("role", "super_admin")
			log.Printf("Admin user %s role updated to super_admin", cfg.Email)
		} else {
			log.Printf("Admin user already exists: %s (ID:%d)", cfg.Email, existing.ID)
		}
		return nil
	}

	// 创建新管理员
	hash, err := utils.HashPassword(cfg.Password)
	if err != nil {
		return err
	}

	admin := model.User{
		Email:         cfg.Email,
		PasswordHash:  hash,
		Nickname:      cfg.Nickname,
		Role:          "super_admin",
		Status:        1,
		EmailVerified: true,
		InviteCode:    utils.GenerateInviteCode(),
	}

	if err := db.Create(&admin).Error; err != nil {
		return err
	}

	// 创建余额记录
	db.Create(&model.UserBalance{
		UserID:  admin.ID,
		Balance: 0,
	})

	log.Printf("Admin user created: %s (ID:%d)", admin.Email, admin.ID)
	return nil
}
