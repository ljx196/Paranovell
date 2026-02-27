package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// 业务错误码
const (
	CodeSuccess          = 0
	CodeBadRequest       = 400
	CodeUnauthorized     = 401
	CodeForbidden        = 403
	CodeNotFound         = 404
	CodeConflict         = 409
	CodeInternalError    = 500
	CodeEmailExists      = 1001
	CodeInvalidInviteCode = 1002
	CodeInvalidCredentials = 1003
	CodeEmailNotVerified = 1004
	CodeAccountDisabled  = 1005

	// 余额相关错误码
	CodeInsufficientBalance = 2001
	CodeOrderNotFound       = 2002
	CodeOrderAlreadyPaid    = 2003
	CodeInvalidAmount       = 2004
	CodeInvalidSign         = 2005
	CodePaymentFailed       = 2006

	// 算法后端错误码
	CodeAlgorithmUnavailable = 4001
	CodeAlgorithmError       = 4002
	CodeConversationNotFound = 4003

	// 管理端错误码
	CodeAdminForbidden      = 3001
	CodeAdminUserNotFound   = 3002
	CodeAdminInvalidAction  = 3003
	CodeAdminConfigNotFound = 3004
	CodeAdminAuditNotFound  = 3005
	CodeAdminNoTargetUsers  = 3006
)

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    CodeSuccess,
		Message: "success",
		Data:    data,
	})
}

// SuccessMessage 成功响应（只有消息）
func SuccessMessage(c *gin.Context, message string) {
	c.JSON(http.StatusOK, Response{
		Code:    CodeSuccess,
		Message: message,
	})
}

// Error 错误响应
func Error(c *gin.Context, httpCode int, bizCode int, message string) {
	c.JSON(httpCode, Response{
		Code:    bizCode,
		Message: message,
	})
}

// BadRequest 400 错误
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, CodeBadRequest, message)
}

// Unauthorized 401 错误
func Unauthorized(c *gin.Context, message string) {
	Error(c, http.StatusUnauthorized, CodeUnauthorized, message)
}

// Forbidden 403 错误
func Forbidden(c *gin.Context, message string) {
	Error(c, http.StatusForbidden, CodeForbidden, message)
}

// NotFound 404 错误
func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, CodeNotFound, message)
}

// Conflict 409 错误
func Conflict(c *gin.Context, bizCode int, message string) {
	Error(c, http.StatusConflict, bizCode, message)
}

// InternalError 500 错误
func InternalError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, CodeInternalError, message)
}
