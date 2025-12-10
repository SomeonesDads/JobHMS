package main

import (
	"log"
	"os"
	"time"
	"voting-backend/internal/db"
	"voting-backend/internal/email"
	"voting-backend/internal/handlers"
	"voting-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
        if err := godotenv.Load("../../.env"); err != nil {
		    log.Println("No .env file found, relying on environment variables")
        } else {
            log.Println("Loaded .env from used default root")
        }
	} else {
         log.Println("Loaded .env from current directory")
    }

	// Connect to database
	db.Connect()

	// Create uploads directory
	if err := os.MkdirAll("uploads", 0755); err != nil {
		log.Fatal("Failed to create uploads directory: ", err)
	}

	// Auto-migrate models
	err := db.DB.AutoMigrate(&models.User{}, &models.Candidate{}, &models.Vote{}, &models.Setting{})
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}

	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()

		for {
			<-ticker.C
			var startSetting models.Setting
			if err := db.DB.Where("key = ?", "startTime").First(&startSetting).Error; err == nil && startSetting.Value != "" {
				startTime, err := time.Parse("2006-01-02T15:04", startSetting.Value)
				if err == nil {
					timeLeft := time.Until(startTime)
					if timeLeft > 0 && timeLeft < 24*time.Hour {
						var users []models.User
						db.DB.Where("verification_status = ? AND reminder_sent = ?", "approved", false).Find(&users)

						for _, u := range users {
							if u.Email != "" && u.Token != "" {
								err := email.SendReminderEmail(u.Email, u.Name, u.Token)
								if err == nil {
									db.DB.Model(&u).Update("reminder_sent", true)
									log.Printf("Reminder sent to %s", u.Email)
								} else {
									log.Printf("Failed to send reminder to %s: %v", u.Email, err)
								}
							}
						}
					}
				}
			}
		}
	}()

	r := gin.Default()

	r.Static("/uploads", "./uploads")

	// Setup CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Routes
	r.POST("/login", handlers.Login)
	r.POST("/register", handlers.Register)
	r.POST("/admin/login", handlers.AdminLogin) // Added Admin Login Logic

	r.GET("/candidates", handlers.GetCandidates)
	r.POST("/vote", handlers.Vote)

	r.GET("/admin/results", handlers.GetResults)

	// Admin routes
	r.GET("/admin/users/pending", handlers.GetPendingUsers)
	r.GET("/admin/users/search", handlers.SearchUsers) // Search users
	r.POST("/admin/verify", handlers.VerifyUser)
	r.POST("/admin/candidates", handlers.CreateCandidate)
	r.DELETE("/admin/candidates/:id", handlers.DeleteCandidate) // Added

	// Vote Logic V3 routes
	r.GET("/admin/votes/pending", handlers.GetPendingVotes)
	r.GET("/admin/votes/search", handlers.SearchVotes)  // Search votes
	r.POST("/admin/votes/verify", handlers.ApproveVote) // Approve/Reject Vote

	// Settings
	r.GET("/settings", handlers.GetSettings)         // Public for countdown
	r.POST("/admin/settings", handlers.SaveSettings) // Admin only

	// Legacy or Specific upload route if needed, currently Register handles it.
	// But let's keep it if existing frontend uses it?
	// The request said "register page... requires photo". So new flow uses Register.
	// Old flow used /upload-verification.
	// I'll keep it just in case, but minimal impact.
	r.POST("/upload-verification", handlers.UploadVerification)

	// Seed admin account only
	handlers.SeedAdmin() // Seed Admin Account

	r.Run(":8080")
}
