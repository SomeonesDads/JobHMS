package imgbb

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

const (
	API_URL = "https://api.imgbb.com/1/upload"
)

type ImgBBResponse struct {
	Data    ImgBBData `json:"data"`
	Success bool      `json:"success"`
	Status  int       `json:"status"`
	Error   ImgBBError `json:"error"`
}

type ImgBBError struct {
	Message string `json:"message"`
	Code    int    `json:"code"`
	ErrorSubcode string `json:"error_subcode"`
}

type ImgBBData struct {
	URL string `json:"url"` // Direct link
}

func GetAPIKey() string {
	if key := os.Getenv("IMGBB_API_KEY"); key != "" {
		return key
	}
	// Fallback to the old key if not set (temporary)
	return "d7e3e0a086d605ff8c68a0555dbe4927"
}

func UploadImage(fileHeader *multipart.FileHeader) (string, error) {
	apiKey := GetAPIKey()
	if apiKey == "" {
		return "", fmt.Errorf("IMGBB_API_KEY not set")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// key param
	writer.WriteField("key", apiKey)

	part, err := writer.CreateFormFile("image", fileHeader.Filename)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}
	io.Copy(part, file)
	writer.Close()

	resp, err := http.Post(API_URL, writer.FormDataContentType(), body)
	if err != nil {
		return "", fmt.Errorf("http post failed: %w", err)
	}
	defer resp.Body.Close()

	var imgbbResp ImgBBResponse
	// Decode might fail if response is not JSON
	if err := json.NewDecoder(resp.Body).Decode(&imgbbResp); err != nil {
		// Try to read body for debugging
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if !imgbbResp.Success {
		if imgbbResp.Error.Message != "" {
			return "", fmt.Errorf("imgbb api error: %s (code: %d)", imgbbResp.Error.Message, imgbbResp.Status)
		}
		return "", fmt.Errorf("imgbb upload failed with unknown error, status: %d", imgbbResp.Status)
	}

	return imgbbResp.Data.URL, nil
}
