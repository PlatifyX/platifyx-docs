package domain

type SlackConfig struct {
	WebhookURL string
	BotToken   string
}

type SlackMessage struct {
	Text        string              `json:"text"`
	Attachments []SlackAttachment   `json:"attachments,omitempty"`
	Blocks      []SlackBlock        `json:"blocks,omitempty"`
	Channel     string              `json:"channel,omitempty"`
	Username    string              `json:"username,omitempty"`
	IconEmoji   string              `json:"icon_emoji,omitempty"`
}

type SlackAttachment struct {
	Color      string        `json:"color,omitempty"`
	Title      string        `json:"title,omitempty"`
	TitleLink  string        `json:"title_link,omitempty"`
	Text       string        `json:"text,omitempty"`
	Fields     []SlackField  `json:"fields,omitempty"`
	Footer     string        `json:"footer,omitempty"`
	Timestamp  int64         `json:"ts,omitempty"`
}

type SlackField struct {
	Title string `json:"title"`
	Value string `json:"value"`
	Short bool   `json:"short"`
}

type SlackBlock struct {
	Type string         `json:"type"`
	Text *SlackBlockText `json:"text,omitempty"`
}

type SlackBlockText struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type SlackChannel struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Created int64  `json:"created"`
}

type SlackUser struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	RealName string `json:"real_name"`
	Email    string `json:"email,omitempty"`
}
