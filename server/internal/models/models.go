package models

import (
	"time"
)

type User struct {
	ID                 uint    `gorm:"primaryKey"`
	Name               string  // Added Name
	Username           *string `gorm:"uniqueIndex"` // Added for Admin, nullable
	Password           *string // Added for Admin, nullable
	NIM                string  `gorm:"uniqueIndex"`
	Email              string  `gorm:"uniqueIndex"`
	Role               string  `gorm:"default:'voter'"` // 'admin' or 'voter'
	HasVoted           bool    `gorm:"default:false"`
	ReminderSent       bool    `gorm:"default:false"`
	ProfileImage       string
	KTMImage           string
	VerificationStatus string `gorm:"default:'none'"` // 'none', 'pending', 'approved', 'rejected'
	Token              string // Added Token
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
	Status      string `gorm:"default:'pending'"` // 'pending', 'approved', 'rejected'
}

type Setting struct {
	ID    uint   `gorm:"primaryKey"`
	Key   string `gorm:"uniqueIndex"`
	Value string
}
