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
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user models.User
	if err := db.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
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
	var count int64
	db.DB.Model(&models.User{}).Where("username = ?", "admin").Count(&count)
	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("p4n1t14pemilu2025"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Failed to hash admin password")
		}

		username := "admin"
		password := string(hashedPassword)

		admin := models.User{
			Name:               "Administrator",
			Username:           &username,
			Password:           &password,
			Role:               "admin",
			VerificationStatus: "approved",
			NIM:                "ADMIN",            // Unique fallback
			Email:              "admin@local.host", // Unique fallback
		}
		if err := db.DB.Create(&admin).Error; err != nil {
			log.Printf("Failed to seed admin: %v", err)
		} else {
			log.Println("Admin account seeded successfully")
		}
	}
}
