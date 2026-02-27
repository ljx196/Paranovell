package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gennovelweb/bff/internal/middleware"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// helper for PUT JSON requests
func putJSON(r *gin.Engine, path string, body interface{}) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", path, &buf)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	return w
}

// --- GetProfile: no auth -> 401 ---

func TestGetProfile_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/user/profile", GetProfile)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/user/profile", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- GetProfile: with auth (service will fail but auth passes) ---

func TestGetProfile_WithAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.GET("/api/v1/user/profile", GetProfile)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/user/profile", nil)
	req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	r.ServeHTTP(w, req)

	if w.Code == http.StatusUnauthorized {
		t.Fatalf("should pass auth check, but got 401")
	}
}

// --- UpdateProfile: no auth -> 401 ---

func TestUpdateProfile_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.PUT("/api/v1/user/profile", UpdateProfile)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/user/profile", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- UpdateProfile: valid body with auth ---

func TestUpdateProfile_ValidBody(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.PUT("/api/v1/user/profile", UpdateProfile)

	body := map[string]string{
		"nickname": "NewNick",
	}
	w := putJSON(r, "/api/v1/user/profile", body)

	// Should NOT be 400 for valid body (will fail at service layer)
	if w.Code == http.StatusBadRequest {
		t.Fatalf("HTTP status should not be 400 for valid body, got %d\nbody: %s", w.Code, w.Body.String())
	}
}

// --- UpdateProfile: invalid URL in avatar_url ---

func TestUpdateProfile_InvalidAvatarURL(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.PUT("/api/v1/user/profile", UpdateProfile)

	body := map[string]string{
		"avatar_url": "not-a-url",
	}
	w := putJSON(r, "/api/v1/user/profile", body)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- ChangePassword: no auth -> 401 ---

func TestChangePassword_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.PUT("/api/v1/user/password", ChangePassword)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/user/password", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- ChangePassword: missing old_password ---

func TestChangePassword_MissingOldPassword(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.PUT("/api/v1/user/password", ChangePassword)

	body := map[string]string{
		"new_password": "newpass123",
	}
	w := putJSON(r, "/api/v1/user/password", body)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- ChangePassword: missing new_password ---

func TestChangePassword_MissingNewPassword(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.PUT("/api/v1/user/password", ChangePassword)

	body := map[string]string{
		"old_password": "oldpass123",
	}
	w := putJSON(r, "/api/v1/user/password", body)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- ChangePassword: new_password too short ---

func TestChangePassword_NewPasswordTooShort(t *testing.T) {
	r := setupRouter()
	r.Use(func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	})
	r.PUT("/api/v1/user/password", ChangePassword)

	body := map[string]string{
		"old_password": "oldpass123",
		"new_password": "abc",
	}
	w := putJSON(r, "/api/v1/user/password", body)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- DeleteAccount: no auth -> 401 ---

func TestDeleteAccount_NoAuth(t *testing.T) {
	r := setupRouter()
	r.Use(middleware.Auth())
	r.DELETE("/api/v1/user/account", DeleteAccount)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/user/account", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}
