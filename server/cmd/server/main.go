package main

import (
	"log"
	"os"
	"voting-backend/internal/db"
	"voting-backend/internal/handlers"
	"voting-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connect to database
	db.Connect()

	// Create uploads directory
	if err := os.MkdirAll("uploads", 0755); err != nil {
		log.Fatal("Failed to create uploads directory: ", err)
	}

	// Auto-migrate models
	// Auto-migrate models
	err := db.DB.AutoMigrate(&models.User{}, &models.Candidate{}, &models.Vote{}, &models.Setting{})
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}

	r := gin.Default()

	// Setup CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true // For development
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

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
	r.GET("/settings", handlers.GetSettings)             // Public for countdown
	r.POST("/admin/settings", handlers.SaveSettings)     // Admin only

	// Legacy or Specific upload route if needed, currently Register handles it.
	// But let's keep it if existing frontend uses it?
	// The request said "register page... requires photo". So new flow uses Register.
	// Old flow used /upload-verification.
	// I'll keep it just in case, but minimal impact.
	r.POST("/upload-verification", handlers.UploadVerification)

	r.Static("/uploads", "./uploads")

	// Seed admin account only
	handlers.SeedAdmin() // Seed Admin Account

	r.Run(":8080")
}
