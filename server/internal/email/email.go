package email

import (
	"fmt"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

func getDialer() (*gomail.Dialer, error) {
	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_EMAIL")
	pass := os.Getenv("SMTP_PASSWORD")

    if host == "" || portStr == "" || user == "" || pass == ""{
        return nil, fmt.Errorf("SMTP configuration missing")
    }

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, err
	}

	return gomail.NewDialer(host, port, user, pass), nil
}

func SendWelcomeEmail(toEmail, name string) error {
	d, err := getDialer()
    if err != nil { return err }

	m := gomail.NewMessage()
	m.SetHeader("From", d.Username)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Registration Successful - JobHMS Voting")
	m.SetBody("text/html", fmt.Sprintf(`
        <h3>Welcome, %s!</h3>
        <p>Your registration for the upcoming election was successful.</p>
        <p>Please wait while the admin verifies your credentials (KTM & Profile).</p>
        <p>You will receive another email with your Voting Token once approved.</p>
    `, name))

	return d.DialAndSend(m)
}

func SendReminderEmail(toEmail, name, token string) error {
	d, err := getDialer()
    if err != nil { return err }

	m := gomail.NewMessage()
	m.SetHeader("From", d.Username)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Election Reminder: Your Token Inside")
	m.SetBody("text/html", fmt.Sprintf(`
        <h3>Hello, %s</h3>
        <p>The election is starting soon!</p>
        <p><strong>Your Voting Token is: %s</strong></p>
        <p>Do not share this token. Use it to log in when the election starts.</p>
        <p>See you at the polls!</p>
    `, name, token))

	return d.DialAndSend(m)
}

func SendVoteConfirmation(toEmail, name, candidateName string) error {
	d, err := getDialer()
    if err != nil { return err }

	m := gomail.NewMessage()
	m.SetHeader("From", d.Username)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Vote Confirmed")
	m.SetBody("text/html", fmt.Sprintf(`
        <h3>Thank you, %s</h3>
        <p>Your vote for <strong>%s</strong> has been successfully recorded.</p>
        <p>Each vote counts!</p>
    `, name, candidateName))

	return d.DialAndSend(m)
}
