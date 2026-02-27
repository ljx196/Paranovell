package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

type JWTManager struct {
	secretKey       []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
	issuer          string
}

type TokenClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

var jwtManager *JWTManager

// InitJWT 初始化 JWT 管理器
func InitJWT(secret string, accessTTL, refreshTTL int, issuer string) {
	jwtManager = &JWTManager{
		secretKey:       []byte(secret),
		accessTokenTTL:  time.Duration(accessTTL) * time.Minute,
		refreshTokenTTL: time.Duration(refreshTTL) * 24 * time.Hour,
		issuer:          issuer,
	}
}

// GenerateTokenPair 生成 Access Token 和 Refresh Token
func GenerateTokenPair(userID uint, email string, role string) (*TokenPair, error) {
	if jwtManager == nil {
		return nil, errors.New("JWT manager not initialized")
	}

	now := time.Now()
	accessExpiry := now.Add(jwtManager.accessTokenTTL)
	refreshExpiry := now.Add(jwtManager.refreshTokenTTL)

	// Access Token
	accessClaims := TokenClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    jwtManager.issuer,
			Subject:   "access",
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(jwtManager.secretKey)
	if err != nil {
		return nil, err
	}

	// Refresh Token
	refreshClaims := TokenClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExpiry),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    jwtManager.issuer,
			Subject:   "refresh",
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(jwtManager.secretKey)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		ExpiresIn:    int64(jwtManager.accessTokenTTL.Seconds()),
	}, nil
}

// ValidateToken 验证 Token 并返回 Claims
func ValidateToken(tokenString string) (*TokenClaims, error) {
	if jwtManager == nil {
		return nil, errors.New("JWT manager not initialized")
	}

	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return jwtManager.secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// ValidateRefreshToken 验证 Refresh Token
func ValidateRefreshToken(tokenString string) (*TokenClaims, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.Subject != "refresh" {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
