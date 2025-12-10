package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
    if err := godotenv.Load(".env"); err != nil {
        log.Println("Warning: Could not load .env file")
    }

    host := os.Getenv("DB_HOST")
    if host == "" { host = "localhost" }
    user := os.Getenv("DB_USER")
    if user == "" { user = "postgres" }
    password := os.Getenv("DB_PASSWORD")
    if password == "" { password = "password" }
    port := os.Getenv("DB_PORT")
    if port == "" { port = "5432" }
    targetDB := os.Getenv("DB_NAME")
    if targetDB == "" { targetDB = "voting_app" }

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=postgres port=%s sslmode=disable", host, user, password, port)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to postgres database: ", err)
	}

    // Check if DB exists
    var count int64
    db.Raw("SELECT count(*) FROM pg_database WHERE datname = ?", targetDB).Count(&count)
    
    if count == 0 {
        // Create Database
        // Note: GORM doesn't support parameterized CREATE DATABASE, but name from env should be safe-ish for this local script
        res := db.Exec(fmt.Sprintf("CREATE DATABASE %s", targetDB))
        if res.Error != nil {
             log.Fatalf("Failed to create database %s: %v", targetDB, res.Error)
        }
        fmt.Printf("Database %s created successfully!\n", targetDB)
    } else {
        fmt.Printf("Database %s already exists.\n", targetDB)
    }
}
