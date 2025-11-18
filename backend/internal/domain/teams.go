package domain

type TeamsConfig struct {
	WebhookURL string
}

type TeamsMessage struct {
	Type       string              `json:"@type"`
	Context    string              `json:"@context"`
	Summary    string              `json:"summary,omitempty"`
	Title      string              `json:"title,omitempty"`
	Text       string              `json:"text,omitempty"`
	ThemeColor string              `json:"themeColor,omitempty"`
	Sections   []TeamsSection      `json:"sections,omitempty"`
	Actions    []TeamsAction       `json:"potentialAction,omitempty"`
}

type TeamsSection struct {
	ActivityTitle    string       `json:"activityTitle,omitempty"`
	ActivitySubtitle string       `json:"activitySubtitle,omitempty"`
	ActivityImage    string       `json:"activityImage,omitempty"`
	Facts            []TeamsFact  `json:"facts,omitempty"`
	Text             string       `json:"text,omitempty"`
}

type TeamsFact struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type TeamsAction struct {
	Type    string          `json:"@type"`
	Name    string          `json:"name"`
	Targets []TeamsTarget   `json:"targets,omitempty"`
}

type TeamsTarget struct {
	OS  string `json:"os"`
	URI string `json:"uri"`
}
