package main

import (
	"log"
	"os"
	"voting-backend/internal/db"
	"voting-backend/internal/handlers"
	"voting-backend/internal/models"
	"voting-backend/internal/services/pcloud"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env first so environment variables are available
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to database (now can use env vars)
	db.Connect()

	// Init pCloud
	pUse := os.Getenv("PCLOUD_USERNAME")
	pPass := os.Getenv("PCLOUD_PASSWORD")
	if pUse != "" && pPass != "" {
		pc, err := pcloud.NewClient(pUse, pPass)
		if err != nil {
			log.Printf("Failed to login to pCloud: %v", err)
		} else {
			handlers.SetPCloudClient(pc)
			log.Println("pCloud integration enabled")
		}
	} else {
		log.Println("pCloud credentials not found, using local storage")
	}

	// Create uploads directory
	if err := os.MkdirAll("uploads", 0755); err != nil {
		log.Fatal("Failed to create uploads directory: ", err)
	}

	// Auto-migrate models
	err := db.DB.AutoMigrate(&models.User{}, &models.Candidate{}, &models.Vote{}, &models.ElectionSettings{})
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
	r.GET("/settings", handlers.GetSettings) // Public settings (start time)

	r.GET("/candidates", handlers.GetCandidates)
	r.POST("/vote", handlers.Vote)

	r.GET("/admin/results", handlers.GetResults)

	// Admin routes
	r.GET("/admin/users/pending", handlers.GetPendingUsers)
	r.POST("/admin/verify", handlers.VerifyUser)
	r.POST("/admin/candidates", handlers.CreateCandidate)
	r.DELETE("/admin/candidates/:id", handlers.DeleteCandidate) // Added
	r.POST("/admin/settings", handlers.UpdateSettings)          // Admin update settings

	// Vote Logic V3 routes
	r.GET("/admin/votes/pending", handlers.GetPendingVotes)
	r.POST("/admin/votes/verify", handlers.ApproveVote) // Approve/Reject Vote

	// Legacy or Specific upload route if needed, currently Register handles it.
	// But let's keep it if existing frontend uses it?
	// The request said "register page... requires photo". So new flow uses Register.
	// Old flow used /upload-verification.
	// I'll keep it just in case, but minimal impact.
	r.POST("/upload-verification", handlers.UploadVerification)

	r.Static("/uploads", "./uploads")

	// Seed data if needed
	handlers.SeedCandidates()

	r.Run(":8080")
}
