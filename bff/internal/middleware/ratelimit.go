package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Simple in-memory rate limiter
// TODO: Replace with Redis-based rate limiter for production
type rateLimiter struct {
	visitors map[string]*visitor
	mu       sync.Mutex
	rate     int           // requests per window
	window   time.Duration // time window
}

type visitor struct {
	count    int
	lastSeen time.Time
}

var limiter = &rateLimiter{
	visitors: make(map[string]*visitor),
	rate:     1000,             // 1000 requests
	window:   time.Minute,      // per minute
}

func RateLimiter() gin.HandlerFunc {
	// Clean up old visitors periodically
	go func() {
		for {
			time.Sleep(time.Minute)
			limiter.cleanup()
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()

		if !limiter.allow(ip) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	now := time.Now()

	if !exists {
		rl.visitors[ip] = &visitor{count: 1, lastSeen: now}
		return true
	}

	// Reset if window has passed
	if now.Sub(v.lastSeen) > rl.window {
		v.count = 1
		v.lastSeen = now
		return true
	}

	// Check rate limit
	if v.count >= rl.rate {
		return false
	}

	v.count++
	v.lastSeen = now
	return true
}

func (rl *rateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	for ip, v := range rl.visitors {
		if time.Since(v.lastSeen) > rl.window*2 {
			delete(rl.visitors, ip)
		}
	}
}
