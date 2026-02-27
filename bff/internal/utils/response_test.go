package utils

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// helper to create a gin context backed by an httptest recorder
func newTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	return c, w
}

// helper to decode the response body into a Response struct
func decodeResponse(t *testing.T, w *httptest.ResponseRecorder) Response {
	t.Helper()
	var resp Response
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response body: %v\nbody: %s", err, w.Body.String())
	}
	return resp
}

// --- Success ---

func TestSuccess(t *testing.T) {
	c, w := newTestContext()
	Success(c, map[string]string{"key": "value"})

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeSuccess {
		t.Fatalf("code = %d, want %d", resp.Code, CodeSuccess)
	}
	if resp.Message != "success" {
		t.Fatalf("message = %q, want %q", resp.Message, "success")
	}
	if resp.Data == nil {
		t.Fatal("data should not be nil")
	}
}

// --- SuccessMessage ---

func TestSuccessMessage(t *testing.T) {
	c, w := newTestContext()
	SuccessMessage(c, "操作成功")

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeSuccess {
		t.Fatalf("code = %d, want %d", resp.Code, CodeSuccess)
	}
	if resp.Message != "操作成功" {
		t.Fatalf("message = %q, want %q", resp.Message, "操作成功")
	}
	// data should be omitted (nil when decoded into interface{})
	if resp.Data != nil {
		t.Fatalf("data should be nil for SuccessMessage, got %v", resp.Data)
	}
}

// --- BadRequest ---

func TestBadRequest(t *testing.T) {
	c, w := newTestContext()
	BadRequest(c, "参数错误")

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeBadRequest {
		t.Fatalf("code = %d, want %d", resp.Code, CodeBadRequest)
	}
	if resp.Message != "参数错误" {
		t.Fatalf("message = %q, want %q", resp.Message, "参数错误")
	}
}

// --- Unauthorized ---

func TestUnauthorized(t *testing.T) {
	c, w := newTestContext()
	Unauthorized(c, "请先登录")

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeUnauthorized {
		t.Fatalf("code = %d, want %d", resp.Code, CodeUnauthorized)
	}
}

// --- Forbidden ---

func TestForbidden(t *testing.T) {
	c, w := newTestContext()
	Forbidden(c, "无权限")

	if w.Code != http.StatusForbidden {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusForbidden)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeForbidden {
		t.Fatalf("code = %d, want %d", resp.Code, CodeForbidden)
	}
}

// --- NotFound ---

func TestNotFound(t *testing.T) {
	c, w := newTestContext()
	NotFound(c, "资源不存在")

	if w.Code != http.StatusNotFound {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusNotFound)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeNotFound {
		t.Fatalf("code = %d, want %d", resp.Code, CodeNotFound)
	}
}

// --- Conflict ---

func TestConflict(t *testing.T) {
	c, w := newTestContext()
	Conflict(c, CodeEmailExists, "邮箱已存在")

	if w.Code != http.StatusConflict {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusConflict)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeEmailExists {
		t.Fatalf("code = %d, want %d", resp.Code, CodeEmailExists)
	}
	if resp.Message != "邮箱已存在" {
		t.Fatalf("message = %q, want %q", resp.Message, "邮箱已存在")
	}
}

// --- InternalError ---

func TestInternalError(t *testing.T) {
	c, w := newTestContext()
	InternalError(c, "内部错误")

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeInternalError {
		t.Fatalf("code = %d, want %d", resp.Code, CodeInternalError)
	}
}

// --- Error (custom) ---

func TestError_CustomCodes(t *testing.T) {
	c, w := newTestContext()
	Error(c, http.StatusTeapot, 9999, "自定义错误")

	if w.Code != http.StatusTeapot {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusTeapot)
	}
	resp := decodeResponse(t, w)
	if resp.Code != 9999 {
		t.Fatalf("code = %d, want %d", resp.Code, 9999)
	}
	if resp.Message != "自定义错误" {
		t.Fatalf("message = %q, want %q", resp.Message, "自定义错误")
	}
}

// --- Conflict with custom bizCode ---

func TestConflict_CustomBizCode(t *testing.T) {
	c, w := newTestContext()
	Conflict(c, CodeOrderAlreadyPaid, "订单已支付")

	if w.Code != http.StatusConflict {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusConflict)
	}
	resp := decodeResponse(t, w)
	if resp.Code != CodeOrderAlreadyPaid {
		t.Fatalf("code = %d, want %d", resp.Code, CodeOrderAlreadyPaid)
	}
}
