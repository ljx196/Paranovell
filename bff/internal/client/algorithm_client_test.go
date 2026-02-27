package client

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gennovelweb/bff/internal/config"
)

// newTestClient creates an AlgorithmClient pointing at a test server
func newTestClient(ts *httptest.Server) *AlgorithmClient {
	return &AlgorithmClient{
		baseURL:    ts.URL,
		httpClient: &http.Client{Timeout: 5 * time.Second},
		maxRetry:   3,
	}
}

// --- CreateConversation ---

func TestCreateConversation_Success(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/conversations" {
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}

		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		if body["user_id"] == nil {
			t.Fatal("missing user_id")
		}

		resp := map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{
				"id":         "conv_123",
				"title":      "Test",
				"model":      "standard",
				"created_at": "2025-01-01T00:00:00Z",
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	result, err := c.CreateConversation(context.Background(), 1, "Test", "standard")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.ID != "conv_123" {
		t.Fatalf("id = %s, want conv_123", result.ID)
	}
}

// --- ListConversations ---

func TestListConversations_Success(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("expected GET, got %s", r.Method)
		}
		if !strings.HasPrefix(r.URL.Path, "/api/conversations") {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}

		resp := map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{
				"conversations": []map[string]interface{}{
					{"id": "conv_1", "title": "Chat 1", "model": "standard", "message_count": 5,
						"created_at": "2025-01-01T00:00:00Z", "updated_at": "2025-01-01T12:00:00Z"},
				},
				"total": 1,
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	result, err := c.ListConversations(context.Background(), 1, 1, 20)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Total != 1 {
		t.Fatalf("total = %d, want 1", result.Total)
	}
	if len(result.Conversations) != 1 {
		t.Fatalf("conversations count = %d, want 1", len(result.Conversations))
	}
}

// --- DeleteConversation ---

func TestDeleteConversation_Success(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			t.Fatalf("expected DELETE, got %s", r.Method)
		}
		resp := map[string]interface{}{"code": 0, "message": "deleted"}
		json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	err := c.DeleteConversation(context.Background(), 1, "conv_123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

// --- GetMessages ---

func TestGetMessages_Success(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{
				"messages": []map[string]interface{}{
					{"id": "msg_1", "role": "user", "content": "hello", "created_at": "2025-01-01T00:00:00Z"},
				},
				"total": 1,
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	result, err := c.GetMessages(context.Background(), 1, "conv_1", 1, 50)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Messages) != 1 {
		t.Fatalf("messages count = %d, want 1", len(result.Messages))
	}
}

// --- SendMessage ---

func TestSendMessage_Success(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]interface{}{
			"code": 0,
			"data": map[string]interface{}{
				"message": map[string]interface{}{
					"id": "msg_2", "role": "assistant", "content": "Hi!", "created_at": "2025-01-01T00:00:05Z",
				},
				"usage": map[string]interface{}{
					"input_tokens": 10, "output_tokens": 20, "total_tokens": 30, "model": "standard",
				},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	result, err := c.SendMessage(context.Background(), 1, "conv_1", "hello", "standard")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Message.ID != "msg_2" {
		t.Fatalf("message id = %s, want msg_2", result.Message.ID)
	}
	if result.Usage.TotalTokens != 30 {
		t.Fatalf("total_tokens = %d, want 30", result.Usage.TotalTokens)
	}
}

// --- Error mapping ---

func TestErrorMapping_404(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	// Use maxRetry=1 to skip retries for 4xx
	_, err := c.CreateConversation(context.Background(), 1, "Test", "standard")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err != ErrConversationNotFound {
		t.Fatalf("err = %v, want ErrConversationNotFound", err)
	}
}

func TestErrorMapping_400(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	_, err := c.SendMessage(context.Background(), 1, "conv_1", "", "standard")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err != ErrAlgorithmBadRequest {
		t.Fatalf("err = %v, want ErrAlgorithmBadRequest", err)
	}
}

func TestErrorMapping_503(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer ts.Close()

	c := &AlgorithmClient{
		baseURL:    ts.URL,
		httpClient: &http.Client{Timeout: 5 * time.Second},
		maxRetry:   1, // single attempt to speed up test
	}
	_, err := c.ListConversations(context.Background(), 1, 1, 20)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err != ErrAlgorithmUnavailable {
		t.Fatalf("err = %v, want ErrAlgorithmUnavailable", err)
	}
}

// --- Retry behavior ---

func TestRetry_503_RetryCount(t *testing.T) {
	attempts := 0
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	_, err := c.ListConversations(context.Background(), 1, 1, 20)
	if err == nil {
		t.Fatal("expected error")
	}
	if attempts != 3 {
		t.Fatalf("attempts = %d, want 3", attempts)
	}
}

func TestRetry_400_NoRetry(t *testing.T) {
	attempts := 0
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	_, err := c.SendMessage(context.Background(), 1, "conv_1", "hello", "standard")
	if err == nil {
		t.Fatal("expected error")
	}
	// 4xx should not retry
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1 (no retry for 4xx)", attempts)
	}
}

// --- StreamMessage ---

func TestStreamMessage_Success(t *testing.T) {
	sseData := "data: {\"type\":\"token\",\"content\":\"Hello\"}\n\ndata: {\"type\":\"done\",\"usage\":{\"input_tokens\":5,\"output_tokens\":10,\"total_tokens\":15,\"model\":\"standard\"}}\n\n"
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(sseData))
	}))
	defer ts.Close()

	c := newTestClient(ts)
	body, err := c.StreamMessage(context.Background(), 1, "conv_1", "hello", "standard")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer body.Close()

	data, err := io.ReadAll(body)
	if err != nil {
		t.Fatalf("failed to read body: %v", err)
	}
	if !strings.Contains(string(data), "Hello") {
		t.Fatalf("response does not contain expected content")
	}
}

func TestStreamMessage_ServerError(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer ts.Close()

	c := newTestClient(ts)
	_, err := c.StreamMessage(context.Background(), 1, "conv_1", "hello", "standard")
	if err == nil {
		t.Fatal("expected error")
	}
	if err != ErrAlgorithmUnavailable {
		t.Fatalf("err = %v, want ErrAlgorithmUnavailable", err)
	}
}

// --- NewAlgorithmClient ---

func TestNewAlgorithmClient_Defaults(t *testing.T) {
	cfg := &config.AlgorithmConfig{
		BaseURL: "http://localhost:8000",
		Timeout: 0, // should default to 30s
		Retry:   0, // should default to 3
	}
	c := NewAlgorithmClient(cfg)
	if c.baseURL != "http://localhost:8000" {
		t.Fatalf("baseURL = %s, want http://localhost:8000", c.baseURL)
	}
	if c.maxRetry != 3 {
		t.Fatalf("maxRetry = %d, want 3", c.maxRetry)
	}
	if c.httpClient.Timeout != 30*time.Second {
		t.Fatalf("timeout = %v, want 30s", c.httpClient.Timeout)
	}
}

// --- Timeout handling ---

func TestTimeout_ReturnsUnavailable(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate a slow response
		time.Sleep(3 * time.Second)
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	c := &AlgorithmClient{
		baseURL:    ts.URL,
		httpClient: &http.Client{Timeout: 100 * time.Millisecond},
		maxRetry:   1,
	}

	_, err := c.CreateConversation(context.Background(), 1, "Test", "standard")
	if err == nil {
		t.Fatal("expected error due to timeout")
	}
	// Network timeout should map to unavailable
	if !strings.Contains(err.Error(), "unavailable") {
		t.Fatalf("expected unavailable error, got: %v", err)
	}
}
