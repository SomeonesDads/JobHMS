package handlers

import (
	"log"
	"net/http"
	"voting-backend/internal/db"
	"voting-backend/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func AdminLogin(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid admin credentials"})
		return
	}

	// Check if password is set (not nil)
	if user.Password == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid admin credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid admin credentials"})
		return
	}

	if user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"Role": "admin",
		"Name": user.Name,
		"ID":   user.ID,
	})
}

func SeedAdmin() {
	targetEmail := "admin@hms.com"
	var user models.User

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash admin password")
	}
	password := string(hashedPassword)
	username := "admin"

	// 1. Check if the Target Email already exists
	if err := db.DB.Where("email = ?", targetEmail).First(&user).Error; err == nil {
		// Found user with this email. Promote/Update to Admin + Password.
		updates := map[string]interface{}{
			"Password":           &password,
			"Role":               "admin",
			"VerificationStatus": "approved",
			// We do NOT forcefully change username to "admin" here to avoid colliding with ID 4 if ID 4 is different.
		}
		if err := db.DB.Model(&user).Updates(updates).Error; err != nil {
			log.Printf("Failed to update existing admin email user: %v", err)
		} else {
			log.Println("Existing user promoted/restored to admin: admin@hms.com")
		}
		return
	}

	// 2. Email is free. Check if 'admin' username exists (Legacy/Previous Seed)
	var legacyUser models.User
	if err := db.DB.Where("username = ?", "admin").First(&legacyUser).Error; err == nil {
		// Found legacy admin (e.g. ID 4), and we know targetEmail is free (from Step 1).
		// Safe to update email.
		updates := map[string]interface{}{
			"Email":              targetEmail,
			"Password":           &password,
			"Role":               "admin",
			"VerificationStatus": "approved",
		}
		if err := db.DB.Model(&legacyUser).Updates(updates).Error; err != nil {
			log.Printf("Failed to migrate legacy admin user: %v", err)
		} else {
			log.Println("Legacy admin user migrated to: admin@hms.com")
		}
		return
	}

	// 3. Neither exists. Create fresh.
	newAdmin := models.User{
		Name:               "Administrator",
		Username:           &username,
		Password:           &password,
		Role:               "admin",
		VerificationStatus: "approved",
		NIM:                "ADMIN",
		Email:              targetEmail,
	}
	if err := db.DB.Create(&newAdmin).Error; err != nil {
		log.Printf("Failed to create new admin: %v", err)
	} else {
		log.Println("New admin account created: admin@hms.com")
	}
}
