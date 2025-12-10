package models

import (
	"time"
)

type User struct {
	ID                 uint   `gorm:"primaryKey"`
	Name               string // Added Name
	NIM                string `gorm:"uniqueIndex"`
	Email              string `gorm:"uniqueIndex"`
	Password           string // Changed from Token
	Role               string `gorm:"default:'voter'"` // 'admin' or 'voter'
	HasVoted           bool   `gorm:"default:false"`
	ProfileImage       string
	KTMImage           string
	VerificationStatus string `gorm:"default:'none'"` // 'none', 'pending', 'approved', 'rejected'
	KTMUploadedAt      *time.Time // Added for 5 min timer
}

type ElectionSettings struct {
	ID        uint `gorm:"primaryKey"`
	StartTime time.Time
	EndTime   time.Time
}

type Candidate struct {
	ID       uint `gorm:"primaryKey"`
	Name     string
	Visi     string
	Misi     string
	ImageURL string
}

type Vote struct {
	ID          uint `gorm:"primaryKey"`
	UserID      uint
	CandidateID uint
	Timestamp   time.Time
	KTMImage    string
	SelfImage   string
	IsApproved  bool `gorm:"default:false"`
}
