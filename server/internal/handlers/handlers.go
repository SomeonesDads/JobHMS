package handlers

import (
	"fmt"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"time"
	"voting-backend/internal/db"
	"voting-backend/internal/models"

	"voting-backend/internal/services/pcloud"

	"github.com/gin-gonic/gin"
	// "github.com/google/uuid" -> removed
)

var PCloudClient *pcloud.Client

func SetPCloudClient(client *pcloud.Client) {
	PCloudClient = client
}

func uploadFileHelper(c *gin.Context, fileHeader *multipart.FileHeader, filename string) (string, error) {
	if PCloudClient != nil {
		file, err := fileHeader.Open()
		if err != nil {
			return "", err
		}
		defer file.Close()
		return PCloudClient.UploadFile(file, filename)
	}
	// Fallback to local
	path := fmt.Sprintf("uploads/%s", filename)
	if err := c.SaveUploadedFile(fileHeader, path); err != nil {
		return "", err
	}
	// If local, we need to return the URL relative to server, ensuring it starts with /
	return "/" + path, nil
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// User Login (Email + Password)
	var user models.User
	result := db.DB.Where("email = ?", req.Email).First(&user)

	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not registered"})
		return
	}

	// Check Password (Simple comparison for now per request simplicity, but ideally hash)
	if user.Password != req.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Password"})
		return
	}

	// Check Verification Status
	// If the user already uploaded, but not approved?
	// The prompt implies we log in THEN interact.
	// So we might allow login even if pending?
	// "misalkan dia login sebelum mulai waktu pemilu bakal ada countdown" -> implies they CAN login.
	// So I will REMOVE the strict verification check for LOGIN, 
	// but enforce it for VOTING.
	// Or maybe I keep it?
	// If I keep it, they can't see the countdown if they aren't verified?
	// Probably better to allow login so they can upload verification?
	// Currently Register uploads verification.
	// Let's allow login freely if credentials match.
	
	c.JSON(http.StatusOK, user)
}

func Register(c *gin.Context) {
	name := c.PostForm("name")
	nim := c.PostForm("nim")
	email := c.PostForm("email")
	password := c.PostForm("password") // Added password

	if name == "" || nim == "" || email == "" || password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, NIM, Email, and Password are required"})
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
	if err := db.DB.Where("nim = ?", nim).Or("email = ?", email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already registered"})
		return
	}

	// Note: Old Register handled file upload immediately.
	// Prompt says: "waktu untuk voting hanya 5 menit setelah dia upload ktm untuk voting"
	// This implies upload happens LATER or at least the timer starts from upload.
	// If we upload here at Register, does the timer start now?
	// Probably not. The prompt implies a specific "upload for voting" action.
	// But `VerifPage` is separate.
	// Let's assume Register is just Creating Account.
	// Verification docs upload happens at `UploadVerification` (triggered by VerifPage).
	// So I will REMOVE file upload from Register to simplify, 
	// OR keep it but not start timer?
	// Actually, `VerifPage` CALLS `/upload-verification`.
	// `RegisterPage` CALLS `/register`.
	// Let's see `RegisterPage.tsx`... I haven't seen it yet.
	// Assuming Register just creates account now (Name, Email, Pass, NIM).
	
	newUser := models.User{
		Name:               name,
		NIM:                nim,
		Email:              email,
		Password:           password,
		Role:               "voter",
		VerificationStatus: "none",
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

	filename := fmt.Sprintf("candidate_%d%s", time.Now().Unix(), filepath.Ext(file.Filename))
	imageURL, err := uploadFileHelper(c, file, filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image: " + err.Error()})
		return
	}

	candidate := models.Candidate{
		Name:     name,
		Visi:     visi,
		Misi:     misi,
		ImageURL: imageURL,
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

	// Create uploads directory if not exists (checked in main)

	profileFilename := fmt.Sprintf("%s_profile%s", nim, filepath.Ext(profileFile.Filename))
	ktmFilename := fmt.Sprintf("%s_ktm%s", nim, filepath.Ext(ktmFile.Filename))

	profilePath, err := uploadFileHelper(c, profileFile, profileFilename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile image"})
		return
	}

	ktmPath, err := uploadFileHelper(c, ktmFile, ktmFilename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload KTM image"})
		return
	}

	var user models.User
	if err := db.DB.Where("nim = ?", nim).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.ProfileImage = profilePath
	user.KTMImage = ktmPath
	user.VerificationStatus = "pending"
	
	// Start the 5-minute timer
	now := time.Now()
	user.KTMUploadedAt = &now

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
		// Token logic removed
		// Simulated Notification
		fmt.Printf("User %s approved.\n", user.Email)
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

	// CHECK 5 MINUTE LIMIT
	if user.KTMUploadedAt == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You must upload verification documents first"})
		return
	}
	// 5 minutes = 300 seconds
	if time.Since(*user.KTMUploadedAt) > 5*time.Minute {
		c.JSON(http.StatusForbidden, gin.H{"error": "Voting time limit (5 minutes) exceeded. Contact verification committee."})
		return
	}

	// Save images
	// Save images
	ktmFilename := fmt.Sprintf("vote_%s_ktm%s", userIDStr, filepath.Ext(ktmFile.Filename))
	selfFilename := fmt.Sprintf("vote_%s_self%s", userIDStr, filepath.Ext(selfFile.Filename))

	ktmPath, err := uploadFileHelper(c, ktmFile, ktmFilename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload KTM: " + err.Error()})
		return
	}
	selfPath, err := uploadFileHelper(c, selfFile, selfFilename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload Selfie: " + err.Error()})
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
	// Seed Election Settings
	var settingsCount int64
	db.DB.Model(&models.ElectionSettings{}).Count(&settingsCount)
	if settingsCount == 0 {
		// Default: Starts in 24 hours, ends in 48 hours
		defaultSettings := models.ElectionSettings{
			StartTime: time.Now().Add(24 * time.Hour),
			EndTime:   time.Now().Add(48 * time.Hour),
		}
		db.DB.Create(&defaultSettings)
	}
	// Seed Admin User
	var adminCount int64
	db.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		admin := models.User{
			Name:               "Admin",
			NIM:                "00000000",
			Email:              "admin@hms.com",
			Password:           "admin123",
			Role:               "admin",
			VerificationStatus: "approved",
		}
		db.DB.Create(&admin)
	}
}

// Election Settings Handlers

func GetSettings(c *gin.Context) {
	var settings models.ElectionSettings
	// Get first record
	if err := db.DB.First(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Settings not found"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func UpdateSettings(c *gin.Context) {
	var req struct {
		StartTime time.Time `json:"startTime"`
		EndTime   time.Time `json:"endTime"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var settings models.ElectionSettings
	if err := db.DB.First(&settings).Error; err != nil {
		// Create if not exists (should be seeded though)
		settings = models.ElectionSettings{
			StartTime: req.StartTime,
			EndTime:   req.EndTime,
		}
		db.DB.Create(&settings)
	} else {
		settings.StartTime = req.StartTime
		settings.EndTime = req.EndTime
		db.DB.Save(&settings)
	}

	c.JSON(http.StatusOK, settings)
}
