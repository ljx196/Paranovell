package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
	utils.InitJWT("test-secret-key-for-handler-tests", 60, 7, "test")
}

// helper to perform a JSON POST request against a gin engine
func postJSON(r *gin.Engine, path string, body interface{}, headers map[string]string) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", path, &buf)
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	r.ServeHTTP(w, req)
	return w
}

// helper to decode response body
func decodeBody(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var body map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &body)
	return body
}

// --- Register: missing body ---

func TestRegister_EmptyBody(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/register", Register)

	w := postJSON(r, "/api/v1/auth/register", nil, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Register: missing email ---

func TestRegister_MissingEmail(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/register", Register)

	body := map[string]string{
		"password": "test123456",
	}
	w := postJSON(r, "/api/v1/auth/register", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Register: invalid email format ---

func TestRegister_InvalidEmail(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/register", Register)

	body := map[string]string{
		"email":    "not-an-email",
		"password": "test123456",
	}
	w := postJSON(r, "/api/v1/auth/register", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Register: missing password ---

func TestRegister_MissingPassword(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/register", Register)

	body := map[string]string{
		"email": "user@example.com",
	}
	w := postJSON(r, "/api/v1/auth/register", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Register: password too short ---

func TestRegister_PasswordTooShort(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/register", Register)

	body := map[string]string{
		"email":    "user@example.com",
		"password": "12345",
	}
	w := postJSON(r, "/api/v1/auth/register", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Register: valid body format (will fail at service layer due to no DB, but passes parsing) ---

func TestRegister_ValidBodyFormat(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/register", Register)

	body := map[string]string{
		"email":    "validuser@example.com",
		"password": "validpassword123",
	}
	w := postJSON(r, "/api/v1/auth/register", body, nil)
	// Should NOT be 400 (bad request) since input is valid; will be 500 (service error) or other
	if w.Code == http.StatusBadRequest {
		t.Fatalf("HTTP status should not be 400 for valid input, got %d", w.Code)
	}
}

// --- Login: missing body ---

func TestLogin_EmptyBody(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/login", Login)

	w := postJSON(r, "/api/v1/auth/login", nil, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Login: missing email ---

func TestLogin_MissingEmail(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/login", Login)

	body := map[string]string{
		"password": "test123456",
	}
	w := postJSON(r, "/api/v1/auth/login", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Login: missing password ---

func TestLogin_MissingPassword(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/login", Login)

	body := map[string]string{
		"email": "user@example.com",
	}
	w := postJSON(r, "/api/v1/auth/login", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- Login: valid body format ---

func TestLogin_ValidBodyFormat(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/login", Login)

	body := map[string]string{
		"email":    "user@example.com",
		"password": "test123456",
	}
	w := postJSON(r, "/api/v1/auth/login", body, nil)
	// Should NOT be 400 for valid input
	if w.Code == http.StatusBadRequest {
		t.Fatalf("HTTP status should not be 400 for valid input, got %d", w.Code)
	}
}

// --- RefreshToken: missing body ---

func TestRefreshToken_EmptyBody(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/refresh", RefreshToken)

	w := postJSON(r, "/api/v1/auth/refresh", nil, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- RefreshToken: missing refresh_token field ---

func TestRefreshToken_MissingToken(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/refresh", RefreshToken)

	body := map[string]string{}
	w := postJSON(r, "/api/v1/auth/refresh", body, nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- RefreshToken: invalid token ---

func TestRefreshToken_InvalidToken(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/refresh", RefreshToken)

	body := map[string]string{
		"refresh_token": "invalid.token.here",
	}
	w := postJSON(r, "/api/v1/auth/refresh", body, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- RefreshToken: valid refresh token ---

func TestRefreshToken_ValidRefreshToken(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/refresh", RefreshToken)

	pair, _ := utils.GenerateTokenPair(1, "user@example.com", "user")
	body := map[string]string{
		"refresh_token": pair.RefreshToken,
	}
	w := postJSON(r, "/api/v1/auth/refresh", body, nil)
	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d\nbody: %s", w.Code, http.StatusOK, w.Body.String())
	}

	resp := decodeBody(t, w)
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("response data should be an object, got %v", resp)
	}
	if _, ok := data["access_token"]; !ok {
		t.Fatal("response should contain access_token")
	}
}

// --- Logout ---

func TestLogout_ReturnsSuccess(t *testing.T) {
	r := setupRouter()
	r.POST("/api/v1/auth/logout", Logout)

	w := postJSON(r, "/api/v1/auth/logout", nil, nil)
	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}
