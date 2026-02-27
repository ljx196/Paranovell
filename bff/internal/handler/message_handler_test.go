package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gennovelweb/bff/internal/middleware"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// --- ListMessages: no auth -> 401 ---

func TestListMessages_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/messages", ListMessages)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/messages", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- ListMessages: with auth, passes auth check ---

func TestListMessages_WithAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/messages", ListMessages)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/messages", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	r.ServeHTTP(w, req)

	if w.Code == http.StatusUnauthorized {
		t.Fatalf("should pass auth check, but got 401")
	}
}

// --- ListMessages: invalid msg_type query param ---

func TestListMessages_InvalidMsgType(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.GET("/api/v1/messages", ListMessages)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/messages?msg_type=invalid", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- ListMessages: valid query params ---

func TestListMessages_ValidQueryParams(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.GET("/api/v1/messages", ListMessages)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/messages?msg_type=notice&page=1&page_size=10", nil)
	r.ServeHTTP(w, req)

	// Should NOT be 400 for valid params
	if w.Code == http.StatusBadRequest {
		t.Fatalf("HTTP status should not be 400 for valid query params, got %d", w.Code)
	}
}

// --- GetMessage: no auth -> 401 ---

func TestGetMessage_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/messages/:id", GetMessage)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/messages/1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetMessage: invalid ID ---

func TestGetMessage_InvalidID(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.GET("/api/v1/messages/:id", GetMessage)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/messages/abc", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- MarkAsRead: invalid ID ---

func TestMarkAsRead_InvalidID(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.PUT("/api/v1/messages/:id/read", MarkAsRead)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/messages/xyz/read", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- MarkAsRead: no auth -> 401 ---

func TestMarkAsRead_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.PUT("/api/v1/messages/:id/read", MarkAsRead)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/messages/1/read", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetUnreadCount: no auth -> 401 ---

func TestGetUnreadCount_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/messages/unread-count", GetUnreadCount)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/messages/unread-count", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}
