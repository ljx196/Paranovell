package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

// resetLimiter resets the global limiter to a clean state with the given rate and window.
func resetLimiter(rate int, window time.Duration) {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()
	limiter.visitors = make(map[string]*visitor)
	limiter.rate = rate
	limiter.window = window
}

// rateLimitRouter builds a gin engine that uses the RateLimiter middleware.
// NOTE: RateLimiter() starts a cleanup goroutine each call; that is acceptable in tests.
func rateLimitRouter() *gin.Engine {
	r := gin.New()
	r.Use(RateLimiter())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func doRateLimitRequest(r *gin.Engine, remoteAddr string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.RemoteAddr = remoteAddr
	r.ServeHTTP(w, req)
	return w
}

// --- Under limit passes ---

func TestRateLimiter_UnderLimit_Passes(t *testing.T) {
	resetLimiter(1000, time.Minute)
	r := rateLimitRouter()

	w := doRateLimitRequest(r, "10.0.0.1:12345")
	if w.Code != http.StatusOK {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}

// --- Exceed limit returns 429 ---

func TestRateLimiter_ExceedLimit_Returns429(t *testing.T) {
	resetLimiter(2, time.Minute)
	r := rateLimitRouter()

	// First two requests should pass
	for i := 0; i < 2; i++ {
		w := doRateLimitRequest(r, "10.0.0.2:12345")
		if w.Code != http.StatusOK {
			t.Fatalf("request %d: HTTP status = %d, want %d", i+1, w.Code, http.StatusOK)
		}
	}

	// Third request should be rate-limited
	w := doRateLimitRequest(r, "10.0.0.2:12345")
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("HTTP status = %d, want %d", w.Code, http.StatusTooManyRequests)
	}
}

// --- Window reset allows requests again ---

func TestRateLimiter_WindowReset(t *testing.T) {
	resetLimiter(1, 100*time.Millisecond)
	r := rateLimitRouter()

	// First request passes
	w := doRateLimitRequest(r, "10.0.0.3:12345")
	if w.Code != http.StatusOK {
		t.Fatalf("first request: HTTP status = %d, want %d", w.Code, http.StatusOK)
	}

	// Second request should be rate-limited
	w = doRateLimitRequest(r, "10.0.0.3:12345")
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("second request: HTTP status = %d, want %d", w.Code, http.StatusTooManyRequests)
	}

	// Wait for window to expire
	time.Sleep(150 * time.Millisecond)

	// Now should pass again
	w = doRateLimitRequest(r, "10.0.0.3:12345")
	if w.Code != http.StatusOK {
		t.Fatalf("after reset: HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}

// --- Different IPs are independent ---

func TestRateLimiter_DifferentIPs_Independent(t *testing.T) {
	resetLimiter(1, time.Minute)
	r := rateLimitRouter()

	// IP 1: use up the quota
	w := doRateLimitRequest(r, "10.0.0.4:12345")
	if w.Code != http.StatusOK {
		t.Fatalf("IP1 first: HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
	w = doRateLimitRequest(r, "10.0.0.4:12345")
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("IP1 second: HTTP status = %d, want %d", w.Code, http.StatusTooManyRequests)
	}

	// IP 2: should still pass
	w = doRateLimitRequest(r, "10.0.0.5:12345")
	if w.Code != http.StatusOK {
		t.Fatalf("IP2 first: HTTP status = %d, want %d", w.Code, http.StatusOK)
	}
}

// --- allow() method directly ---

func TestRateLimiter_Allow_NewIP(t *testing.T) {
	resetLimiter(5, time.Minute)
	if !limiter.allow("newip") {
		t.Fatal("allow should return true for a new IP")
	}
}

func TestRateLimiter_Allow_ExceedRate(t *testing.T) {
	resetLimiter(3, time.Minute)

	for i := 0; i < 3; i++ {
		if !limiter.allow("testip") {
			t.Fatalf("allow call %d should return true", i+1)
		}
	}
	if limiter.allow("testip") {
		t.Fatal("allow should return false after exceeding rate")
	}
}

// --- cleanup() removes old visitors ---

func TestRateLimiter_Cleanup(t *testing.T) {
	resetLimiter(100, 50*time.Millisecond)

	limiter.allow("cleanuptest")

	// Visitor should exist
	limiter.mu.Lock()
	if _, exists := limiter.visitors["cleanuptest"]; !exists {
		limiter.mu.Unlock()
		t.Fatal("visitor should exist after allow()")
	}
	limiter.mu.Unlock()

	// Wait beyond 2x the window (cleanup threshold)
	time.Sleep(150 * time.Millisecond)

	limiter.cleanup()

	limiter.mu.Lock()
	_, exists := limiter.visitors["cleanuptest"]
	limiter.mu.Unlock()
	if exists {
		t.Fatal("visitor should be cleaned up after 2x the window")
	}
}
