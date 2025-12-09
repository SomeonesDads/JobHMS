package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"
	"voting-backend/internal/db"
	"voting-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LoginRequest struct {
	NIM   string `json:"nim"`
	Token string `json:"token"` // Changed from Email
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// User Login (NIM + Token)
	var user models.User
	result := db.DB.Where("nim = ?", req.NIM).First(&user)

	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not registered"})
		return
	}

	// Check Token
	if user.Token != req.Token {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Token"})
		return
	}

	// Check Verification Status
	if user.VerificationStatus != "approved" {
		c.JSON(http.StatusForbidden, gin.H{"error": "User not verified yet"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func Register(c *gin.Context) {
	name := c.PostForm("name")
	nim := c.PostForm("nim")
	email := c.PostForm("email")

	if name == "" || nim == "" || email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama, NIM, dan Email wajib diisi"})
		return
	}

	// Validate NIM format: must be 150 followed by 5 digits
	if len(nim) != 8 || nim[:3] != "150" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format NIM harus 150xxxxx (8 digit, dimulai dengan 150)"})
		return
	}
	// Check if last 5 characters are digits
	for i := 3; i < 8; i++ {
		if nim[i] < '0' || nim[i] > '9' {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format NIM harus 150xxxxx (x harus angka)"})
			return
		}
	}

	// Check if user exists by NIM or Email
	var existingUser models.User
	if err := db.DB.Where("nim = ? OR email = ?", nim, email).First(&existingUser).Error; err == nil {
		if existingUser.NIM == nim {
			c.JSON(http.StatusConflict, gin.H{"error": "NIM sudah terdaftar"})
		} else {
			c.JSON(http.StatusConflict, gin.H{"error": "Email sudah terdaftar"})
		}
		return
	}

	profileFile, err1 := c.FormFile("profile_image")
	ktmFile, err2 := c.FormFile("ktm_image")

	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Foto profil dan KTM wajib diunggah"})
		return
	}

	// Save files
	profilePath := fmt.Sprintf("uploads/%s_profile%s", nim, filepath.Ext(profileFile.Filename))
	ktmPath := fmt.Sprintf("uploads/%s_ktm%s", nim, filepath.Ext(ktmFile.Filename))

	if err := c.SaveUploadedFile(profileFile, profilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan foto profil"})
		return
	}
	if err := c.SaveUploadedFile(ktmFile, ktmPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan foto KTM"})
		return
	}

	newUser := models.User{
		Name:               name,
		NIM:                nim,
		Email:              email,
		Role:               "voter",
		ProfileImage:       profilePath,
		KTMImage:           ktmPath,
		VerificationStatus: "pending",
	}

	if err := db.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftarkan pengguna"})
		return
	}

	c.JSON(http.StatusCreated, newUser)
}

func GetCandidates(c *gin.Context) {
	var candidates []models.Candidate
	db.DB.Find(&candidates)
	c.JSON(http.StatusOK, candidates)
}

func CreateCandidate(c *gin.Context) {
	name := c.PostForm("name")
	// Desc removed
	visi := c.PostForm("visi")
	misi := c.PostForm("misi")

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image is required"})
		return
	}

	imagePath := fmt.Sprintf("uploads/candidate_%d%s", time.Now().Unix(), filepath.Ext(file.Filename))
	if err := c.SaveUploadedFile(file, imagePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	candidate := models.Candidate{
		Name:     name,
		Visi:     visi,
		Misi:     misi,
		ImageURL: "/" + imagePath, // Store relative URL
	}

	if err := db.DB.Create(&candidate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create candidate"})
		return
	}

	c.JSON(http.StatusCreated, candidate)
}

func DeleteCandidate(c *gin.Context) {
	id := c.Param("id")
	if err := db.DB.Delete(&models.Candidate{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete candidate"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Candidate deleted"})
}

func UploadVerification(c *gin.Context) {
	nim := c.PostForm("nim")
	if nim == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "NIM is required"})
		return
	}

	profileFile, err1 := c.FormFile("profile_image")
	ktmFile, err2 := c.FormFile("ktm_image")

	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Both profile and KTM images are required"})
		return
	}

	// Create uploads directory if not exists (handled by SaveUploadedFile usually or manual check, assuming folder exists or created in main)

	profilePath := fmt.Sprintf("uploads/%s_profile%s", nim, filepath.Ext(profileFile.Filename))
	ktmPath := fmt.Sprintf("uploads/%s_ktm%s", nim, filepath.Ext(ktmFile.Filename))

	if err := c.SaveUploadedFile(profileFile, profilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save profile image"})
		return
	}
	if err := c.SaveUploadedFile(ktmFile, ktmPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save KTM image"})
		return
	}

	var user models.User
	if err := db.DB.Where("nim = ?", nim).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.ProfileImage = profilePath
	user.KTMImage = ktmPath
	// Don't reset verification status - keep existing status
	db.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "Verification uploaded successfully", "user": user})
}

func GetPendingUsers(c *gin.Context) {
	var users []models.User
	db.DB.Where("verification_status = ?", "pending").Find(&users)
	c.JSON(http.StatusOK, users)
}

func SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	var users []models.User
	// Search by NIM or Name (case-insensitive), exclude admin role and users without names
	searchPattern := "%" + query + "%"
	db.DB.Where("(nim ILIKE ? OR name ILIKE ?) AND role != ? AND name != ''", searchPattern, searchPattern, "admin").Find(&users)
	c.JSON(http.StatusOK, users)
}

func VerifyUser(c *gin.Context) {
	var req struct {
		UserID uint   `json:"userId"`
		Action string `json:"action"` // 'approve' or 'reject'
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

	if req.Action == "approve" {
		user.VerificationStatus = "approved"
		// Generate Token
		user.Token = uuid.New().String()
		// Simulated Email Sending
		fmt.Printf("Sending Email to %s... Your Token is: %s\n", user.Email, user.Token)
	} else if req.Action == "reject" {
		user.VerificationStatus = "rejected"
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}

	db.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "User verification status updated", "user": user})
}

func Vote(c *gin.Context) {
	userIDStr := c.PostForm("userId")
	candidateIDStr := c.PostForm("candidateId")

	if userIDStr == "" || candidateIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Pengguna dan ID Kandidat wajib diisi"})
		return
	}

	var user models.User
	if err := db.DB.First(&user, userIDStr).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	if user.HasVoted {
		c.JSON(http.StatusConflict, gin.H{"error": "Pengguna sudah memilih"})
		return
	}

	// Atomic transaction
	tx := db.DB.Begin()

	if err := tx.Model(&user).Update("has_voted", true).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status pengguna"})
		return
	}

	vote := models.Vote{
		UserID:      user.ID,
		CandidateID: 0,
		Timestamp:   time.Now(),
		KTMImage:    user.KTMImage,     // Use User's existing images
		SelfImage:   user.ProfileImage, // Use User's existing images
		IsApproved:  false,
	}

	// Handle Kotak Kosong (ID=0)
	if candidateIDStr == "0" {
		vote.CandidateID = 0
	} else {
		var cand models.Candidate
		if err := db.DB.Where("id = ?", candidateIDStr).First(&cand).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kandidat tidak valid"})
			return
		}
		vote.CandidateID = cand.ID
	}

	if err := tx.Create(&vote).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memberikan suara"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Suara berhasil diberikan"})
}

func GetPendingVotes(c *gin.Context) {
	// Custom struct to return user info along with vote
	type PendingVote struct {
		ID            uint   `json:"id"`
		UserName      string `json:"userName"`
		UserNIM       string `json:"userNim"`
		UserEmail     string `json:"userEmail"`
		KTMImage      string `json:"ktmImage"`
		SelfImage     string `json:"selfImage"`
		CandidateName string `json:"candidateName"`
	}
	var votes []PendingVote

	db.DB.Table("votes").
		Select("votes.id, users.name as user_name, users.nim as user_nim, users.email as user_email, votes.ktm_image, votes.self_image, candidates.name as candidate_name").
		Joins("left join users on users.id = votes.user_id").
		Joins("left join candidates on candidates.id = votes.candidate_id").
		Where("votes.is_approved = ?", false).
		Scan(&votes)

	c.JSON(http.StatusOK, votes)
}

func SearchVotes(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	type VoteResult struct {
		ID            uint   `json:"id"`
		UserID        uint   `json:"userId"`
		UserName      string `json:"userName"`
		UserNIM       string `json:"userNim"`
		UserEmail     string `json:"userEmail"`
		KTMImage      string `json:"ktmImage"`
		SelfImage     string `json:"selfImage"`
		CandidateName string `json:"candidateName"`
		IsApproved    bool   `json:"isApproved"`
	}
	var votes []VoteResult

	searchPattern := "%" + query + "%"
	db.DB.Table("votes").
		Select("votes.id, votes.user_id, users.name as user_name, users.nim as user_nim, users.email as user_email, votes.ktm_image, votes.self_image, candidates.name as candidate_name, votes.is_approved").
		Joins("left join users on users.id = votes.user_id").
		Joins("left join candidates on candidates.id = votes.candidate_id").
		Where("users.nim ILIKE ? OR users.name ILIKE ?", searchPattern, searchPattern).
		Scan(&votes)

	c.JSON(http.StatusOK, votes)
}

func ApproveVote(c *gin.Context) {
	var req struct {
		VoteID uint   `json:"voteId"`
		Action string `json:"action"` // 'approve' or 'reject'
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var vote models.Vote
	if err := db.DB.First(&vote, req.VoteID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Vote not found"})
		return
	}

	if req.Action == "approve" {
		vote.IsApproved = true
		db.DB.Save(&vote)
	} else if req.Action == "reject" {
		// If rejected, allow user to vote again? Requirement vague.
		// "For each votes, ... admin ... can approve".
		// If rejected, probably should reset has_voted?
		// Let's assume rejection means invalid vote. Reset user's hasVoted.
		vote.IsApproved = false // keep false
		// But maybe delete the vote? Or keep as Rejected history?
		// Simplest: Delete vote, reset user.
		db.DB.Model(&models.User{}).Where("id = ?", vote.UserID).Update("has_voted", false)
		db.DB.Delete(&vote)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote processed"})
}

func GetResults(c *gin.Context) {
	type Result struct {
		CandidateID uint   `json:"candidateId"`
		Name        string `json:"name"`
		ImageURL    string `json:"imageUrl"`
		Count       int64  `json:"count"`
	}
	var results []Result

	// Get candidate votes
	err := db.DB.Table("candidates").
		Select("candidates.id as candidate_id, candidates.name, candidates.image_url, COALESCE(count(votes.id), 0) as count").
		Joins("left join votes on votes.candidate_id = candidates.id AND votes.is_approved = ?", true).
		Joins("left join users on users.id = votes.user_id AND users.verification_status = ?", "approved").
		Group("candidates.id, candidates.name, candidates.image_url").
		Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil hasil"})
		return
	}

	// Get Kotak Kosong votes (candidate_id = 0)
	var kotakKosongCount int64
	db.DB.Table("votes").
		Joins("left join users on users.id = votes.user_id").
		Where("votes.candidate_id = ? AND votes.is_approved = ? AND users.verification_status = ?", 0, true, "approved").
		Count(&kotakKosongCount)

	// Add Kotak Kosong to results
	if kotakKosongCount > 0 || len(results) > 0 {
		kotakKosong := Result{
			CandidateID: 0,
			Name:        "Kotak Kosong",
			ImageURL:    "/kotakkosong.png",
			Count:       kotakKosongCount,
		}
		results = append(results, kotakKosong)
	}

	c.JSON(http.StatusOK, results)
}
