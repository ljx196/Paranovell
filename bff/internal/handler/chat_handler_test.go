package handler

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gennovelweb/bff/internal/client"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gin-gonic/gin"
)

// mockAlgorithmClient implements client.AlgorithmClientInterface for handler tests
type mockAlgClient struct {
	createFn  func(ctx context.Context, userID uint, title, model string) (*client.ConversationResult, error)
	listFn    func(ctx context.Context, userID uint, page, pageSize int) (*client.ConversationListResult, error)
	deleteFn  func(ctx context.Context, userID uint, conversationID string) error
	msgsFn    func(ctx context.Context, userID uint, conversationID string, page, pageSize int) (*client.MessageListResult, error)
	sendFn    func(ctx context.Context, userID uint, conversationID, content, model string) (*client.SendMessageResult, error)
	streamFn  func(ctx context.Context, userID uint, conversationID, content, model string) (io.ReadCloser, error)
}

func (m *mockAlgClient) CreateConversation(ctx context.Context, userID uint, title, model string) (*client.ConversationResult, error) {
	if m.createFn != nil {
		return m.createFn(ctx, userID, title, model)
	}
	return &client.ConversationResult{ID: "conv_1", Title: title, Model: model, CreatedAt: time.Now()}, nil
}

func (m *mockAlgClient) ListConversations(ctx context.Context, userID uint, page, pageSize int) (*client.ConversationListResult, error) {
	if m.listFn != nil {
		return m.listFn(ctx, userID, page, pageSize)
	}
	return &client.ConversationListResult{Conversations: nil, Total: 0}, nil
}

func (m *mockAlgClient) DeleteConversation(ctx context.Context, userID uint, conversationID string) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, userID, conversationID)
	}
	return nil
}

func (m *mockAlgClient) GetMessages(ctx context.Context, userID uint, conversationID string, page, pageSize int) (*client.MessageListResult, error) {
	if m.msgsFn != nil {
		return m.msgsFn(ctx, userID, conversationID, page, pageSize)
	}
	return &client.MessageListResult{Messages: nil, Total: 0}, nil
}

func (m *mockAlgClient) SendMessage(ctx context.Context, userID uint, conversationID, content, model string) (*client.SendMessageResult, error) {
	if m.sendFn != nil {
		return m.sendFn(ctx, userID, conversationID, content, model)
	}
	return nil, nil
}

func (m *mockAlgClient) StreamMessage(ctx context.Context, userID uint, conversationID, content, model string) (io.ReadCloser, error) {
	if m.streamFn != nil {
		return m.streamFn(ctx, userID, conversationID, content, model)
	}
	return io.NopCloser(strings.NewReader("")), nil
}

// initTestChatService sets up chatService with a mock algorithm client (no DB needed)
func initTestChatService(mock *mockAlgClient) {
	chatService = service.NewChatService(mock, nil, nil)
}

// authMiddleware sets a fake userID in context for testing
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("userID", uint(1))
		c.Next()
	}
}

// --- ListConversations: returns 200 with data from algorithm backend ---

func TestListConversations_Returns200(t *testing.T) {
	initTestChatService(&mockAlgClient{
		listFn: func(ctx context.Context, userID uint, page, pageSize int) (*client.ConversationListResult, error) {
			return &client.ConversationListResult{
				Conversations: []client.ConversationItem{
					{ID: "conv_1", Title: "Chat 1"},
				},
				Total: 1,
			}, nil
		},
	})

	r := setupRouter()
	r.Use(authMiddleware())
	r.GET("/api/v1/chat/conversations", ListConversations)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/chat/conversations", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}

	body := decodeBody(t, w)
	code, _ := body["code"].(float64)
	if int(code) != 0 {
		t.Fatalf("code = %v, want 0", body["code"])
	}
}

// --- ListConversations: algorithm unavailable returns 503 ---

func TestListConversations_AlgorithmUnavailable(t *testing.T) {
	initTestChatService(&mockAlgClient{
		listFn: func(ctx context.Context, userID uint, page, pageSize int) (*client.ConversationListResult, error) {
			return nil, client.ErrAlgorithmUnavailable
		},
	})

	r := setupRouter()
	r.Use(authMiddleware())
	r.GET("/api/v1/chat/conversations", ListConversations)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/chat/conversations", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusServiceUnavailable)
	}
}

// --- CreateConversation: success ---

func TestCreateConversation_Success(t *testing.T) {
	initTestChatService(&mockAlgClient{})

	r := setupRouter()
	r.Use(authMiddleware())
	r.POST("/api/v1/chat/conversations", CreateConversation)

	w := postJSON(r, "/api/v1/chat/conversations", map[string]string{"title": "New Chat"}, nil)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}

	body := decodeBody(t, w)
	data, _ := body["data"].(map[string]interface{})
	if data["id"] != "conv_1" {
		t.Fatalf("id = %v, want conv_1", data["id"])
	}
}

// --- CreateConversation: empty body still works (fields optional) ---

func TestCreateConversation_EmptyBody(t *testing.T) {
	initTestChatService(&mockAlgClient{})

	r := setupRouter()
	r.Use(authMiddleware())
	r.POST("/api/v1/chat/conversations", CreateConversation)

	w := postJSON(r, "/api/v1/chat/conversations", map[string]string{}, nil)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}

// --- DeleteConversation: success ---

func TestDeleteConversation_Success(t *testing.T) {
	initTestChatService(&mockAlgClient{})

	r := setupRouter()
	r.Use(authMiddleware())
	r.DELETE("/api/v1/chat/conversations/:id", DeleteConversation)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/chat/conversations/conv_1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}

// --- DeleteConversation: not found returns 404 ---

func TestDeleteConversation_NotFound(t *testing.T) {
	initTestChatService(&mockAlgClient{
		deleteFn: func(ctx context.Context, userID uint, conversationID string) error {
			return client.ErrConversationNotFound
		},
	})

	r := setupRouter()
	r.Use(authMiddleware())
	r.DELETE("/api/v1/chat/conversations/:id", DeleteConversation)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/chat/conversations/conv_999", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

// --- GetMessages: returns 200 ---

func TestGetMessages_Returns200(t *testing.T) {
	initTestChatService(&mockAlgClient{})

	r := setupRouter()
	r.Use(authMiddleware())
	r.GET("/api/v1/chat/conversations/:id/messages", GetMessages)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/chat/conversations/conv_1/messages", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}

// --- SendMessage: missing content returns 400 ---

func TestSendMessage_MissingContent_Returns400(t *testing.T) {
	initTestChatService(&mockAlgClient{})

	r := setupRouter()
	r.Use(authMiddleware())
	r.POST("/api/v1/chat/conversations/:id/messages", SendMessage)

	w := postJSON(r, "/api/v1/chat/conversations/conv_1/messages", map[string]string{}, nil)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

// --- WebSocketHandler: returns 400 with SSE redirect message ---

func TestWebSocketHandler_Returns400(t *testing.T) {
	r := setupRouter()
	r.GET("/api/v1/ws", WebSocketHandler)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/ws", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusBadRequest)
	}

	var body map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &body)
	msg, _ := body["message"].(string)
	if !strings.Contains(msg, "SSE") {
		t.Fatalf("message = %s, want to contain SSE", msg)
	}
}

// suppress unused import warning
var _ dto.ChatMessageRequest
