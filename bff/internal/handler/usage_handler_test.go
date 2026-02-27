package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gennovelweb/bff/internal/middleware"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// --- GetUsageSummary: no auth -> 401 ---

func TestGetUsageSummary_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/usage", GetUsageSummary)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/usage", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetDailyUsage: no auth -> 401 ---

func TestGetDailyUsage_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/usage/daily", GetDailyUsage)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/usage/daily", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetDailyUsage: with auth, passes auth ---

func TestGetDailyUsage_WithAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/usage/daily", GetDailyUsage)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/usage/daily?days=7", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	r.ServeHTTP(w, req)

	if w.Code == http.StatusUnauthorized {
		t.Fatalf("should pass auth check, but got 401")
	}
}

// --- GetDailyUsage: default days param ---

func TestGetDailyUsage_DefaultDays(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.GET("/api/v1/usage/daily", GetDailyUsage)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/usage/daily", nil)
	r.ServeHTTP(w, req)

	// Will fail at service layer, but should not be 400
	if w.Code == http.StatusBadRequest {
		t.Fatalf("HTTP status should not be 400 for default params, got %d", w.Code)
	}
}

// --- GetUsageDetail: no auth -> 401 ---

func TestGetUsageDetail_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/usage/detail", GetUsageDetail)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/usage/detail", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}
