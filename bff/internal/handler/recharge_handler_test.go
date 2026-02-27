package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gennovelweb/bff/internal/middleware"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// --- GetRechargeConfig: no auth -> 401 ---

func TestGetRechargeConfig_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/recharge/config", GetRechargeConfig)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/recharge/config", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetRechargeConfig: with auth, service nil ---

func TestGetRechargeConfig_WithAuth_ServiceNil(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/recharge/config", GetRechargeConfig)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/recharge/config", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	r.ServeHTTP(w, req)

	// rechargeService is nil, so will panic or return 500; important: passes auth
	if w.Code == http.StatusUnauthorized {
		t.Fatalf("should pass auth check, but got 401")
	}
}

// --- CreateRechargeOrder: no auth -> 401 ---

func TestCreateRechargeOrder_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.POST("/api/v1/recharge/create", CreateRechargeOrder)

	w := postJSON(r, "/api/v1/recharge/create", nil, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- CreateRechargeOrder: missing body with auth ---

func TestCreateRechargeOrder_MissingBody(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.POST("/api/v1/recharge/create", CreateRechargeOrder)

	w := postJSON(r, "/api/v1/recharge/create", nil, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- PaymentCallback: missing body ---

func TestPaymentCallback_MissingBody(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/recharge/callback", PaymentCallback)

	w := postJSON(r, "/api/v1/recharge/callback", nil, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- GetOrderStatus: no auth -> 401 ---

func TestGetOrderStatus_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/recharge/status/:order_no", GetOrderStatus)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/recharge/status/ORD123", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}
