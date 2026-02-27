package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// helper: build a gin engine where we manually set the role in context (simulating Auth middleware),
// then apply Admin middleware before the handler.
func adminRouter(role string, userID uint) *gin.Engine {
	r := gin.New()
	// Simulate Auth middleware setting context values
	r.Use(func(c *gin.Context) {
		if role != "" {
			c.Set("role", role)
		}
		if userID > 0 {
			c.Set("userID", userID)
		}
		c.Next()
	})
	r.Use(Admin())
	r.GET("/admin", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"adminID": c.GetUint("adminID"),
		})
	})
	return r
}

func doAdminRequest(r *gin.Engine) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/admin", nil)
	r.ServeHTTP(w, req)
	return w
}

// --- Admin role passes ---

func TestAdmin_AdminRole_Passes(t *testing.T) {
	r := adminRouter("admin", 10)
	w := doAdminRequest(r)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}

	var body struct {
		AdminID uint `json:"adminID"`
	}
	json.Unmarshal(w.Body.Bytes(), &body)
	if body.AdminID != 10 {
		t.Fatalf("adminID = %d, want 10", body.AdminID)
	}
}

// --- SuperAdmin role passes ---

func TestAdmin_SuperAdminRole_Passes(t *testing.T) {
	r := adminRouter("super_admin", 20)
	w := doAdminRequest(r)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}

// --- User role rejected ---

func TestAdmin_UserRole_Rejected(t *testing.T) {
	r := adminRouter("user", 5)
	w := doAdminRequest(r)

	if w.Code != http.StatusForbidden {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusForbidden)
	}

	var resp struct {
		Message string `json:"message"`
	}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Message != "无管理权限" {
		t.Fatalf("message = %q, want %q", resp.Message, "无管理权限")
	}
}

// --- No role in context ---

func TestAdmin_NoRole_Rejected(t *testing.T) {
	r := adminRouter("", 0)
	w := doAdminRequest(r)

	if w.Code != http.StatusForbidden {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusForbidden)
	}
}

// --- Unknown role rejected ---

func TestAdmin_UnknownRole_Rejected(t *testing.T) {
	r := adminRouter("moderator", 1)
	w := doAdminRequest(r)

	if w.Code != http.StatusForbidden {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusForbidden)
	}
}
