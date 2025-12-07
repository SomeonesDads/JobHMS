package handlers

import (
	"net/http"
	"time"
	"voting-backend/internal/db"
	"voting-backend/internal/models"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	NIM   string `json:"nim"`
	Email string `json:"email"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Simple validation for 135xxxxx format
	if len(req.NIM) != 8 || req.NIM[:3] != "135" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid NIM format. Must be 135xxxxx"})
		return
	}

	var user models.User
	result := db.DB.Where("nim = ?", req.NIM).First(&user)

	if result.Error != nil {
		// Register new user if not exists
		user = models.User{
			NIM:   req.NIM,
			Email: req.Email,
			Role:  "voter",
		}
		// Basic admin check (hardcoded for simplicity as per requirements "simple")
		if req.NIM == "13500000" { // Example Admin NIM
			user.Role = "admin"
		}
		db.DB.Create(&user)
	} else {
		// Update email if changed (optional, but good for simple auth)
		if user.Email != req.Email {
			user.Email = req.Email
			db.DB.Save(&user)
		}
	}

	c.JSON(http.StatusOK, user)
}

func GetCandidates(c *gin.Context) {
	var candidates []models.Candidate
	db.DB.Find(&candidates)
	c.JSON(http.StatusOK, candidates)
}

func Vote(c *gin.Context) {
	var req struct {
		UserID      uint `json:"userId"`
		CandidateID uint `json:"candidateId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user models.User
	if err := db.DB.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.HasVoted {
		c.JSON(http.StatusConflict, gin.H{"error": "User has already voted"})
		return
	}

	// Atomic transaction
	tx := db.DB.Begin()

	if err := tx.Model(&user).Update("has_voted", true).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
		return
	}

	vote := models.Vote{
		UserID:      req.UserID,
		CandidateID: req.CandidateID,
		Timestamp:   time.Now(),
	}

	if err := tx.Create(&vote).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cast vote"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Vote cast successfully"})
}

func GetResults(c *gin.Context) {
	type Result struct {
		CandidateID uint
		Name        string
		Count       int64
	}
	var results []Result

	// Join candidates and votes to get counts
	// This query counts votes for each candidate
	db.DB.Table("candidates").
		Select("candidates.id as candidate_id, candidates.name, count(votes.id) as count").
		Joins("left join votes on votes.candidate_id = candidates.id").
		Group("candidates.id").
		Scan(&results)

	c.JSON(http.StatusOK, results)
}

func SeedCandidates() {
	var count int64
	db.DB.Model(&models.Candidate{}).Count(&count)
	if count == 0 {
		candidates := []models.Candidate{
			{Name: "Candidate 1", Description: "Visionary Leader", ImageURL: "https://via.placeholder.com/150"},
			{Name: "Candidate 2", Description: "The People's Choice", ImageURL: "https://via.placeholder.com/150"},
			{Name: "Candidate 3", Description: "Future Focused", ImageURL: "https://via.placeholder.com/150"},
		}
		db.DB.Create(&candidates)
	}
}
