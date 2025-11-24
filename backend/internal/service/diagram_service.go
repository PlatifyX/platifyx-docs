package service

import (
	"encoding/xml"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type DiagramService struct {
	aiService *AIService
	log       *logger.Logger
}

func NewDiagramService(aiService *AIService, log *logger.Logger) *DiagramService {
	return &DiagramService{
		aiService: aiService,
		log:       log,
	}
}

// GenerateDiagram generates a Draw.io diagram from code or description
func (s *DiagramService) GenerateDiagram(organizationUUID string, req domain.GenerateDiagramRequest) (*domain.DiagramResponse, error) {
	s.log.Infow("Generating diagram", "type", req.DiagramType, "source", req.Source, "provider", req.Provider, "organizationUUID", organizationUUID)

	// Build prompt based on diagram type and source
	prompt := s.buildDiagramPrompt(req)

	// Use AI to generate the diagram description
	aiResp, err := s.aiService.GenerateCompletion(organizationUUID, req.Provider, prompt, req.Model)
	if err != nil {
		return nil, fmt.Errorf("failed to generate diagram with AI: %w", err)
	}

	// Convert AI response to Draw.io XML
	drawioXML, err := s.convertToDrawioXML(aiResp.Content, req.DiagramType)
	if err != nil {
		return nil, fmt.Errorf("failed to convert to Draw.io XML: %w", err)
	}

	return &domain.DiagramResponse{
		Type:     req.DiagramType,
		Format:   "drawio",
		Content:  drawioXML,
		Provider: req.Provider,
		Model:    aiResp.Model,
	}, nil
}

func (s *DiagramService) buildDiagramPrompt(req domain.GenerateDiagramRequest) string {
	var prompt strings.Builder

	prompt.WriteString("You are an expert software architect. Generate a detailed ")
	prompt.WriteString(string(req.DiagramType))
	prompt.WriteString(" diagram based on the following information.\n\n")

	switch req.Source {
	case "code":
		prompt.WriteString("Analyze this code and create the diagram:\n\n")
		if req.Language != "" {
			prompt.WriteString("Language: ")
			prompt.WriteString(req.Language)
			prompt.WriteString("\n\n")
		}
		prompt.WriteString("```\n")
		prompt.WriteString(req.Code)
		prompt.WriteString("\n```\n\n")

	case "description":
		prompt.WriteString("Based on this description:\n\n")
		prompt.WriteString(req.Description)
		prompt.WriteString("\n\n")

	case "github", "azuredevops":
		prompt.WriteString("Project: ")
		prompt.WriteString(req.ProjectName)
		prompt.WriteString("\n")
		if req.SourcePath != "" {
			prompt.WriteString("Path: ")
			prompt.WriteString(req.SourcePath)
			prompt.WriteString("\n")
		}
		if req.Code != "" {
			prompt.WriteString("\nCode:\n```\n")
			prompt.WriteString(req.Code)
			prompt.WriteString("\n```\n\n")
		}
	}

	// Add diagram type specific instructions
	prompt.WriteString("\nDiagram Requirements:\n")
	switch req.DiagramType {
	case domain.DiagramTypeArchitecture:
		prompt.WriteString("- Show the main components and their relationships\n")
		prompt.WriteString("- Include data flow between components\n")
		prompt.WriteString("- Show external dependencies\n")
		prompt.WriteString("- Use boxes for components and arrows for relationships\n")

	case domain.DiagramTypeClass:
		prompt.WriteString("- Show classes with their properties and methods\n")
		prompt.WriteString("- Include inheritance relationships\n")
		prompt.WriteString("- Show associations and dependencies\n")
		prompt.WriteString("- Use proper UML notation\n")

	case domain.DiagramTypeSequence:
		prompt.WriteString("- Show the sequence of interactions between objects\n")
		prompt.WriteString("- Include actors/participants\n")
		prompt.WriteString("- Show message flow with arrows\n")
		prompt.WriteString("- Add activation boxes where relevant\n")

	case domain.DiagramTypeFlowchart:
		prompt.WriteString("- Show the flow of the process or algorithm\n")
		prompt.WriteString("- Use standard flowchart symbols (start/end, process, decision, etc.)\n")
		prompt.WriteString("- Include decision points and loops\n")
		prompt.WriteString("- Show clear flow direction\n")

	case domain.DiagramTypeERD:
		prompt.WriteString("- Show entities (tables) and their attributes\n")
		prompt.WriteString("- Include primary keys and foreign keys\n")
		prompt.WriteString("- Show relationships and cardinality\n")
		prompt.WriteString("- Use proper ERD notation\n")

	case domain.DiagramTypeComponent:
		prompt.WriteString("- Show system components and their boundaries\n")
		prompt.WriteString("- Include interfaces and dependencies\n")
		prompt.WriteString("- Show component interactions\n")
		prompt.WriteString("- Group related components\n")
	}

	prompt.WriteString("\nIMPORTANT: Provide your response as a structured list of nodes and connections that can be converted to Draw.io format.\n")
	prompt.WriteString("Format your response as:\n")
	prompt.WriteString("NODES:\n")
	prompt.WriteString("- [ID]: [Label] | [Type: box/circle/diamond/cylinder/actor] | [Description]\n")
	prompt.WriteString("CONNECTIONS:\n")
	prompt.WriteString("- [SourceID] -> [TargetID]: [Label]\n")

	return prompt.String()
}

func (s *DiagramService) convertToDrawioXML(aiResponse string, diagramType domain.DiagramType) (string, error) {
	// Parse AI response to extract nodes and connections
	nodes, connections := s.parseAIResponse(aiResponse)

	// Generate Draw.io XML
	xml := s.generateDrawioXML(nodes, connections, diagramType)

	return xml, nil
}

type DiagramNode struct {
	ID          string
	Label       string
	Type        string
	Description string
}

type DiagramConnection struct {
	Source string
	Target string
	Label  string
}

func (s *DiagramService) parseAIResponse(response string) ([]DiagramNode, []DiagramConnection) {
	nodes := []DiagramNode{}
	connections := []DiagramConnection{}

	lines := strings.Split(response, "\n")
	parsingNodes := false
	parsingConnections := false

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.HasPrefix(line, "NODES:") {
			parsingNodes = true
			parsingConnections = false
			continue
		}

		if strings.HasPrefix(line, "CONNECTIONS:") {
			parsingNodes = false
			parsingConnections = true
			continue
		}

		if parsingNodes && strings.HasPrefix(line, "- [") {
			// Parse node: - [ID]: [Label] | [Type] | [Description]
			node := s.parseNodeLine(line)
			if node != nil {
				nodes = append(nodes, *node)
			}
		}

		if parsingConnections && strings.HasPrefix(line, "- [") {
			// Parse connection: - [SourceID] -> [TargetID]: [Label]
			conn := s.parseConnectionLine(line)
			if conn != nil {
				connections = append(connections, *conn)
			}
		}
	}

	// If parsing failed, create a simple fallback structure
	if len(nodes) == 0 {
		nodes = append(nodes, DiagramNode{
			ID:          "1",
			Label:       "Main Component",
			Type:        "box",
			Description: "Auto-generated from AI response",
		})
	}

	return nodes, connections
}

func (s *DiagramService) parseNodeLine(line string) *DiagramNode {
	// Format: - [ID]: [Label] | [Type] | [Description]
	parts := strings.SplitN(strings.TrimPrefix(line, "- "), "]:", 2)
	if len(parts) < 2 {
		return nil
	}

	id := strings.TrimPrefix(parts[0], "[")
	rest := strings.Split(parts[1], "|")

	label := strings.TrimSpace(rest[0])
	nodeType := "box"
	description := ""

	if len(rest) > 1 {
		typeStr := strings.TrimSpace(rest[1])
		if strings.HasPrefix(typeStr, "Type:") {
			nodeType = strings.TrimSpace(strings.TrimPrefix(typeStr, "Type:"))
		} else {
			nodeType = typeStr
		}
	}

	if len(rest) > 2 {
		description = strings.TrimSpace(rest[2])
	}

	return &DiagramNode{
		ID:          id,
		Label:       label,
		Type:        nodeType,
		Description: description,
	}
}

func (s *DiagramService) parseConnectionLine(line string) *DiagramConnection {
	// Format: - [SourceID] -> [TargetID]: [Label]
	parts := strings.SplitN(strings.TrimPrefix(line, "- "), "->", 2)
	if len(parts) < 2 {
		return nil
	}

	source := strings.Trim(strings.TrimSpace(parts[0]), "[]")

	targetParts := strings.SplitN(parts[1], "]:", 2)
	if len(targetParts) < 1 {
		return nil
	}

	target := strings.TrimPrefix(strings.TrimSpace(targetParts[0]), "[")
	target = strings.TrimSuffix(target, "]")

	label := ""
	if len(targetParts) > 1 {
		label = strings.TrimSpace(targetParts[1])
	}

	return &DiagramConnection{
		Source: source,
		Target: target,
		Label:  label,
	}
}

func (s *DiagramService) generateDrawioXML(nodes []DiagramNode, connections []DiagramConnection, diagramType domain.DiagramType) string {
	type MxCell struct {
		XMLName  xml.Name `xml:"mxCell"`
		ID       string   `xml:"id,attr"`
		Value    string   `xml:"value,attr,omitempty"`
		Style    string   `xml:"style,attr,omitempty"`
		Vertex   string   `xml:"vertex,attr,omitempty"`
		Edge     string   `xml:"edge,attr,omitempty"`
		Parent   string   `xml:"parent,attr"`
		Source   string   `xml:"source,attr,omitempty"`
		Target   string   `xml:"target,attr,omitempty"`
		Geometry *struct {
			XMLName xml.Name `xml:"mxGeometry"`
			X       string   `xml:"x,attr,omitempty"`
			Y       string   `xml:"y,attr,omitempty"`
			Width   string   `xml:"width,attr,omitempty"`
			Height  string   `xml:"height,attr,omitempty"`
			As      string   `xml:"as,attr"`
		} `xml:"mxGeometry,omitempty"`
	}

	type MxGraphModel struct {
		XMLName xml.Name `xml:"mxGraphModel"`
		Dx      string   `xml:"dx,attr"`
		Dy      string   `xml:"dy,attr"`
		Grid    string   `xml:"grid,attr"`
		Root    struct {
			XMLName xml.Name `xml:"root"`
			Cells   []MxCell
		}
	}

	type Diagram struct {
		XMLName xml.Name     `xml:"diagram"`
		Name    string       `xml:"name,attr"`
		ID      string       `xml:"id,attr"`
		Model   MxGraphModel `xml:"mxGraphModel"`
	}

	type MxFile struct {
		XMLName  xml.Name  `xml:"mxfile"`
		Host     string    `xml:"host,attr"`
		Modified string    `xml:"modified,attr"`
		Agent    string    `xml:"agent,attr"`
		Version  string    `xml:"version,attr"`
		Type     string    `xml:"type,attr"`
		Diagrams []Diagram `xml:"diagram"`
	}

	// Create XML structure
	cells := []MxCell{
		{ID: "0"},
		{ID: "1", Parent: "0"},
	}

	// Add nodes
	x, y := 50, 50
	for i, node := range nodes {
		style := s.getNodeStyle(node.Type, diagramType)
		width := "120"
		height := "60"

		if node.Type == "circle" || node.Type == "actor" {
			width = "80"
			height = "80"
		}

		cell := MxCell{
			ID:     fmt.Sprintf("node_%s", node.ID),
			Value:  node.Label,
			Style:  style,
			Vertex: "1",
			Parent: "1",
			Geometry: &struct {
				XMLName xml.Name `xml:"mxGeometry"`
				X       string   `xml:"x,attr,omitempty"`
				Y       string   `xml:"y,attr,omitempty"`
				Width   string   `xml:"width,attr,omitempty"`
				Height  string   `xml:"height,attr,omitempty"`
				As      string   `xml:"as,attr"`
			}{
				X:      fmt.Sprintf("%d", x+(i%4)*200),
				Y:      fmt.Sprintf("%d", y+(i/4)*150),
				Width:  width,
				Height: height,
				As:     "geometry",
			},
		}
		cells = append(cells, cell)
	}

	// Add connections
	for i, conn := range connections {
		style := "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"

		cell := MxCell{
			ID:     fmt.Sprintf("edge_%d", i),
			Value:  conn.Label,
			Style:  style,
			Edge:   "1",
			Parent: "1",
			Source: fmt.Sprintf("node_%s", conn.Source),
			Target: fmt.Sprintf("node_%s", conn.Target),
			Geometry: &struct {
				XMLName xml.Name `xml:"mxGeometry"`
				X       string   `xml:"x,attr,omitempty"`
				Y       string   `xml:"y,attr,omitempty"`
				Width  string   `xml:"width,attr,omitempty"`
				Height  string   `xml:"height,attr,omitempty"`
				As      string   `xml:"as,attr"`
			}{
				As: "geometry",
			},
		}
		cells = append(cells, cell)
	}

	// Build final structure
	mxFile := MxFile{
		Host:     "app.diagrams.net",
		Modified: "2024-01-01T00:00:00.000Z",
		Agent:    "PlatifyX",
		Version:  "22.1.0",
		Type:     "device",
		Diagrams: []Diagram{
			{
				Name: string(diagramType),
				ID:   "diagram_1",
				Model: MxGraphModel{
					Dx:   "1000",
					Dy:   "800",
					Grid: "1",
					Root: struct {
						XMLName xml.Name `xml:"root"`
						Cells   []MxCell
					}{
						Cells: cells,
					},
				},
			},
		},
	}

	// Convert to XML
	output, err := xml.MarshalIndent(mxFile, "", "  ")
	if err != nil {
		s.log.Errorw("Failed to marshal XML", "error", err)
		return ""
	}

	return xml.Header + string(output)
}

func (s *DiagramService) getNodeStyle(nodeType string, diagramType domain.DiagramType) string {
	baseStyle := "rounded=0;whiteSpace=wrap;html=1;"

	switch nodeType {
	case "box":
		return baseStyle
	case "circle":
		return "ellipse;whiteSpace=wrap;html=1;aspect=fixed;"
	case "diamond":
		return "rhombus;whiteSpace=wrap;html=1;"
	case "cylinder":
		return "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;"
	case "actor":
		return "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;"
	case "cloud":
		return "ellipse;shape=cloud;whiteSpace=wrap;html=1;"
	case "database":
		return "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;"
	default:
		return baseStyle
	}
}
