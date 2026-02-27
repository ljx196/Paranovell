package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gennovelweb/bff/internal/middleware"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// helper to build a router with Auth + Admin middleware for admin endpoint tests
func adminTestRouter() *gin.Engine {
	r := setupRouter()
	r.Use(middleware.Auth(), middleware.Admin())
	return r
}

// helper to generate a valid admin token
func adminToken() string {
	pair, _ := utils.GenerateTokenPair(99, "admin@example.com", "admin")
	return pair.AccessToken
}

// helper to generate a valid user token (non-admin)
func userToken() string {
	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	return pair.AccessToken
}

// --- Admin endpoints: no auth -> 401 ---

func TestAdmin_DashboardStats_NoAuth(t *testing.T) {
	r := adminTestRouter()
	r.GET("/api/admin/dashboard/stats", AdminGetDashboardStats)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/dashboard/stats", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- Admin endpoints: user role -> 403 ---

func TestAdmin_DashboardStats_UserRole(t *testing.T) {
	r := adminTestRouter()
	r.GET("/api/admin/dashboard/stats", AdminGetDashboardStats)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/dashboard/stats", nil)
	req.Header.Set("Authorization", "Bearer "+userToken())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusForbidden)
	}
}

// --- Admin Dashboard Stats: admin role passes auth ---

func TestAdmin_DashboardStats_AdminRole(t *testing.T) {
	r := adminTestRouter()
	r.GET("/api/admin/dashboard/stats", AdminGetDashboardStats)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/dashboard/stats", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken())
	r.ServeHTTP(w, req)

	// Should pass auth + admin middleware; will fail at service (nil) but NOT 401/403
	if w.Code == http.StatusUnauthorized || w.Code == http.StatusForbidden {
		t.Fatalf("should pass auth+admin check, but got %d", w.Code)
	}
}

// --- AdminGetUsers: no auth -> 401 ---

func TestAdmin_GetUsers_NoAuth(t *testing.T) {
	r := adminTestRouter()
	r.GET("/api/admin/users", AdminGetUsers)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/users", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- AdminGetUsers: user role -> 403 ---

func TestAdmin_GetUsers_UserRole(t *testing.T) {
	r := adminTestRouter()
	r.GET("/api/admin/users", AdminGetUsers)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/users", nil)
	req.Header.Set("Authorization", "Bearer "+userToken())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusForbidden)
	}
}

// --- AdminGetUserDetail: invalid ID ---

func TestAdmin_GetUserDetail_InvalidID(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(99))
		c.Set("role", "admin")
		c.Set("adminID", uint(99))
		c.Next()
	})
	r.GET("/api/admin/users/:id", AdminGetUserDetail)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/users/abc", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- AdminUpdateUserStatus: no auth -> 401 ---

func TestAdmin_UpdateUserStatus_NoAuth(t *testing.T) {
	r := adminTestRouter()
	r.PUT("/api/admin/users/:id/status", AdminUpdateUserStatus)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/admin/users/1/status", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- AdminAdjustBalance: user role -> 403 ---

func TestAdmin_AdjustBalance_UserRole(t *testing.T) {
	r := adminTestRouter()
	r.POST("/api/admin/users/:id/adjust-balance", AdminAdjustBalance)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/admin/users/1/adjust-balance", nil)
	req.Header.Set("Authorization", "Bearer "+userToken())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusForbidden)
	}
}

// --- AdminGetOrders: no auth -> 401 ---

func TestAdmin_GetOrders_NoAuth(t *testing.T) {
	r := adminTestRouter()
	r.GET("/api/admin/orders", AdminGetOrders)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/orders", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- AdminGetAuditLogs: no auth -> 401 ---

func TestAdmin_GetAuditLogs_NoAuth(t *testing.T) {
	r := adminTestRouter()
	r.GET("/api/admin/audit-logs", AdminGetAuditLogs)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/audit-logs", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- AdminGetAuditLogDetail: invalid ID ---

func TestAdmin_GetAuditLogDetail_InvalidID(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(99))
		c.Set("role", "admin")
		c.Set("adminID", uint(99))
		c.Next()
	})
	r.GET("/api/admin/audit-logs/:id", AdminGetAuditLogDetail)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/admin/audit-logs/notanumber", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}
