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
	docsPath       string
	aiService      *AIService
	diagramService *DiagramService
	githubService  *GitHubService
	log            *logger.Logger
}

func NewTechDocsService(docsPath string, aiService *AIService, diagramService *DiagramService, githubService *GitHubService, log *logger.Logger) *TechDocsService {
	return &TechDocsService{
		docsPath:       docsPath,
		aiService:      aiService,
		diagramService: diagramService,
		githubService:  githubService,
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

// estimateTokenCount estimates the number of tokens in a string
// Using rough approximation: 1 token ≈ 4 characters
func (s *TechDocsService) estimateTokenCount(text string) int {
	return len(text) / 4
}

// getModelContextLimit returns the safe context limit for a given model
// Using very conservative limits to minimize costs and process code in smaller chunks
func (s *TechDocsService) getModelContextLimit(provider domain.AIProvider, model string) int {
	// Very conservative limits to use cheaper models and smaller chunks
	switch provider {
	case domain.AIProviderOpenAI:
		// Always use small chunks for OpenAI to minimize costs
		return 2000 // Conservative for gpt-3.5-turbo (cheapest option)
	case domain.AIProviderClaude:
		// Use Haiku (cheapest) with conservative chunks
		return 2500
	case domain.AIProviderGemini:
		// Gemini Pro with conservative chunks
		return 2000
	default:
		return 1500 // Very conservative default
	}
}

// getCheapestModel ALWAYS returns the cheapest model for the given provider
// IGNORES any requested model to ensure cost minimization
func (s *TechDocsService) getCheapestModel(provider domain.AIProvider, requestedModel string) string {
	// ALWAYS use cheapest models, regardless of what was requested
	// This ensures cost minimization at all times

	var cheapestModel string
	switch provider {
	case domain.AIProviderOpenAI:
		cheapestModel = "gpt-3.5-turbo" // Cheapest OpenAI model (~90% cheaper than GPT-4)
	case domain.AIProviderClaude:
		cheapestModel = "claude-3-haiku-20240307" // Cheapest Claude model (~95% cheaper than Opus)
	case domain.AIProviderGemini:
		cheapestModel = "gemini-pro" // Standard Gemini model
	default:
		cheapestModel = "gpt-3.5-turbo" // Default to cheapest overall
	}

	// Log if we're overriding a requested model
	if requestedModel != "" && requestedModel != cheapestModel {
		s.log.Infow("Forcing cheapest model (cost optimization)",
			"requested", requestedModel,
			"forced", cheapestModel,
			"provider", provider)
	}

	return cheapestModel
}

type repoFile struct {
	Path    string
	Content string
}

// GenerateDocumentation generates documentation using AI
func (s *TechDocsService) GenerateDocumentation(req domain.AIGenerateDocRequest) (*domain.AIResponse, error) {
	s.log.Infow("Generating documentation with AI", "provider", req.Provider, "source", req.Source, "docType", req.DocType, "readFullRepo", req.ReadFullRepo)

	if s.aiService == nil {
		return nil, fmt.Errorf("AI service not available")
	}

	var files []repoFile

	// If reading full repository from GitHub
	if req.Source == "github" && req.ReadFullRepo {
		if s.githubService == nil {
			return nil, fmt.Errorf("GitHub service not available")
		}

		// Extract owner and repo from repoURL (format: "owner/repo")
		parts := strings.Split(req.RepoURL, "/")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid repository format, expected 'owner/repo'")
		}
		owner, repo := parts[0], parts[1]

		// Get repository info to get default branch
		repoInfo, err := s.githubService.GetRepository(owner, repo)
		if err != nil {
			return nil, fmt.Errorf("failed to get repository info: %w", err)
		}

		// Get all files from repository
		ghFiles, err := s.githubService.GetAllRepositoryFiles(owner, repo, repoInfo.DefaultBranch)
		if err != nil {
			return nil, fmt.Errorf("failed to read repository files: %w", err)
		}

		// Convert to our internal structure
		for _, f := range ghFiles {
			files = append(files, repoFile{
				Path:    f.Path,
				Content: f.Content,
			})
		}

		s.log.Infow("Loaded full repository", "fileCount", len(files))

		// Force use of cheapest model if not specified
		req.Model = s.getCheapestModel(req.Provider, req.Model)
		s.log.Infow("Using model", "provider", req.Provider, "model", req.Model)

		// Check if content needs chunking
		contextLimit := s.getModelContextLimit(req.Provider, req.Model)
		s.log.Infow("Context limit for model", "provider", req.Provider, "model", req.Model, "limit", contextLimit)

		// Process with chunking (always chunk for large repos to minimize costs)
		return s.generateDocumentationWithChunking(req, files, contextLimit)
	}

	// For non-repository sources, proceed as before
	// Force use of cheapest model if not specified
	req.Model = s.getCheapestModel(req.Provider, req.Model)
	s.log.Infow("Using model for single file", "provider", req.Provider, "model", req.Model)

	prompt := s.buildGenerateDocPrompt(req)

	// Check if the prompt is too large
	estimatedTokens := s.estimateTokenCount(prompt)
	contextLimit := s.getModelContextLimit(req.Provider, req.Model)

	if estimatedTokens > contextLimit {
		s.log.Warnw("Prompt exceeds context limit, truncating", "estimated", estimatedTokens, "limit", contextLimit)
		// Truncate the code section if it's too large
		maxCodeChars := contextLimit * 4 * 3 / 4 // Use 75% of limit for code
		if len(req.Code) > maxCodeChars {
			req.Code = req.Code[:maxCodeChars] + "\n\n... [Content truncated due to size limits]"
			prompt = s.buildGenerateDocPrompt(req)
		}
	}

	response, err := s.aiService.GenerateCompletion(req.Provider, prompt, req.Model)
	if err != nil {
		s.log.Errorw("Failed to generate documentation", "error", err)
		return nil, fmt.Errorf("failed to generate documentation: %w", err)
	}

	// Auto-save if savePath is provided
	if req.SavePath != "" && response.Content != "" {
		if err := s.SaveDocument(req.SavePath, response.Content); err != nil {
			s.log.Errorw("Failed to auto-save documentation", "error", err, "path", req.SavePath)
			// Don't fail the request, just log the error
		} else {
			s.log.Infow("Documentation auto-saved successfully", "path", req.SavePath)
		}
	}

	s.log.Infow("Documentation generated successfully", "provider", req.Provider, "length", len(response.Content))
	return response, nil
}

// generateDocumentationWithChunking processes large repositories in chunks
func (s *TechDocsService) generateDocumentationWithChunking(req domain.AIGenerateDocRequest, files []repoFile, contextLimit int) (*domain.AIResponse, error) {
	// Prioritize important files first
	prioritizedFiles := s.prioritizeFiles(files)

	// Create chunks of files that fit within context limit
	chunks := s.createFileChunks(prioritizedFiles, contextLimit, req)

	s.log.Infow("Created file chunks", "totalFiles", len(files), "chunks", len(chunks))

	if len(chunks) == 0 {
		return nil, fmt.Errorf("no files to process after chunking")
	}

	// If only one chunk, process normally
	if len(chunks) == 1 {
		req.Code = chunks[0]
		prompt := s.buildGenerateDocPrompt(req)
		return s.aiService.GenerateCompletion(req.Provider, prompt, req.Model)
	}

	// Process each chunk and collect results
	var chunkResults []string
	for i, chunk := range chunks {
		s.log.Infow("Processing chunk", "chunk", i+1, "total", len(chunks), "size", len(chunk))

		chunkReq := req
		chunkReq.Code = chunk

		// Modify the prompt to indicate this is part of a multi-chunk process
		prompt := s.buildChunkDocPrompt(chunkReq, i+1, len(chunks))

		response, err := s.aiService.GenerateCompletion(req.Provider, prompt, req.Model)
		if err != nil {
			s.log.Errorw("Failed to process chunk", "chunk", i+1, "error", err)
			return nil, fmt.Errorf("failed to process chunk %d: %w", i+1, err)
		}

		chunkResults = append(chunkResults, response.Content)
	}

	// Combine all chunk results
	combinedContent := s.combineChunkResults(chunkResults, req.DocType)

	response := &domain.AIResponse{
		Provider: req.Provider,
		Model:    req.Model,
		Content:  combinedContent,
	}

	// Auto-save if savePath is provided
	if req.SavePath != "" && response.Content != "" {
		if err := s.SaveDocument(req.SavePath, response.Content); err != nil {
			s.log.Errorw("Failed to auto-save documentation", "error", err, "path", req.SavePath)
		} else {
			s.log.Infow("Documentation auto-saved successfully", "path", req.SavePath)
		}
	}

	s.log.Infow("Documentation generated successfully with chunking", "chunks", len(chunks), "totalLength", len(combinedContent))
	return response, nil
}

// prioritizeFiles sorts files by importance for documentation
func (s *TechDocsService) prioritizeFiles(files []repoFile) []repoFile {
	// Create priority buckets
	highPriority := []repoFile{}
	mediumPriority := []repoFile{}
	lowPriority := []repoFile{}

	for _, file := range files {
		fileName := strings.ToLower(filepath.Base(file.Path))
		filePath := strings.ToLower(file.Path)

		// High priority: READMEs, main files, configs
		if strings.Contains(fileName, "readme") ||
			strings.Contains(fileName, "main.") ||
			strings.Contains(fileName, "index.") ||
			strings.Contains(fileName, "app.") ||
			fileName == "package.json" ||
			fileName == "go.mod" ||
			fileName == "requirements.txt" ||
			fileName == "dockerfile" {
			highPriority = append(highPriority, file)
		} else if strings.Contains(filePath, "test") ||
			strings.Contains(filePath, "spec") ||
			strings.Contains(fileName, "_test.") ||
			strings.Contains(fileName, ".test.") {
			// Low priority: tests
			lowPriority = append(lowPriority, file)
		} else {
			// Medium priority: everything else
			mediumPriority = append(mediumPriority, file)
		}
	}

	// Combine in priority order
	result := append(highPriority, mediumPriority...)
	result = append(result, lowPriority...)
	return result
}

// createFileChunks splits files into chunks that fit within context limit
// Uses aggressive chunking to minimize costs - processes few files at a time
func (s *TechDocsService) createFileChunks(files []repoFile, contextLimit int, req domain.AIGenerateDocRequest) []string {
	var chunks []string
	var currentChunk strings.Builder

	// Reserve space for prompt structure (roughly 500 tokens)
	maxChunkTokens := contextLimit - 500
	maxChunkChars := maxChunkTokens * 4

	// Maximum files per chunk to keep costs low (process code in small batches)
	const maxFilesPerChunk = 3

	// Add repository header
	header := fmt.Sprintf("Repository: %s\n\n", req.RepoURL)
	currentChunk.WriteString(header)
	currentTokens := s.estimateTokenCount(header)

	filesInChunk := 0

	for _, file := range files {
		fileContent := fmt.Sprintf("=== File: %s ===\n%s\n\n", file.Path, file.Content)
		fileTokens := s.estimateTokenCount(fileContent)

		// If this single file is too large, truncate it more aggressively
		if fileTokens > maxChunkTokens/3 {
			s.log.Warnw("File too large, truncating", "file", file.Path, "tokens", fileTokens)
			truncatedContent := file.Content
			maxContentChars := maxChunkChars / 3
			if len(truncatedContent) > maxContentChars {
				truncatedContent = truncatedContent[:maxContentChars] + "\n... [truncated due to size]"
			}
			fileContent = fmt.Sprintf("=== File: %s ===\n%s\n\n", file.Path, truncatedContent)
			fileTokens = s.estimateTokenCount(fileContent)
		}

		// Check if adding this file would exceed the limit OR max files per chunk
		shouldStartNewChunk := (currentTokens+fileTokens > maxChunkTokens || filesInChunk >= maxFilesPerChunk) && filesInChunk > 0

		if shouldStartNewChunk {
			// Save current chunk and start a new one
			chunks = append(chunks, currentChunk.String())
			currentChunk.Reset()
			currentChunk.WriteString(header)
			currentTokens = s.estimateTokenCount(header)
			filesInChunk = 0
			s.log.Infow("Created chunk", "chunkNumber", len(chunks), "files", filesInChunk)
		}

		// Add file to current chunk
		currentChunk.WriteString(fileContent)
		currentTokens += fileTokens
		filesInChunk++
	}

	// Add the last chunk if it has content
	if filesInChunk > 0 {
		chunks = append(chunks, currentChunk.String())
		s.log.Infow("Created final chunk", "chunkNumber", len(chunks), "files", filesInChunk)
	}

	return chunks
}

// buildChunkDocPrompt builds a prompt for a specific chunk
func (s *TechDocsService) buildChunkDocPrompt(req domain.AIGenerateDocRequest, chunkNum, totalChunks int) string {
	var prompt strings.Builder

	prompt.WriteString("You are an expert technical writer. ")

	if totalChunks > 1 {
		prompt.WriteString(fmt.Sprintf("This is part %d of %d of a large repository. ", chunkNum, totalChunks))
		prompt.WriteString("Focus on documenting the files provided in this section. ")
	}

	prompt.WriteString("Generate comprehensive ")
	prompt.WriteString(req.DocType)
	prompt.WriteString(" documentation based on the following code:\n\n")

	prompt.WriteString(req.Code)
	prompt.WriteString("\n\n")

	// Add doc type specific instructions
	prompt.WriteString("Documentation Requirements:\n")
	switch req.DocType {
	case "api":
		prompt.WriteString("- Document all API endpoints found in this section\n")
		prompt.WriteString("- Include request/response formats\n")
		prompt.WriteString("- Provide example requests\n")
	case "architecture":
		prompt.WriteString("- Describe the components in this section\n")
		prompt.WriteString("- Explain their interactions\n")
		prompt.WriteString("- Document design patterns used\n")
	case "guide":
		prompt.WriteString("- Provide clear explanations\n")
		prompt.WriteString("- Include code examples from these files\n")
		prompt.WriteString("- Add setup instructions if relevant\n")
	case "readme":
		prompt.WriteString("- Document the functionality in these files\n")
		prompt.WriteString("- Include usage examples\n")
		prompt.WriteString("- Note important configurations\n")
	}

	if totalChunks > 1 {
		prompt.WriteString("\nNote: Create a focused section for these files. ")
		prompt.WriteString("The sections will be combined later, so use clear headings.\n")
	}

	prompt.WriteString("\nFormat the output as Markdown with proper headings and code blocks.\n")

	return prompt.String()
}

// combineChunkResults combines documentation from multiple chunks
func (s *TechDocsService) combineChunkResults(results []string, docType string) string {
	var combined strings.Builder

	// Add a main header based on doc type
	switch docType {
	case "api":
		combined.WriteString("# API Documentation\n\n")
	case "architecture":
		combined.WriteString("# Architecture Documentation\n\n")
	case "guide":
		combined.WriteString("# Developer Guide\n\n")
	case "readme":
		combined.WriteString("# Project Documentation\n\n")
	default:
		combined.WriteString("# Documentation\n\n")
	}

	combined.WriteString("This documentation was generated from multiple sections of the repository.\n\n")
	combined.WriteString("---\n\n")

	// Combine all results
	for i, result := range results {
		if i > 0 {
			combined.WriteString("\n---\n\n")
		}
		combined.WriteString(result)
	}

	return combined.String()
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
