package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gennovelweb/bff/internal/middleware"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// helper for GET requests with optional auth
func getRequest(r *gin.Engine, path string, headers map[string]string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", path, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	r.ServeHTTP(w, req)
	return w
}

// --- GetBalance: no auth → 401 ---

func TestGetBalance_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/balance", GetBalance)

	w := getRequest(r, "/api/v1/balance", nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetBalance: with auth, service nil → panics but we catch that it passes auth ---

func TestGetBalance_WithAuth_ServiceNil(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/balance", GetBalance)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	w := getRequest(r, "/api/v1/balance", map[string]string{
		"Authorization": "Bearer " + pair.AccessToken,
	})
	// balanceService is nil, so will panic or return 500
	// The important thing: it should NOT be 401 (passed auth)
	if w.Code == http.StatusUnauthorized {
		t.Fatalf("should pass auth check, but got 401")
	}
}

// --- CheckBalance: no auth → 401 ---

func TestCheckBalance_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/balance/check", CheckBalance)

	w := getRequest(r, "/api/v1/balance/check?model=standard", nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetTransactions: no auth → 401 ---

func TestGetTransactions_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/transactions", GetTransactions)

	w := getRequest(r, "/api/v1/transactions", nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetTransactions: with auth, service nil ---

func TestGetTransactions_WithAuth_ServiceNil(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/transactions", GetTransactions)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	w := getRequest(r, "/api/v1/transactions", map[string]string{
		"Authorization": "Bearer " + pair.AccessToken,
	})
	if w.Code == http.StatusUnauthorized {
		t.Fatalf("should pass auth check, but got 401")
	}
}

// --- GetTransactions: invalid query params ---

func TestGetTransactions_InvalidQueryParams(t *testing.T) {
	r := setupRouter()
	// Skip auth middleware for this test; manually set userID
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.GET("/api/v1/transactions", GetTransactions)

	// type must be one of: all, recharge, consumption, gift_referral
	w := getRequest(r, "/api/v1/transactions?type=invalid_type", nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- CheckBalance: with auth, default model param ---

func TestCheckBalance_WithAuth_ServiceNil(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/balance/check", CheckBalance)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	w := getRequest(r, "/api/v1/balance/check", map[string]string{
		"Authorization": "Bearer " + pair.AccessToken,
	})
	if w.Code == http.StatusUnauthorized {
		t.Fatalf("should pass auth check, but got 401")
	}
}

// --- GetTransactions: valid query params with auth ---

func TestGetTransactions_ValidQueryParams(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.GET("/api/v1/transactions", GetTransactions)

	// Valid type parameter - will fail at service layer but passes parsing
	w := getRequest(r, "/api/v1/transactions?type=all&days=30&page=1&page_size=20", nil)
	if w.Code == http.StatusBadRequest {
		t.Fatalf("HTTP status should not be 400 for valid query params, got %d", w.Code)
	}
}
