package domain

type DiagramType string

const (
	DiagramTypeArchitecture DiagramType = "architecture"
	DiagramTypeClass        DiagramType = "class"
	DiagramTypeSequence     DiagramType = "sequence"
	DiagramTypeFlowchart    DiagramType = "flowchart"
	DiagramTypeERD          DiagramType = "erd"
	DiagramTypeComponent    DiagramType = "component"
)

type GenerateDiagramRequest struct {
	Provider    AIProvider  `json:"provider"`
	DiagramType DiagramType `json:"diagramType"`
	Source      string      `json:"source"` // "code", "github", "azuredevops", "description"
	SourcePath  string      `json:"sourcePath,omitempty"`
	RepoURL     string      `json:"repoUrl,omitempty"`
	ProjectName string      `json:"projectName,omitempty"`
	Code        string      `json:"code,omitempty"`
	Description string      `json:"description,omitempty"`
	Language    string      `json:"language,omitempty"`
	Model       string      `json:"model,omitempty"`
}

type DiagramResponse struct {
	Type     DiagramType `json:"type"`
	Format   string      `json:"format"` // "drawio"
	Content  string      `json:"content"` // XML content for Draw.io
	Provider AIProvider  `json:"provider"`
	Model    string      `json:"model"`
}

// DrawioElement represents a generic element in Draw.io XML
type DrawioElement struct {
	ID       string                 `json:"id"`
	Value    string                 `json:"value"`
	Style    string                 `json:"style"`
	Vertex   bool                   `json:"vertex"`
	Edge     bool                   `json:"edge"`
	Parent   string                 `json:"parent"`
	Source   string                 `json:"source,omitempty"`
	Target   string                 `json:"target,omitempty"`
	Geometry *DrawioGeometry        `json:"geometry,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

type DrawioGeometry struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
	As     string  `json:"as"`
}
