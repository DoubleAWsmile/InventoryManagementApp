package auth

import (
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hashBytes), nil
}

func CheckPassword(password string, passwordHash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))
	return err == nil
}

func IsStrongEnough(password string) bool {
	hasCapital := false
	hasNonAlphanumeric := false
	longEnough := len(password) >= 8

	for _, ch := range password {
		if unicode.IsUpper(ch) {
			hasCapital = true
		}

		if !unicode.IsLetter(ch) && !unicode.IsDigit(ch) {
			hasNonAlphanumeric = true
		}
	}

	return hasCapital && hasNonAlphanumeric && longEnough
}
