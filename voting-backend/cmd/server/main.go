package main

import (
	"log"
	"voting-backend/internal/db"
	"voting-backend/internal/handlers"
	"voting-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connect to database
	db.Connect()

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

	// Seed data if needed
	handlers.SeedCandidates()

	r.Run(":8080")
}
