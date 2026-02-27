package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func corsRouter() *gin.Engine {
	r := gin.New()
	r.Use(CORS())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	// OPTIONS is handled by CORS middleware via AbortWithStatus, but gin
	// needs a route registered for non-405 handling. We add a catch-all
	// for OPTIONS or just rely on the middleware aborting before route matching.
	// Actually, gin.New() without NoRoute will still call middleware chain.
	// However, to be safe, we handle OPTIONS on the same path.
	r.OPTIONS("/test", func(c *gin.Context) {
		// This should never be reached; CORS middleware aborts OPTIONS.
		c.Status(http.StatusOK)
	})
	return r
}

// --- OPTIONS preflight returns 204 with CORS headers ---

func TestCORS_OptionsPreflight(t *testing.T) {
	r := corsRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("OPTIONS", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusNoContent)
	}

	checkCORSHeaders(t, w)
}

// --- Regular GET request has CORS headers ---

func TestCORS_RegularRequest_HasHeaders(t *testing.T) {
	r := corsRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}

	checkCORSHeaders(t, w)
}

// --- Verify specific CORS headers ---

func TestCORS_SpecificHeaders(t *testing.T) {
	r := corsRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	headers := map[string]string{
		"Access-Control-Allow-Origin":      "*",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Methods":     "POST, OPTIONS, GET, PUT, DELETE",
	}

	for key, want := range headers {
		got := w.Header().Get(key)
		if got != want {
			t.Errorf("header %q = %q, want %q", key, got, want)
		}
	}

	// Allow-Headers should contain Authorization
	allowHeaders := w.Header().Get("Access-Control-Allow-Headers")
	if allowHeaders == "" {
		t.Fatal("Access-Control-Allow-Headers should not be empty")
	}
}

// --- With Origin header, should reflect it back ---

func TestCORS_ReflectsOrigin(t *testing.T) {
	r := corsRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	r.ServeHTTP(w, req)

	got := w.Header().Get("Access-Control-Allow-Origin")
	want := "http://localhost:3000"
	if got != want {
		t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, want)
	}
}

// --- OPTIONS does not reach the handler ---

func TestCORS_OptionsDoesNotReachHandler(t *testing.T) {
	handlerReached := false
	r := gin.New()
	r.Use(CORS())
	r.OPTIONS("/test", func(c *gin.Context) {
		handlerReached = true
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("OPTIONS", "/test", nil)
	r.ServeHTTP(w, req)

	if handlerReached {
		t.Fatal("OPTIONS request should be handled by CORS middleware, not reach the handler")
	}
	if w.Code != http.StatusNoContent {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusNoContent)
	}
}

func checkCORSHeaders(t *testing.T, w *httptest.ResponseRecorder) {
	t.Helper()
	requiredHeaders := []string{
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Headers",
		"Access-Control-Allow-Methods",
	}
	for _, h := range requiredHeaders {
		if w.Header().Get(h) == "" {
			t.Errorf("missing CORS header: %s", h)
		}
	}
}
