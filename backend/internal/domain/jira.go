package domain

import "time"

type JiraConfig struct {
	URL      string
	Email    string
	APIToken string
}

type JiraProject struct {
	ID          string `json:"id"`
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Lead        struct {
		DisplayName string `json:"displayName"`
		EmailAddress string `json:"emailAddress"`
	} `json:"lead"`
	ProjectTypeKey string `json:"projectTypeKey"`
}

type JiraIssue struct {
	ID     string `json:"id"`
	Key    string `json:"key"`
	Self   string `json:"self"`
	Fields struct {
		Summary     string `json:"summary"`
		Description string `json:"description"`
		IssueType   struct {
			Name    string `json:"name"`
			IconURL string `json:"iconUrl"`
		} `json:"issuetype"`
		Status struct {
			Name           string `json:"name"`
			StatusCategory struct {
				Name      string `json:"name"`
				ColorName string `json:"colorName"`
			} `json:"statusCategory"`
		} `json:"status"`
		Priority struct {
			Name    string `json:"name"`
			IconURL string `json:"iconUrl"`
		} `json:"priority"`
		Assignee *struct {
			DisplayName  string `json:"displayName"`
			EmailAddress string `json:"emailAddress"`
			AvatarUrls   map[string]string `json:"avatarUrls"`
		} `json:"assignee"`
		Reporter struct {
			DisplayName  string `json:"displayName"`
			EmailAddress string `json:"emailAddress"`
		} `json:"reporter"`
		Created time.Time `json:"created"`
		Updated time.Time `json:"updated"`
		Project struct {
			Key  string `json:"key"`
			Name string `json:"name"`
		} `json:"project"`
	} `json:"fields"`
}

type JiraUser struct {
	AccountID    string `json:"accountId"`
	DisplayName  string `json:"displayName"`
	EmailAddress string `json:"emailAddress"`
	Active       bool   `json:"active"`
	AvatarUrls   map[string]string `json:"avatarUrls"`
}

type JiraSprint struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	State         string    `json:"state"`
	StartDate     time.Time `json:"startDate"`
	EndDate       time.Time `json:"endDate"`
	OriginBoardID int       `json:"originBoardId"`
	Goal          string    `json:"goal"`
}

type JiraBoard struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	Self     string `json:"self"`
	Location struct {
		ProjectKey string `json:"projectKey"`
		Name       string `json:"name"`
	} `json:"location"`
}

type JiraStats struct {
	TotalProjects int `json:"totalProjects"`
	TotalIssues   int `json:"totalIssues"`
	OpenIssues    int `json:"openIssues"`
	InProgress    int `json:"inProgress"`
	Done          int `json:"done"`
}
