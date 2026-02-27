package utils

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// setupJWT initializes the global jwtManager for tests.
func setupJWT() {
	InitJWT("test-secret-key-for-jwt-testing", 60, 7, "test-issuer")
}

// teardownJWT resets the global jwtManager to nil.
func teardownJWT() {
	jwtManager = nil
}

// --- InitJWT ---

func TestInitJWT_SetsManager(t *testing.T) {
	teardownJWT()
	defer teardownJWT()

	InitJWT("secret", 30, 7, "issuer")
	if jwtManager == nil {
		t.Fatal("jwtManager should not be nil after InitJWT")
	}
	if string(jwtManager.secretKey) != "secret" {
		t.Fatalf("secretKey = %q, want %q", string(jwtManager.secretKey), "secret")
	}
	if jwtManager.accessTokenTTL != 30*time.Minute {
		t.Fatalf("accessTokenTTL = %v, want %v", jwtManager.accessTokenTTL, 30*time.Minute)
	}
	if jwtManager.issuer != "issuer" {
		t.Fatalf("issuer = %q, want %q", jwtManager.issuer, "issuer")
	}
}

// --- GenerateTokenPair ---

func TestGenerateTokenPair_ReturnsBothTokens(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	pair, err := GenerateTokenPair(1, "user@example.com", "user")
	if err != nil {
		t.Fatalf("GenerateTokenPair error: %v", err)
	}
	if pair.AccessToken == "" {
		t.Fatal("AccessToken should not be empty")
	}
	if pair.RefreshToken == "" {
		t.Fatal("RefreshToken should not be empty")
	}
	if pair.ExpiresIn <= 0 {
		t.Fatalf("ExpiresIn = %d, want > 0", pair.ExpiresIn)
	}
}

func TestGenerateTokenPair_AccessTokenHasCorrectClaims(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	pair, err := GenerateTokenPair(42, "test@example.com", "admin")
	if err != nil {
		t.Fatalf("GenerateTokenPair error: %v", err)
	}

	claims, err := ValidateToken(pair.AccessToken)
	if err != nil {
		t.Fatalf("ValidateToken error: %v", err)
	}
	if claims.UserID != 42 {
		t.Fatalf("UserID = %d, want 42", claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Fatalf("Email = %q, want %q", claims.Email, "test@example.com")
	}
	if claims.Role != "admin" {
		t.Fatalf("Role = %q, want %q", claims.Role, "admin")
	}
	if claims.Subject != "access" {
		t.Fatalf("Subject = %q, want %q", claims.Subject, "access")
	}
}

func TestGenerateTokenPair_RefreshTokenHasRefreshSubject(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	pair, err := GenerateTokenPair(1, "user@example.com", "user")
	if err != nil {
		t.Fatalf("GenerateTokenPair error: %v", err)
	}

	claims, err := ValidateToken(pair.RefreshToken)
	if err != nil {
		t.Fatalf("ValidateToken error: %v", err)
	}
	if claims.Subject != "refresh" {
		t.Fatalf("Refresh token Subject = %q, want %q", claims.Subject, "refresh")
	}
}

func TestGenerateTokenPair_WithoutInitJWT(t *testing.T) {
	teardownJWT()

	_, err := GenerateTokenPair(1, "user@example.com", "user")
	if err == nil {
		t.Fatal("GenerateTokenPair should fail when JWT manager not initialized")
	}
	if err.Error() != "JWT manager not initialized" {
		t.Fatalf("unexpected error: %v", err)
	}
}

// --- ValidateToken ---

func TestValidateToken_ValidToken(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	pair, _ := GenerateTokenPair(10, "valid@example.com", "user")
	claims, err := ValidateToken(pair.AccessToken)
	if err != nil {
		t.Fatalf("ValidateToken error: %v", err)
	}
	if claims.UserID != 10 {
		t.Fatalf("UserID = %d, want 10", claims.UserID)
	}
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	// Create an expired token manually
	now := time.Now()
	expiredClaims := TokenClaims{
		UserID: 1,
		Email:  "expired@example.com",
		Role:   "user",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now.Add(-2 * time.Hour)),
			Issuer:    jwtManager.issuer,
			Subject:   "access",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	tokenString, err := token.SignedString(jwtManager.secretKey)
	if err != nil {
		t.Fatalf("failed to create expired token: %v", err)
	}

	_, err = ValidateToken(tokenString)
	if err != ErrExpiredToken {
		t.Fatalf("ValidateToken error = %v, want ErrExpiredToken", err)
	}
}

func TestValidateToken_TamperedToken(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	pair, _ := GenerateTokenPair(1, "user@example.com", "user")
	tampered := pair.AccessToken + "tampered"

	_, err := ValidateToken(tampered)
	if err != ErrInvalidToken {
		t.Fatalf("ValidateToken error = %v, want ErrInvalidToken", err)
	}
}

func TestValidateToken_EmptyString(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	_, err := ValidateToken("")
	if err != ErrInvalidToken {
		t.Fatalf("ValidateToken error = %v, want ErrInvalidToken", err)
	}
}

func TestValidateToken_WithoutInitJWT(t *testing.T) {
	teardownJWT()

	_, err := ValidateToken("some.token.here")
	if err == nil {
		t.Fatal("ValidateToken should fail when JWT manager not initialized")
	}
	if err.Error() != "JWT manager not initialized" {
		t.Fatalf("unexpected error: %v", err)
	}
}

// --- ValidateRefreshToken ---

func TestValidateRefreshToken_ValidRefreshToken(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	pair, _ := GenerateTokenPair(5, "refresh@example.com", "user")
	claims, err := ValidateRefreshToken(pair.RefreshToken)
	if err != nil {
		t.Fatalf("ValidateRefreshToken error: %v", err)
	}
	if claims.UserID != 5 {
		t.Fatalf("UserID = %d, want 5", claims.UserID)
	}
	if claims.Subject != "refresh" {
		t.Fatalf("Subject = %q, want %q", claims.Subject, "refresh")
	}
}

func TestValidateRefreshToken_AccessTokenRejected(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	pair, _ := GenerateTokenPair(1, "user@example.com", "user")
	_, err := ValidateRefreshToken(pair.AccessToken)
	if err != ErrInvalidToken {
		t.Fatalf("ValidateRefreshToken with access token: error = %v, want ErrInvalidToken", err)
	}
}

func TestValidateRefreshToken_ExpiredRefreshToken(t *testing.T) {
	setupJWT()
	defer teardownJWT()

	// Create an expired refresh token manually
	now := time.Now()
	expiredClaims := TokenClaims{
		UserID: 1,
		Email:  "expired@example.com",
		Role:   "user",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now.Add(-2 * time.Hour)),
			Issuer:    jwtManager.issuer,
			Subject:   "refresh",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	tokenString, _ := token.SignedString(jwtManager.secretKey)

	_, err := ValidateRefreshToken(tokenString)
	if err != ErrExpiredToken {
		t.Fatalf("ValidateRefreshToken error = %v, want ErrExpiredToken", err)
	}
}
