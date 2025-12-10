package pcloud

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"strconv"
)

const (
	APIEndpoint = "https://api.pcloud.com"
)

type Client struct {
	AuthToken string
}

type LoginResponse struct {
	Result int    `json:"result"`
	Auth   string `json:"auth"`
	Error  string `json:"error"`
}

type UploadResponse struct {
	Result   int      `json:"result"`
	FileIDs  []uint64 `json:"fileids"`
	Metadata []struct {
		Name   string `json:"name"`
		FileID uint64 `json:"fileid"`
	} `json:"metadata"`
	Error string `json:"error"`
}

type PubLinkResponse struct {
	Result int    `json:"result"`
	Link   string `json:"link"`
	Error  string `json:"error"`
}

func NewClient(username, password string) (*Client, error) {
	// Simple login with username/password to get auth token
	// Note: This might fail if 2FA is enabled or if pCloud requires digest auth.
	// For production, suggest using an OAuth access token directly.
	vals := url.Values{}
	vals.Set("getauth", "1")
	vals.Set("username", username)
	vals.Set("password", password)

	resp, err := http.PostForm(APIEndpoint+"/userinfo", vals)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var res LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	if res.Result != 0 {
		return nil, fmt.Errorf("pcloud login failed: %s (code %d)", res.Error, res.Result)
	}

	return &Client{AuthToken: res.Auth}, nil
}

func (c *Client) UploadFile(file multipart.File, filename string) (string, error) {
	// 1. Upload File
	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)

	go func() {
		defer pw.Close()
		part, err := writer.CreateFormFile("file", filename)
		if err != nil {
			return
		}
		if _, err := io.Copy(part, file); err != nil {
			return
		}
		if err := writer.Close(); err != nil {
			return
		}
	}()

	req, err := http.NewRequest("POST", APIEndpoint+"/uploadfile", pr)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+c.AuthToken)

	// pCloud accepts auth token in query param or sometimes header, but usually query param is safer for their API
	q := req.URL.Query()
	q.Add("auth", c.AuthToken)
	req.URL.RawQuery = q.Encode()

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var uploadRes UploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&uploadRes); err != nil {
		return "", err
	}

	if uploadRes.Result != 0 {
		return "", fmt.Errorf("pcloud upload failed: %s", uploadRes.Error)
	}

	if len(uploadRes.FileIDs) == 0 {
		return "", fmt.Errorf("no file uploaded")
	}

	fileID := uploadRes.FileIDs[0]

	// 2. Get Public Link
	return c.GetPublicLink(fileID)
}

func (c *Client) GetPublicLink(fileID uint64) (string, error) {
	vals := url.Values{}
	vals.Set("auth", c.AuthToken)
	vals.Set("fileid", strconv.FormatUint(fileID, 10))

	resp, err := http.PostForm(APIEndpoint+"/getfilepublink", vals)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var linkRes PubLinkResponse
	if err := json.NewDecoder(resp.Body).Decode(&linkRes); err != nil {
		return "", err
	}

	if linkRes.Result != 0 {
		return "", fmt.Errorf("pcloud get link failed: %s", linkRes.Error)
	}

	return linkRes.Link, nil
}
