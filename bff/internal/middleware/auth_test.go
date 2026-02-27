package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func init() {
	gin.SetMode(gin.TestMode)
	utils.InitJWT("test-secret-key-for-auth-middleware", 60, 7, "test")
}

// helper: build a gin engine with Auth middleware and a simple handler that returns 200
func authRouter() *gin.Engine {
	r := gin.New()
	r.Use(Auth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"userID": c.GetUint("userID"),
			"email":  c.GetString("email"),
			"role":   c.GetString("role"),
		})
	})
	return r
}

func performRequest(r *gin.Engine, method, path string, headers map[string]string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(method, path, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	r.ServeHTTP(w, req)
	return w
}

func bodyCode(t *testing.T, w *httptest.ResponseRecorder) int {
	t.Helper()
	var resp struct {
		Code int `json:"code"`
	}
	json.Unmarshal(w.Body.Bytes(), &resp)
	return resp.Code
}

func bodyMessage(t *testing.T, w *httptest.ResponseRecorder) string {
	t.Helper()
	var resp struct {
		Message string `json:"message"`
	}
	json.Unmarshal(w.Body.Bytes(), &resp)
	return resp.Message
}

// --- Missing Authorization header ---

func TestAuth_MissingHeader(t *testing.T) {
	r := authRouter()
	w := performRequest(r, "GET", "/protected", nil)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if msg := bodyMessage(t, w); msg != "请先登录" {
		t.Fatalf("message = %q, want %q", msg, "请先登录")
	}
}

// --- Malformed Authorization (no Bearer prefix) ---

func TestAuth_MalformedHeader_NoBearer(t *testing.T) {
	r := authRouter()
	w := performRequest(r, "GET", "/protected", map[string]string{
		"Authorization": "Token some.jwt.token",
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if msg := bodyMessage(t, w); msg != "无效的认证格式" {
		t.Fatalf("message = %q, want %q", msg, "无效的认证格式")
	}
}

// --- Malformed Authorization (just a word, no space) ---

func TestAuth_MalformedHeader_NoSpace(t *testing.T) {
	r := authRouter()
	w := performRequest(r, "GET", "/protected", map[string]string{
		"Authorization": "BearerNoSpace",
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

// --- Invalid token ---

func TestAuth_InvalidToken(t *testing.T) {
	r := authRouter()
	w := performRequest(r, "GET", "/protected", map[string]string{
		"Authorization": "Bearer invalid.jwt.token",
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if msg := bodyMessage(t, w); msg != "无效的 Token" {
		t.Fatalf("message = %q, want %q", msg, "无效的 Token")
	}
}

// --- Expired token ---

func TestAuth_ExpiredToken(t *testing.T) {
	// Create an expired access token manually using the same secret
	now := time.Now()
	claims := utils.TokenClaims{
		UserID: 1,
		Email:  "expired@test.com",
		Role:   "user",
	}
	claims.ExpiresAt = jwt.NewNumericDate(now.Add(-1 * time.Hour))
	claims.IssuedAt = jwt.NewNumericDate(now.Add(-2 * time.Hour))
	claims.Issuer = "test"
	claims.Subject = "access"

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte("test-secret-key-for-auth-middleware"))

	r := authRouter()
	w := performRequest(r, "GET", "/protected", map[string]string{
		"Authorization": "Bearer " + tokenString,
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if msg := bodyMessage(t, w); msg != "Token 已过期" {
		t.Fatalf("message = %q, want %q", msg, "Token 已过期")
	}
}

// --- Refresh token type rejected ---

func TestAuth_RefreshTokenRejected(t *testing.T) {
	pair, _ := utils.GenerateTokenPair(1, "user@test.com", "user")

	r := authRouter()
	w := performRequest(r, "GET", "/protected", map[string]string{
		"Authorization": "Bearer " + pair.RefreshToken,
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if msg := bodyMessage(t, w); msg != "无效的 Token 类型" {
		t.Fatalf("message = %q, want %q", msg, "无效的 Token 类型")
	}
}

// --- Valid token sets context ---

func TestAuth_ValidToken_SetsContext(t *testing.T) {
	pair, _ := utils.GenerateTokenPair(42, "user@test.com", "admin")

	r := authRouter()
	w := performRequest(r, "GET", "/protected", map[string]string{
		"Authorization": "Bearer " + pair.AccessToken,
	})

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}

	var body struct {
		UserID uint   `json:"userID"`
		Email  string `json:"email"`
		Role   string `json:"role"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)

	if body.UserID != 42 {
		t.Fatalf("userID = %d, want 42", body.UserID)
	}
	if body.Email != "user@test.com" {
		t.Fatalf("email = %q, want %q", body.Email, "user@test.com")
	}
	if body.Role != "admin" {
		t.Fatalf("role = %q, want %q", body.Role, "admin")
	}
}

// --- Empty Bearer value ---

func TestAuth_EmptyBearerValue(t *testing.T) {
	r := authRouter()
	w := performRequest(r, "GET", "/protected", map[string]string{
		"Authorization": "Bearer ",
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}
