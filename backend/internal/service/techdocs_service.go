package service

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type TechDocsService struct {
	docsPath      string
	aiService     *AIService
	diagramService *DiagramService
	log           *logger.Logger
}

func NewTechDocsService(docsPath string, aiService *AIService, diagramService *DiagramService, log *logger.Logger) *TechDocsService {
	return &TechDocsService{
		docsPath:       docsPath,
		aiService:      aiService,
		diagramService: diagramService,
		log:            log,
	}
}

// GetDocumentTree returns the full document tree structure
func (s *TechDocsService) GetDocumentTree() ([]domain.TechDocTreeNode, error) {
	s.log.Info("Fetching document tree")

	var nodes []domain.TechDocTreeNode

	entries, err := os.ReadDir(s.docsPath)
	if err != nil {
		s.log.Errorw("Failed to read docs directory", "error", err)
		return nil, fmt.Errorf("failed to read docs directory: %w", err)
	}

	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		node, err := s.buildTreeNode(entry.Name(), "")
		if err != nil {
			s.log.Errorw("Failed to build tree node", "error", err, "name", entry.Name())
			continue
		}
		nodes = append(nodes, *node)
	}

	s.log.Infow("Fetched document tree successfully", "count", len(nodes))
	return nodes, nil
}

func (s *TechDocsService) buildTreeNode(name, relativePath string) (*domain.TechDocTreeNode, error) {
	fullPath := filepath.Join(s.docsPath, relativePath, name)
	info, err := os.Stat(fullPath)
	if err != nil {
		return nil, err
	}

	node := &domain.TechDocTreeNode{
		Path:        filepath.Join(relativePath, name),
		Name:        name,
		IsDirectory: info.IsDir(),
	}

	if info.IsDir() {
		entries, err := os.ReadDir(fullPath)
		if err != nil {
			return nil, err
		}

		for _, entry := range entries {
			if strings.HasPrefix(entry.Name(), ".") {
				continue
			}

			childNode, err := s.buildTreeNode(entry.Name(), filepath.Join(relativePath, name))
			if err != nil {
				s.log.Errorw("Failed to build child node", "error", err, "name", entry.Name())
				continue
			}
			node.Children = append(node.Children, *childNode)
		}

		// Sort children: directories first, then files, both alphabetically
		sort.Slice(node.Children, func(i, j int) bool {
			if node.Children[i].IsDirectory != node.Children[j].IsDirectory {
				return node.Children[i].IsDirectory
			}
			return node.Children[i].Name < node.Children[j].Name
		})
	}

	return node, nil
}

// GetDocument retrieves a document by path
func (s *TechDocsService) GetDocument(docPath string) (*domain.TechDoc, error) {
	s.log.Infow("Fetching document", "path", docPath)

	// Sanitize path to prevent directory traversal
	cleanPath := filepath.Clean(docPath)
	if strings.Contains(cleanPath, "..") {
		return nil, fmt.Errorf("invalid path")
	}

	fullPath := filepath.Join(s.docsPath, cleanPath)

	info, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("document not found")
		}
		return nil, fmt.Errorf("failed to stat document: %w", err)
	}

	doc := &domain.TechDoc{
		Path:         cleanPath,
		Name:         filepath.Base(cleanPath),
		IsDirectory:  info.IsDir(),
		Size:         info.Size(),
		ModifiedTime: info.ModTime(),
	}

	if !info.IsDir() {
		content, err := os.ReadFile(fullPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read document: %w", err)
		}
		doc.Content = string(content)
	}

	s.log.Infow("Fetched document successfully", "path", docPath)
	return doc, nil
}

// SaveDocument saves or updates a document
func (s *TechDocsService) SaveDocument(docPath, content string) error {
	s.log.Infow("Saving document", "path", docPath)

	// Sanitize path
	cleanPath := filepath.Clean(docPath)
	if strings.Contains(cleanPath, "..") {
		return fmt.Errorf("invalid path")
	}

	fullPath := filepath.Join(s.docsPath, cleanPath)

	// Ensure parent directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Write file
	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write document: %w", err)
	}

	s.log.Infow("Saved document successfully", "path", docPath)
	return nil
}

// DeleteDocument deletes a document
func (s *TechDocsService) DeleteDocument(docPath string) error {
	s.log.Infow("Deleting document", "path", docPath)

	// Sanitize path
	cleanPath := filepath.Clean(docPath)
	if strings.Contains(cleanPath, "..") {
		return fmt.Errorf("invalid path")
	}

	fullPath := filepath.Join(s.docsPath, cleanPath)

	if err := os.Remove(fullPath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("document not found")
		}
		return fmt.Errorf("failed to delete document: %w", err)
	}

	s.log.Infow("Deleted document successfully", "path", docPath)
	return nil
}

// CreateFolder creates a new folder
func (s *TechDocsService) CreateFolder(folderPath string) error {
	s.log.Infow("Creating folder", "path", folderPath)

	// Sanitize path
	cleanPath := filepath.Clean(folderPath)
	if strings.Contains(cleanPath, "..") {
		return fmt.Errorf("invalid path")
	}

	fullPath := filepath.Join(s.docsPath, cleanPath)

	if err := os.MkdirAll(fullPath, 0755); err != nil {
		return fmt.Errorf("failed to create folder: %w", err)
	}

	s.log.Infow("Created folder successfully", "path", folderPath)
	return nil
}

// ListDocuments lists all markdown documents in a directory
func (s *TechDocsService) ListDocuments(dirPath string) ([]domain.TechDoc, error) {
	s.log.Infow("Listing documents", "path", dirPath)

	cleanPath := filepath.Clean(dirPath)
	if cleanPath == "." {
		cleanPath = ""
	}
	if strings.Contains(cleanPath, "..") {
		return nil, fmt.Errorf("invalid path")
	}

	fullPath := filepath.Join(s.docsPath, cleanPath)

	var docs []domain.TechDoc

	err := filepath.WalkDir(fullPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip hidden files/directories
		if strings.HasPrefix(d.Name(), ".") {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		// Only include markdown files and directories
		if !d.IsDir() && !strings.HasSuffix(d.Name(), ".md") {
			return nil
		}

		info, err := d.Info()
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(s.docsPath, path)
		if err != nil {
			return err
		}

		doc := domain.TechDoc{
			Path:         relPath,
			Name:         d.Name(),
			IsDirectory:  d.IsDir(),
			Size:         info.Size(),
			ModifiedTime: info.ModTime(),
		}

		docs = append(docs, doc)
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to list documents: %w", err)
	}

	s.log.Infow("Listed documents successfully", "count", len(docs))
	return docs, nil
}

// GenerateDocumentation generates documentation using AI
func (s *TechDocsService) GenerateDocumentation(req domain.AIGenerateDocRequest) (*domain.AIResponse, error) {
	s.log.Infow("Generating documentation with AI", "provider", req.Provider, "source", req.Source, "docType", req.DocType)

	if s.aiService == nil {
		return nil, fmt.Errorf("AI service not available")
	}

	prompt := s.buildGenerateDocPrompt(req)

	response, err := s.aiService.GenerateCompletion(req.Provider, prompt, req.Model)
	if err != nil {
		s.log.Errorw("Failed to generate documentation", "error", err)
		return nil, fmt.Errorf("failed to generate documentation: %w", err)
	}

	s.log.Infow("Documentation generated successfully", "provider", req.Provider, "length", len(response.Content))
	return response, nil
}

func (s *TechDocsService) buildGenerateDocPrompt(req domain.AIGenerateDocRequest) string {
	var prompt strings.Builder

	prompt.WriteString("You are an expert technical writer. Generate comprehensive ")
	prompt.WriteString(req.DocType)
	prompt.WriteString(" documentation based on the following information.\n\n")

	switch req.Source {
	case "code":
		prompt.WriteString("Analyze this code and create detailed documentation:\n\n")
		if req.Language != "" {
			prompt.WriteString("Programming Language: ")
			prompt.WriteString(req.Language)
			prompt.WriteString("\n\n")
		}
		prompt.WriteString("```\n")
		prompt.WriteString(req.Code)
		prompt.WriteString("\n```\n\n")

	case "github":
		prompt.WriteString("Create documentation for this GitHub repository:\n")
		prompt.WriteString("Repository: ")
		prompt.WriteString(req.RepoURL)
		prompt.WriteString("\n")
		if req.SourcePath != "" {
			prompt.WriteString("Specific path: ")
			prompt.WriteString(req.SourcePath)
			prompt.WriteString("\n")
		}
		if req.Code != "" {
			prompt.WriteString("\nCode sample:\n```\n")
			prompt.WriteString(req.Code)
			prompt.WriteString("\n```\n")
		}
		prompt.WriteString("\n")

	case "azuredevops":
		prompt.WriteString("Create documentation for this Azure DevOps project:\n")
		prompt.WriteString("Project: ")
		prompt.WriteString(req.ProjectName)
		prompt.WriteString("\n")
		if req.SourcePath != "" {
			prompt.WriteString("Path: ")
			prompt.WriteString(req.SourcePath)
			prompt.WriteString("\n")
		}
		if req.Code != "" {
			prompt.WriteString("\nCode sample:\n```\n")
			prompt.WriteString(req.Code)
			prompt.WriteString("\n```\n")
		}
		prompt.WriteString("\n")
	}

	// Add doc type specific instructions
	prompt.WriteString("Documentation Requirements:\n")
	switch req.DocType {
	case "api":
		prompt.WriteString("- Document all API endpoints\n")
		prompt.WriteString("- Include request/response formats\n")
		prompt.WriteString("- Provide example requests and responses\n")
		prompt.WriteString("- Document authentication and authorization\n")
		prompt.WriteString("- Include error codes and handling\n")

	case "architecture":
		prompt.WriteString("- Describe the overall system architecture\n")
		prompt.WriteString("- Explain key components and their interactions\n")
		prompt.WriteString("- Document design patterns used\n")
		prompt.WriteString("- Include data flow and processing\n")
		prompt.WriteString("- Explain scalability and performance considerations\n")

	case "guide":
		prompt.WriteString("- Provide step-by-step instructions\n")
		prompt.WriteString("- Include prerequisites and setup\n")
		prompt.WriteString("- Add code examples where relevant\n")
		prompt.WriteString("- Include troubleshooting tips\n")
		prompt.WriteString("- Provide best practices\n")

	case "readme":
		prompt.WriteString("- Clear project overview\n")
		prompt.WriteString("- Installation instructions\n")
		prompt.WriteString("- Usage examples\n")
		prompt.WriteString("- Configuration options\n")
		prompt.WriteString("- Contributing guidelines\n")
		prompt.WriteString("- License information\n")

	default:
		prompt.WriteString("- Clear and comprehensive documentation\n")
		prompt.WriteString("- Well-structured with sections\n")
		prompt.WriteString("- Include code examples\n")
		prompt.WriteString("- Add relevant links and references\n")
	}

	prompt.WriteString("\nFormat the output as Markdown with proper headings, code blocks, and formatting.\n")

	return prompt.String()
}

// ImproveDocumentation improves existing documentation using AI
func (s *TechDocsService) ImproveDocumentation(req domain.AIImproveDocRequest) (*domain.AIResponse, error) {
	s.log.Infow("Improving documentation with AI", "provider", req.Provider, "improvementType", req.ImprovementType)

	if s.aiService == nil {
		return nil, fmt.Errorf("AI service not available")
	}

	prompt := s.buildImproveDocPrompt(req)

	response, err := s.aiService.GenerateCompletion(req.Provider, prompt, req.Model)
	if err != nil {
		s.log.Errorw("Failed to improve documentation", "error", err)
		return nil, fmt.Errorf("failed to improve documentation: %w", err)
	}

	s.log.Infow("Documentation improved successfully", "provider", req.Provider)
	return response, nil
}

func (s *TechDocsService) buildImproveDocPrompt(req domain.AIImproveDocRequest) string {
	var prompt strings.Builder

	prompt.WriteString("You are an expert technical editor. Improve the following documentation.\n\n")

	switch req.ImprovementType {
	case "grammar":
		prompt.WriteString("Focus on:\n")
		prompt.WriteString("- Correcting grammar and spelling errors\n")
		prompt.WriteString("- Improving sentence structure\n")
		prompt.WriteString("- Fixing punctuation\n")

	case "clarity":
		prompt.WriteString("Focus on:\n")
		prompt.WriteString("- Making explanations clearer and more concise\n")
		prompt.WriteString("- Simplifying complex sentences\n")
		prompt.WriteString("- Removing ambiguity\n")
		prompt.WriteString("- Improving readability\n")

	case "structure":
		prompt.WriteString("Focus on:\n")
		prompt.WriteString("- Reorganizing content for better flow\n")
		prompt.WriteString("- Adding proper headings and sections\n")
		prompt.WriteString("- Improving document hierarchy\n")
		prompt.WriteString("- Adding table of contents if needed\n")

	case "complete":
		prompt.WriteString("Focus on:\n")
		prompt.WriteString("- Fixing all grammar and spelling issues\n")
		prompt.WriteString("- Improving clarity and readability\n")
		prompt.WriteString("- Enhancing structure and organization\n")
		prompt.WriteString("- Adding missing information if obvious\n")
		prompt.WriteString("- Improving code examples\n")
		prompt.WriteString("- Adding relevant links or references\n")
	}

	prompt.WriteString("\nOriginal documentation:\n\n")
	prompt.WriteString(req.Content)
	prompt.WriteString("\n\nProvide the improved version in Markdown format.\n")

	return prompt.String()
}

// ChatAboutDocumentation provides Q&A about documentation using AI
func (s *TechDocsService) ChatAboutDocumentation(req domain.AIChatRequest) (*domain.AIResponse, error) {
	s.log.Infow("Processing chat about documentation", "provider", req.Provider)

	if s.aiService == nil {
		return nil, fmt.Errorf("AI service not available")
	}

	// Build messages with context
	messages := []domain.ChatMessage{}

	if req.Context != "" {
		// Add system message with document context
		messages = append(messages, domain.ChatMessage{
			Role:    "system",
			Content: "You are a helpful assistant that answers questions about technical documentation. Here is the relevant documentation context:\n\n" + req.Context,
		})
	}

	// Add conversation history
	messages = append(messages, req.Conversation...)

	// Add current message
	messages = append(messages, domain.ChatMessage{
		Role:    "user",
		Content: req.Message,
	})

	response, err := s.aiService.GenerateChat(req.Provider, messages, req.Model)
	if err != nil {
		s.log.Errorw("Failed to process chat", "error", err)
		return nil, fmt.Errorf("failed to process chat: %w", err)
	}

	s.log.Infow("Chat processed successfully", "provider", req.Provider)
	return response, nil
}

// GenerateDiagram generates a diagram from code or description
func (s *TechDocsService) GenerateDiagram(req domain.GenerateDiagramRequest) (*domain.DiagramResponse, error) {
	s.log.Infow("Generating diagram", "type", req.DiagramType, "provider", req.Provider)

	if s.diagramService == nil {
		return nil, fmt.Errorf("diagram service not available")
	}

	response, err := s.diagramService.GenerateDiagram(req)
	if err != nil {
		s.log.Errorw("Failed to generate diagram", "error", err)
		return nil, fmt.Errorf("failed to generate diagram: %w", err)
	}

	s.log.Infow("Diagram generated successfully", "type", req.DiagramType)
	return response, nil
}
