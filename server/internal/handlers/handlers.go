package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"
	"voting-backend/internal/db"
	"voting-backend/internal/email"
	"voting-backend/internal/imgbb"
	"voting-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var wibLocation = time.FixedZone("WIB", 7*3600)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Token    string `json:"token"`
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

	// Check Password
	if user.Password == nil {
		// Fallback for old users without password if necessary, or just fail
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check Verification Status
	// Admins are auto-approved. Voters need approval.
	if user.VerificationStatus != "approved" {
		c.JSON(http.StatusForbidden, gin.H{"error": "User not verified yet"})
		return
	}

	// Check Token for Voters
	if user.Role != "admin" {
		if req.Token != user.Token {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or missing voting token"})
			return
		}
	}

	// Check Election Timing
	if user.Role != "admin" {
		// Check Election Timing for Login (Allowed 24h before)
		var startSetting models.Setting
		if err := db.DB.Where("key = ?", "startTime").First(&startSetting).Error; err == nil && startSetting.Value != "" {
			startTime, err := time.ParseInLocation("2006-01-02T15:04", startSetting.Value, wibLocation)
			if err == nil {
				// Allow login 24 hours before election starts for verification
				allowedLoginTime := startTime.Add(-24 * time.Hour)
				if time.Now().In(wibLocation).Before(allowedLoginTime) {
					c.JSON(http.StatusForbidden, gin.H{"error": "Login hanya dibuka 24 jam sebelum pemilihan dimulai."})
					return
				}
			}
		}
		var endSetting models.Setting
		if err := db.DB.Where("key = ?", "endTime").First(&endSetting).Error; err == nil && endSetting.Value != "" {
			endTime, err := time.ParseInLocation("2006-01-02T15:04", endSetting.Value, wibLocation)
			if err == nil {
				if time.Now().In(wibLocation).After(endTime) {
					c.JSON(http.StatusForbidden, gin.H{"error": "Pemilihan sudah berakhir."})
					return
				}
			}
		}
	}

	c.JSON(http.StatusOK, user)
}

func Register(c *gin.Context) {
	name := c.PostForm("name")
	nim := c.PostForm("nim")
	userEmail := c.PostForm("email")
	password := c.PostForm("password")

	if name == "" || nim == "" || userEmail == "" || password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama, NIM, Email, dan Password wajib diisi"})
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
	if err := db.DB.Where("nim = ? OR email = ?", nim, userEmail).First(&existingUser).Error; err == nil {
		if existingUser.NIM == nim {
			c.JSON(http.StatusConflict, gin.H{"error": "NIM sudah terdaftar"})
		} else {
			c.JSON(http.StatusConflict, gin.H{"error": "Email sudah terdaftar"})
		}
		return
	}

	var startSetting models.Setting
	if err := db.DB.Where("key = ?", "startTime").First(&startSetting).Error; err == nil && startSetting.Value != "" {
		startTime, err := time.ParseInLocation("2006-01-02T15:04", startSetting.Value, wibLocation) // Adjust format if strictly sent from datetime-local input
		if err == nil {
			if time.Now().In(wibLocation).After(startTime) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Waktu registrasi sudah berakhir."})
				return
			}
		}
	}

	profileFile, err1 := c.FormFile("profile_image")
	ktmFile, err2 := c.FormFile("ktm_image")

	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Foto profil dan KTM wajib diunggah"})
		return
	}

	profileLink, err := imgbb.UploadImage(profileFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengunggah foto profil ke ImgBB: " + err.Error()})
		return
	}

	ktmLink, err := imgbb.UploadImage(ktmFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengunggah foto KTM ke ImgBB: " + err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
		return
	}
	passStr := string(hashedPassword)

	newUser := models.User{
		Name:               name,
		NIM:                nim,
		Email:              userEmail,
		Password:           &passStr,
		Role:               "voter",
		ProfileImage:       profileLink,
		KTMImage:           ktmLink,
		VerificationStatus: "pending",
	}

	if err := db.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftarkan pengguna"})
		return
	}

	go func() {
		if err := email.SendWelcomeEmail(newUser.Email, newUser.Name); err != nil {
			log.Printf("Failed to send welcome email to %s: %v", newUser.Email, err)
		} else {
			log.Printf("Welcome email sent to %s", newUser.Email)
		}
	}()

	c.JSON(http.StatusCreated, newUser)
}

func GetCandidates(c *gin.Context) {
	candidates := []models.Candidate{}
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

	link, err := imgbb.UploadImage(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload to ImgBB: " + err.Error()})
		return
	}

	candidate := models.Candidate{
		Name:     name,
		Visi:     visi,
		Misi:     misi,
		ImageURL: link,
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

	profileLink, err := imgbb.UploadImage(profileFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile: " + err.Error()})
		return
	}

	ktmLink, err := imgbb.UploadImage(ktmFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload KTM: " + err.Error()})
		return
	}

	var user models.User
	if err := db.DB.Where("nim = ?", nim).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.ProfileImage = profileLink
	user.KTMImage = ktmLink
	// Don't reset verification status - keep existing status
	db.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "Verification uploaded successfully", "user": user})
}

func GetPendingUsers(c *gin.Context) {
	users := []models.User{}
	db.DB.Where("verification_status = ?", "pending").Find(&users)
	c.JSON(http.StatusOK, users)
}

func SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	users := []models.User{}
	// Search by NIM or Name (case-insensitive), exclude admin role and users without names
	searchPattern := "%" + query + "%"
	db.DB.Where("(nim ILIKE ? OR name ILIKE ?) AND role != ? AND name != ''", searchPattern, searchPattern, "admin").Find(&users)
	c.JSON(http.StatusOK, users)
}

func GetAllUsers(c *gin.Context) {
	query := c.Query("q")
	verificationStatus := c.Query("verificationStatus")
	hasVoted := c.Query("hasVoted")

	var users []models.User
	dbQuery := db.DB.Where("role = ?", "voter")

	if query != "" {
		searchPattern := "%" + query + "%"
		dbQuery = dbQuery.Where("(name ILIKE ? OR nim ILIKE ? OR email ILIKE ?)", searchPattern, searchPattern, searchPattern)
	}

	if verificationStatus != "" && verificationStatus != "all" {
		dbQuery = dbQuery.Where("verification_status = ?", verificationStatus)
	}

	if hasVoted != "" && hasVoted != "all" {
		if hasVoted == "yes" {
			dbQuery = dbQuery.Where("has_voted = ?", true)
		} else if hasVoted == "no" {
			dbQuery = dbQuery.Where("(has_voted = ? OR has_voted IS NULL)", false)
		}
	}

	if err := dbQuery.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

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
		// Send Email
		go func() {
			if err := email.SendApprovalEmail(user.Email, user.Name, user.Token); err != nil {
				log.Printf("Failed to send approval email to %s: %v", user.Email, err)
			} else {
				log.Printf("Approval email sent to %s", user.Email)
			}
		}()
		fmt.Printf("Sending Email to %s... Your Token is: %s\n", user.Email, user.Token)

		db.DB.Save(&user)
		c.JSON(http.StatusOK, gin.H{"message": "User approved", "user": user})
	} else if req.Action == "reject" {
		if err := db.DB.Delete(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "User rejected and removed"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}
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

	// Double-check election timing strictly for Voting action
	var startSetting models.Setting
	if err := db.DB.Where("key = ?", "startTime").First(&startSetting).Error; err == nil && startSetting.Value != "" {
		startTime, err := time.ParseInLocation("2006-01-02T15:04", startSetting.Value, wibLocation)
		if err == nil {
			if time.Now().In(wibLocation).Before(startTime) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Pemilihan belum dimulai."})
				return
			}
		}
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
		Status:      "pending",
	}

	// CHECK 5-MINUTE TIME LIMIT
	if user.VoteEntryTime == nil {
		// Strict: If they never entered via EnterVoting, reject or block. 
		// Decision: Reject as "Tidak Sah" because flow was skipped.
		vote.Status = "rejected"
		vote.RejectionReason = "Bypassed Voting Entry (Suspicious)"
	} else {
		// Calculate time difference
		if time.Since(*user.VoteEntryTime) > 5*time.Minute {
			vote.Status = "rejected"
			vote.RejectionReason = "Time Limit Exceeded (> 5 minutes)"
		} else {
			vote.Status = "pending"
		}
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

	// Return appropriate message based on status
	if vote.Status == "rejected" {
		c.JSON(http.StatusOK, gin.H{"message": "Waktu habis (5 menit). Suara Anda dianggap TIDAK SAH."})
		return
	}

	go func() {
		candidateName := "Kotak Kosong"
		if candidateIDStr != "0" {
			var cand models.Candidate
			if err := db.DB.First(&cand, vote.CandidateID).Error; err == nil {
				candidateName = cand.Name
			}
		}
		if err := email.SendVoteConfirmation(user.Email, user.Name, candidateName); err != nil {
			log.Printf("Failed to send vote confirmation to %s: %v", user.Email, err)
		} else {
			log.Printf("Vote confirmation email sent to %s", user.Email)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Suara berhasil diberikan"})
}

func EnterVoting(c *gin.Context) {
	var req struct {
		UserID uint `json:"userId"`
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

	// IF user has not entered yet, set the time.
	// If they refresh, do NOT update the time (keep the first entry time).
	if user.VoteEntryTime == nil {
		now := time.Now()
		user.VoteEntryTime = &now
		db.DB.Save(&user)
	}

	// Return the entry time so frontend can sync if needed (optional)
	c.JSON(http.StatusOK, gin.H{
		"message": "Entry time recorded", 
		"entryTime": user.VoteEntryTime,
	})
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
	votes := []PendingVote{}

	db.DB.Table("votes").
		Select("votes.id as id, users.name as userName, users.nim as userNim, users.email as userEmail, votes.ktm_image as ktm_image, votes.self_image as self_image, COALESCE(candidates.name, 'Kotak Kosong') as candidateName").
		Joins("left join users on users.id = votes.user_id").
		Joins("left join candidates on candidates.id = votes.candidate_id").
		Where("votes.status = ?", "pending").
		Scan(&votes)

	c.JSON(http.StatusOK, votes)
}

func GetRejectedVotes(c *gin.Context) {
	// Reusing PendingVote struct for consistency as it contains necessary user/candidate info
	type PendingVote struct {
		ID            uint   `json:"id"`
		UserName      string `json:"userName"`
		UserNIM       string `json:"userNim"`
		UserEmail     string `json:"userEmail"`
		KTMImage      string `json:"ktmImage"`
		SelfImage     string `json:"selfImage"`
		CandidateName string `json:"candidateName"`
		Status        string `json:"status"`
		RejectionReason string `json:"rejectionReason"`
	}
	votes := []PendingVote{}

	db.DB.Table("votes").
		Select("votes.id as id, users.name as userName, users.nim as userNim, users.email as userEmail, votes.ktm_image as ktm_image, votes.self_image as self_image, COALESCE(candidates.name, 'Kotak Kosong') as candidateName, votes.status as status, votes.rejection_reason").
		Joins("left join users on users.id = votes.user_id").
		Joins("left join candidates on candidates.id = votes.candidate_id").
		Where("votes.status = ?", "rejected").
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
		Status        string `json:"status"`
	}
	votes := []VoteResult{}

	searchPattern := "%" + query + "%"
	db.DB.Table("votes").
		Select("votes.id as id, votes.user_id as userId, users.name as userName, users.nim as userNim, users.email as userEmail, votes.ktm_image as ktm_image, votes.self_image as self_image, COALESCE(candidates.name, 'Kotak Kosong') as candidateName, votes.status as status").
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
		vote.Status = "approved"
		db.DB.Save(&vote)
	} else if req.Action == "reject" {
		// Just mark as rejected. User CANNOT vote again.
		vote.Status = "rejected"
		vote.RejectionReason = "Rejected by Admin" // Default reason for manual rejection
		db.DB.Save(&vote)
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
	results := []Result{}

	// Get candidate votes
	err := db.DB.Table("candidates").
		Select("candidates.id as candidate_id, candidates.name, candidates.image_url, COALESCE(count(votes.id), 0) as count").
		Joins("left join votes on votes.candidate_id = candidates.id AND votes.status = ?", "approved").
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
		Where("votes.candidate_id = ? AND votes.status = ? AND users.verification_status = ?", 0, "approved", "approved").
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

	// Count Rejected Votes (Suara Hangus)
	var rejectedCount int64
	db.DB.Table("votes").
		Where("status = ?", "rejected").
		Count(&rejectedCount)

	if rejectedCount > 0 {
		hangus := Result{
			CandidateID: 999999, // Arbitrary ID for unique key
			Name:        "Suara Hangus",
			ImageURL:    "", // No image or specific image for rejected
			Count:       rejectedCount,
		}
		results = append(results, hangus)
	}

	c.JSON(http.StatusOK, results)
}

func GetSettings(c *gin.Context) {
	var settings []models.Setting
	if err := db.DB.Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}

	settingsMap := make(map[string]string)
	for _, s := range settings {
		settingsMap[s.Key] = s.Value
	}
	c.JSON(http.StatusOK, settingsMap)
}

func SaveSettings(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	for k, v := range req {
		var setting models.Setting
		if err := db.DB.Where("key = ?", k).First(&setting).Error; err != nil {
			// Create
			setting = models.Setting{Key: k, Value: v}
			db.DB.Create(&setting)
		} else {
			// Update
			setting.Value = v
			db.DB.Save(&setting)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings saved"})
}
