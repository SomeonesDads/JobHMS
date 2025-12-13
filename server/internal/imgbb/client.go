package imgbb

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
)

const (
	API_URL = "https://api.imgbb.com/1/upload"
)

type ImgBBResponse struct {
	Data    ImgBBData `json:"data"`
	Success bool      `json:"success"`
	Status  int       `json:"status"`
}

type ImgBBData struct {
	URL string `json:"url"` // Direct link
}

func GetAPIKey() string {
	return "d7e3e0a086d605ff8c68a0555dbe4927"
}

func UploadImage(fileHeader *multipart.FileHeader) (string, error) {
	apiKey := GetAPIKey()
	if apiKey == "" {
		return "", fmt.Errorf("IMGBB_API_KEY not set")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// key param
	writer.WriteField("key", apiKey)

	part, err := writer.CreateFormFile("image", fileHeader.Filename)
	if err != nil {
		return "", err
	}
	io.Copy(part, file)
	writer.Close()

	resp, err := http.Post(API_URL, writer.FormDataContentType(), body)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var imgbbResp ImgBBResponse
	if err := json.NewDecoder(resp.Body).Decode(&imgbbResp); err != nil {
		return "", err
	}

	if !imgbbResp.Success {
		return "", fmt.Errorf("imgbb upload failed")
	}

	return imgbbResp.Data.URL, nil
}
