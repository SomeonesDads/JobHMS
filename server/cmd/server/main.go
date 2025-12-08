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
	// Connect to database
	db.Connect()

	// Create uploads directory
	if err := os.MkdirAll("uploads", 0755); err != nil {
		log.Fatal("Failed to create uploads directory: ", err)
	}

	// Auto-migrate models
	err := db.DB.AutoMigrate(&models.User{}, &models.Candidate{}, &models.Vote{})
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
	r.GET("/candidates", handlers.GetCandidates)
	r.POST("/vote", handlers.Vote)
	r.GET("/admin/results", handlers.GetResults)

	r.POST("/upload-verification", handlers.UploadVerification)
	r.GET("/admin/verifications", handlers.GetPendingVerifications)
	r.POST("/admin/verify", handlers.VerifyUser)

	r.Static("/uploads", "./uploads")

	// Seed data if needed
	handlers.SeedCandidates()

	r.Run(":8080")
}
