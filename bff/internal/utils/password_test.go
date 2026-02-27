package utils

import (
	"regexp"
	"testing"
)

// --- HashPassword ---

func TestHashPassword_ReturnsNonEmpty(t *testing.T) {
	hash, err := HashPassword("mysecret")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if hash == "" {
		t.Fatal("HashPassword returned empty string")
	}
}

func TestHashPassword_DifferentFromInput(t *testing.T) {
	password := "mysecret"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if hash == password {
		t.Fatal("HashPassword returned the same string as input (no hashing)")
	}
}

func TestHashPassword_DifferentHashesForSameInput(t *testing.T) {
	password := "mysecret"
	hash1, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword (1) returned error: %v", err)
	}
	hash2, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword (2) returned error: %v", err)
	}
	if hash1 == hash2 {
		t.Fatal("Two hashes of the same password should differ (bcrypt uses random salt)")
	}
}

// --- CheckPassword ---

func TestCheckPassword_CorrectPassword(t *testing.T) {
	password := "correcthorse"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if !CheckPassword(password, hash) {
		t.Fatal("CheckPassword should return true for the correct password")
	}
}

func TestCheckPassword_WrongPassword(t *testing.T) {
	hash, err := HashPassword("correcthorse")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if CheckPassword("wrongpassword", hash) {
		t.Fatal("CheckPassword should return false for an incorrect password")
	}
}

// --- GenerateInviteCode ---

func TestGenerateInviteCode_MaxLength8(t *testing.T) {
	code := GenerateInviteCode()
	if len(code) > 8 {
		t.Fatalf("GenerateInviteCode length = %d, want <= 8", len(code))
	}
}

func TestGenerateInviteCode_AlphanumericUppercase(t *testing.T) {
	re := regexp.MustCompile(`^[A-Z0-9]+$`)
	for i := 0; i < 20; i++ {
		code := GenerateInviteCode()
		if !re.MatchString(code) {
			t.Fatalf("GenerateInviteCode returned %q which is not alphanumeric/uppercase", code)
		}
	}
}

func TestGenerateInviteCode_UniqueAcrossCalls(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		code := GenerateInviteCode()
		if seen[code] {
			t.Fatalf("GenerateInviteCode produced duplicate code %q", code)
		}
		seen[code] = true
	}
}

// --- GenerateRandomToken ---

func TestGenerateRandomToken_NonEmpty(t *testing.T) {
	token := GenerateRandomToken()
	if token == "" {
		t.Fatal("GenerateRandomToken returned empty string")
	}
}

func TestGenerateRandomToken_UniqueAcrossCalls(t *testing.T) {
	token1 := GenerateRandomToken()
	token2 := GenerateRandomToken()
	if token1 == token2 {
		t.Fatal("Two calls to GenerateRandomToken should produce unique tokens")
	}
}
