package models

import (
	"time"
)

type User struct {
	ID       uint   `gorm:"primaryKey"`
	NIM      string `gorm:"uniqueIndex"`
	Email    string `gorm:"uniqueIndex"`
	Role     string `gorm:"default:'voter'"` // 'admin' or 'voter'
	HasVoted bool   `gorm:"default:false"`
}

type Candidate struct {
	ID          uint `gorm:"primaryKey"`
	Name        string
	Description string
	ImageURL    string
}

type Vote struct {
	ID          uint `gorm:"primaryKey"`
	UserID      uint
	CandidateID uint
	Timestamp   time.Time
}
