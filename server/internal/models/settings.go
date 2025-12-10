package models

import "gorm.io/gorm"

type SystemSetting struct {
	ID    uint   `gorm:"primaryKey"`
	Key   string `gorm:"uniqueIndex"`
	Value string
}

// Migrate adds SystemSetting to the database
func MigrateSettings(db *gorm.DB) {
	db.AutoMigrate(&SystemSetting{})
}
