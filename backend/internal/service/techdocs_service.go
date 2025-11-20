package service

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/cache"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/google/uuid"
)

type TechDocsService struct {
	docsPath       string
	aiService      *AIService
	diagramService *DiagramService
	githubService  *GitHubService
	log            *logger.Logger
	progressStore  *cache.RedisClient
	progressTTL    time.Duration
}

const (
	techDocsProgressKeyPrefix = "techdocs:progress:"
	techDocsProgressTTL       = 2 * time.Hour
)

func NewTechDocsService(docsPath string, aiService *AIService, diagramService *DiagramService, githubService *GitHubService, progressStore *cache.RedisClient, log *logger.Logger) *TechDocsService {
	return &TechDocsService{
		docsPath:       docsPath,
		aiService:      aiService,
		diagramService: diagramService,
		githubService:  githubService,
		log:            log,
		progressStore:  progressStore,
		progressTTL:    techDocsProgressTTL,
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
		cheapestModel = "gpt-4.1-mini" // Cheapest OpenAI model (~90% cheaper than GPT-4)
	case domain.AIProviderClaude:
		cheapestModel = "claude-3-haiku-20240307" // Cheapest Claude model (~95% cheaper than Opus)
	case domain.AIProviderGemini:
		cheapestModel = "gemini-pro" // Standard Gemini model
	default:
		cheapestModel = "gpt-4.1-mini" // Default to cheapest overall
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

func (s *TechDocsService) GenerateDocumentation(req domain.AIGenerateDocRequest) (*domain.TechDocsProgress, error) {
	s.log.Infow("Queueing documentation generation", "provider", req.Provider, "source", req.Source, "docType", req.DocType, "readFullRepo", req.ReadFullRepo)

	if s.aiService == nil {
		return nil, fmt.Errorf("AI service not available")
	}

	if s.progressStore == nil {
		return nil, fmt.Errorf("progress store not configured")
	}

	progress := s.newProgressRecord(req)
	if err := s.persistProgress(progress); err != nil {
		s.log.Errorw("Failed to persist progress", "error", err)
		return nil, fmt.Errorf("failed to persist progress: %w", err)
	}

	go s.runGenerateDocumentationJob(progress.ID, req)

	return progress, nil
}

func (s *TechDocsService) runGenerateDocumentationJob(progressID string, req domain.AIGenerateDocRequest) {
	defer func() {
		if r := recover(); r != nil {
			s.markProgressFailed(progressID, fmt.Errorf("panic: %v", r))
		}
	}()

	s.setProgressRunning(progressID, "Preparando documentação")

	response, err := s.executeDocumentationGeneration(progressID, req)
	if err != nil {
		s.markProgressFailed(progressID, err)
		return
	}

	s.markProgressCompleted(progressID, response)
}

func (s *TechDocsService) executeDocumentationGeneration(progressID string, req domain.AIGenerateDocRequest) (*domain.AIResponse, error) {
	var files []repoFile

	if req.Source == "github" && req.ReadFullRepo {
		if s.githubService == nil {
			return nil, fmt.Errorf("GitHub service not available")
		}

		s.updateProgressMessage(progressID, "Lendo repositório do GitHub")

		parts := strings.Split(req.RepoURL, "/")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid repository format, expected 'owner/repo'")
		}
		owner, repo := parts[0], parts[1]

		repoInfo, err := s.githubService.GetRepository(owner, repo)
		if err != nil {
			return nil, fmt.Errorf("failed to get repository info: %w", err)
		}

		ghFiles, err := s.githubService.GetAllRepositoryFiles(owner, repo, repoInfo.DefaultBranch)
		if err != nil {
			return nil, fmt.Errorf("failed to read repository files: %w", err)
		}

		for _, f := range ghFiles {
			files = append(files, repoFile{
				Path:    f.Path,
				Content: f.Content,
			})
		}

		s.log.Infow("Loaded full repository", "fileCount", len(files))

		req.Model = s.getCheapestModel(req.Provider, req.Model)
		s.log.Infow("Using model", "provider", req.Provider, "model", req.Model)

		contextLimit := s.getModelContextLimit(req.Provider, req.Model)
		s.log.Infow("Context limit for model", "provider", req.Provider, "model", req.Model, "limit", contextLimit)

		return s.generateDocumentationWithChunking(req, files, contextLimit, progressID)
	}

	req.Model = s.getCheapestModel(req.Provider, req.Model)
	s.log.Infow("Using model for single file", "provider", req.Provider, "model", req.Model)

	prompt := s.buildGenerateDocPrompt(req)

	estimatedTokens := s.estimateTokenCount(prompt)
	contextLimit := s.getModelContextLimit(req.Provider, req.Model)

	if estimatedTokens > contextLimit {
		s.log.Warnw("Prompt exceeds context limit, truncating", "estimated", estimatedTokens, "limit", contextLimit)
		maxCodeChars := contextLimit * 4 * 3 / 4
		if len(req.Code) > maxCodeChars {
			req.Code = req.Code[:maxCodeChars] + "\n\n... [Content truncated due to size limits]"
			prompt = s.buildGenerateDocPrompt(req)
		}
	}

	s.setProgressTotal(progressID, 1)
	s.updateChunkProgress(progressID, 1, 1, "Gerando documentação")

	response, err := s.aiService.GenerateCompletion(req.Provider, prompt, req.Model)
	if err != nil {
		s.log.Errorw("Failed to generate documentation", "error", err)
		return nil, fmt.Errorf("failed to generate documentation: %w", err)
	}

	if req.SavePath != "" && response.Content != "" {
		if err := s.SaveDocument(req.SavePath, response.Content); err != nil {
			s.log.Errorw("Failed to auto-save documentation", "error", err, "path", req.SavePath)
		} else {
			s.updateProgressMessage(progressID, fmt.Sprintf("Documento salvo em %s", req.SavePath))
		}
	}

	s.log.Infow("Documentation generated successfully", "provider", req.Provider, "length", len(response.Content))
	return response, nil
}

// generateDocumentationWithChunking processes large repositories in chunks
func (s *TechDocsService) generateDocumentationWithChunking(req domain.AIGenerateDocRequest, files []repoFile, contextLimit int, progressID string) (*domain.AIResponse, error) {
	// Prioritize important files first
	prioritizedFiles := s.prioritizeFiles(files)

	// Create chunks of files that fit within context limit
	chunks := s.createFileChunks(prioritizedFiles, contextLimit, req)

	s.log.Infow("Created file chunks", "totalFiles", len(files), "chunks", len(chunks))

	if len(chunks) == 0 {
		return nil, fmt.Errorf("no files to process after chunking")
	}

	s.setProgressTotal(progressID, len(chunks))

	if len(chunks) == 1 {
		s.updateChunkProgress(progressID, 1, 1, "Gerando documentação")
		req.Code = chunks[0]
		prompt := s.buildGenerateDocPrompt(req)
		return s.aiService.GenerateCompletion(req.Provider, prompt, req.Model)
	}

	var chunkResults []string
	for i, chunk := range chunks {
		s.log.Infow("Processing chunk", "chunk", i+1, "total", len(chunks), "size", len(chunk))

		s.updateChunkProgress(progressID, i+1, len(chunks), fmt.Sprintf("Processando chunk %d/%d", i+1, len(chunks)))

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
		bar := s.renderProgressBar(i+1, len(chunks))
		percent := int(float64(i+1) / float64(len(chunks)) * 100)
		s.log.Infow("Documentation progress", "chunk", i+1, "totalChunks", len(chunks), "percent", percent, "bar", bar)
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
			s.updateProgressMessage(progressID, fmt.Sprintf("Documento salvo em %s", req.SavePath))
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

	prompt.WriteString("Você é um redator técnico especialista. ")

	if totalChunks > 1 {
		prompt.WriteString(fmt.Sprintf("Esta é a parte %d de %d de um repositório grande. ", chunkNum, totalChunks))
		prompt.WriteString("Foque em documentar apenas os arquivos desta seção. ")
	}

	prompt.WriteString("Gere documentação completa de ")
	prompt.WriteString(req.DocType)
	prompt.WriteString(" com base no código a seguir. Escreva tudo em português do Brasil.\n\n")

	prompt.WriteString(req.Code)
	prompt.WriteString("\n\n")

	prompt.WriteString("Requisitos da documentação:\n")
	switch req.DocType {
	case "api":
		prompt.WriteString("- Documente todos os endpoints encontrados nesta seção\n")
		prompt.WriteString("- Inclua formatos de requisição e resposta\n")
		prompt.WriteString("- Forneça exemplos de requisições\n")
	case "architecture":
		prompt.WriteString("- Descreva os componentes desta seção\n")
		prompt.WriteString("- Explique as interações entre eles\n")
		prompt.WriteString("- Documente os padrões de projeto utilizados\n")
	case "guide":
		prompt.WriteString("- Forneça explicações claras\n")
		prompt.WriteString("- Inclua exemplos de código desses arquivos\n")
		prompt.WriteString("- Adicione instruções de configuração se relevantes\n")
	case "readme":
		prompt.WriteString("- Documente a funcionalidade presente nesses arquivos\n")
		prompt.WriteString("- Inclua exemplos de uso\n")
		prompt.WriteString("- Destaque configurações importantes\n")
	}

	if totalChunks > 1 {
		prompt.WriteString("\nObservação: gere uma seção focada apenas nesses arquivos. ")
		prompt.WriteString("As seções serão combinadas depois, então use títulos claros.\n")
	}

	prompt.WriteString("\nInclua ao menos um diagrama Mermaid dentro de um bloco ```mermaid``` representando a arquitetura ou fluxo descrito.\n")
	prompt.WriteString("\nFormate a saída em Markdown com títulos adequados e blocos de código.\n")

	return prompt.String()
}

// combineChunkResults combines documentation from multiple chunks
func (s *TechDocsService) combineChunkResults(results []string, docType string) string {
	var combined strings.Builder

	switch docType {
	case "api":
		combined.WriteString("# Documentação de API\n\n")
	case "architecture":
		combined.WriteString("# Documentação de Arquitetura\n\n")
	case "guide":
		combined.WriteString("# Guia do Desenvolvedor\n\n")
	case "readme":
		combined.WriteString("# Documentação do Projeto\n\n")
	default:
		combined.WriteString("# Documentação\n\n")
	}

	combined.WriteString("Esta documentação foi gerada a partir de múltiplas seções do repositório.\n\n")
	combined.WriteString("---\n\n")

	for i, result := range results {
		if i > 0 {
			combined.WriteString("\n---\n\n")
		}
		combined.WriteString(result)
	}

	return combined.String()
}

func (s *TechDocsService) newProgressRecord(req domain.AIGenerateDocRequest) *domain.TechDocsProgress {
	now := time.Now()
	return &domain.TechDocsProgress{
		ID:          uuid.NewString(),
		Status:      domain.TechDocsProgressStatusQueued,
		Percent:     0,
		Chunk:       0,
		TotalChunks: 0,
		Message:     "Aguardando processamento",
		Provider:    req.Provider,
		Model:       req.Model,
		DocType:     req.DocType,
		Source:      req.Source,
		SavePath:    req.SavePath,
		RepoURL:     req.RepoURL,
		StartedAt:   now,
		UpdatedAt:   now,
	}
}

func (s *TechDocsService) progressKey(id string) string {
	return techDocsProgressKeyPrefix + id
}

func (s *TechDocsService) persistProgress(progress *domain.TechDocsProgress) error {
	if s.progressStore == nil {
		return fmt.Errorf("progress store not configured")
	}

	return s.progressStore.Set(s.progressKey(progress.ID), progress, s.progressTTL)
}

func (s *TechDocsService) updateProgress(progressID string, updater func(*domain.TechDocsProgress)) {
	if s.progressStore == nil || progressID == "" {
		return
	}

	progress, err := s.GetDocumentationProgress(progressID)
	if err != nil {
		s.log.Warnw("Failed to load progress", "progressId", progressID, "error", err)
		return
	}

	updater(progress)
	progress.UpdatedAt = time.Now()
	if progress.Percent < 0 {
		progress.Percent = 0
	}
	if progress.Percent > 100 {
		progress.Percent = 100
	}

	if err := s.persistProgress(progress); err != nil {
		s.log.Warnw("Failed to persist progress", "progressId", progressID, "error", err)
	}
}

func (s *TechDocsService) setProgressRunning(progressID string, message string) {
	s.updateProgress(progressID, func(p *domain.TechDocsProgress) {
		p.Status = domain.TechDocsProgressStatusRunning
		p.Message = message
	})
}

func (s *TechDocsService) setProgressTotal(progressID string, total int) {
	if total <= 0 {
		total = 1
	}
	s.updateProgress(progressID, func(p *domain.TechDocsProgress) {
		p.TotalChunks = total
	})
}

func (s *TechDocsService) updateChunkProgress(progressID string, chunk, total int, message string) {
	if total <= 0 {
		total = 1
	}
	if chunk < 0 {
		chunk = 0
	}
	if chunk > total {
		chunk = total
	}
	percent := int(float64(chunk) / float64(total) * 100)
	s.updateProgress(progressID, func(p *domain.TechDocsProgress) {
		p.Chunk = chunk
		p.TotalChunks = total
		p.Percent = percent
		p.Message = message
	})
}

func (s *TechDocsService) updateProgressMessage(progressID string, message string) {
	s.updateProgress(progressID, func(p *domain.TechDocsProgress) {
		p.Message = message
	})
}

func (s *TechDocsService) markProgressFailed(progressID string, err error) {
	if err == nil {
		err = fmt.Errorf("unknown error")
	}
	s.updateProgress(progressID, func(p *domain.TechDocsProgress) {
		p.Status = domain.TechDocsProgressStatusFailed
		p.Message = "Falha na geração"
		p.ErrorMessage = err.Error()
	})
}

func (s *TechDocsService) markProgressCompleted(progressID string, response *domain.AIResponse) {
	if response == nil {
		return
	}
	s.updateProgress(progressID, func(p *domain.TechDocsProgress) {
		p.Status = domain.TechDocsProgressStatusComplete
		p.Percent = 100
		p.Chunk = p.TotalChunks
		p.Message = "Documentação concluída"
		p.ResultContent = response.Content
		p.Provider = response.Provider
		p.Model = response.Model
	})
}

func (s *TechDocsService) GetDocumentationProgress(id string) (*domain.TechDocsProgress, error) {
	if s.progressStore == nil {
		return nil, fmt.Errorf("progress store not configured")
	}
	var progress domain.TechDocsProgress
	if err := s.progressStore.GetJSON(s.progressKey(id), &progress); err != nil {
		return nil, err
	}
	return &progress, nil
}

func (s *TechDocsService) renderProgressBar(current, total int) string {
	if total <= 0 {
		return "[----------] 0%"
	}

	const segments = 20
	ratio := float64(current) / float64(total)
	filled := int(ratio * segments)
	if filled > segments {
		filled = segments
	}
	if filled < 0 {
		filled = 0
	}

	bar := strings.Repeat("#", filled) + strings.Repeat("-", segments-filled)
	percent := int(ratio * 100)
	if percent > 100 {
		percent = 100
	}
	if percent < 0 {
		percent = 0
	}

	return fmt.Sprintf("[%s] %d%%", bar, percent)
}

func (s *TechDocsService) buildGenerateDocPrompt(req domain.AIGenerateDocRequest) string {
	var prompt strings.Builder

	prompt.WriteString("Você é um redator técnico especialista. Gere documentação completa de ")
	prompt.WriteString(req.DocType)
	prompt.WriteString(" com base nas informações a seguir. Escreva tudo em português do Brasil.\n\n")

	switch req.Source {
	case "code":
		prompt.WriteString("Analise este código e produza documentação detalhada:\n\n")
		if req.Language != "" {
			prompt.WriteString("Linguagem de Programação: ")
			prompt.WriteString(req.Language)
			prompt.WriteString("\n\n")
		}
		prompt.WriteString("```\n")
		prompt.WriteString(req.Code)
		prompt.WriteString("\n```\n\n")

	case "github":
		prompt.WriteString("Crie documentação para este repositório GitHub:\n")
		prompt.WriteString("Repositório: ")
		prompt.WriteString(req.RepoURL)
		prompt.WriteString("\n")
		if req.SourcePath != "" {
			prompt.WriteString("Caminho específico: ")
			prompt.WriteString(req.SourcePath)
			prompt.WriteString("\n")
		}
		if req.Code != "" {
			prompt.WriteString("\nTrecho de código:\n```\n")
			prompt.WriteString(req.Code)
			prompt.WriteString("\n```\n")
		}
		prompt.WriteString("\n")

	case "azuredevops":
		prompt.WriteString("Crie documentação para este projeto Azure DevOps:\n")
		prompt.WriteString("Projeto: ")
		prompt.WriteString(req.ProjectName)
		prompt.WriteString("\n")
		if req.SourcePath != "" {
			prompt.WriteString("Caminho: ")
			prompt.WriteString(req.SourcePath)
			prompt.WriteString("\n")
		}
		if req.Code != "" {
			prompt.WriteString("\nTrecho de código:\n```\n")
			prompt.WriteString(req.Code)
			prompt.WriteString("\n```\n")
		}
		prompt.WriteString("\n")
	}

	prompt.WriteString("Requisitos da documentação:\n")
	switch req.DocType {
	case "api":
		prompt.WriteString("- Documente todos os endpoints da API\n")
		prompt.WriteString("- Inclua formatos de requisição e resposta\n")
		prompt.WriteString("- Forneça exemplos de requisições e respostas\n")
		prompt.WriteString("- Documente autenticação e autorização\n")
		prompt.WriteString("- Liste códigos de erro e tratamentos\n")

	case "architecture":
		prompt.WriteString("- Descreva a arquitetura geral do sistema\n")
		prompt.WriteString("- Explique os componentes principais e suas interações\n")
		prompt.WriteString("- Documente os padrões de projeto utilizados\n")
		prompt.WriteString("- Detalhe fluxos de dados e processamento\n")
		prompt.WriteString("- Explique aspectos de escalabilidade e desempenho\n")

	case "guide":
		prompt.WriteString("- Forneça instruções passo a passo\n")
		prompt.WriteString("- Liste pré-requisitos e configuração\n")
		prompt.WriteString("- Inclua exemplos de código quando relevante\n")
		prompt.WriteString("- Adicione dicas de troubleshooting\n")
		prompt.WriteString("- Compartilhe boas práticas\n")

	case "readme":
		prompt.WriteString("- Visão geral clara do projeto\n")
		prompt.WriteString("- Instruções de instalação\n")
		prompt.WriteString("- Exemplos de uso\n")
		prompt.WriteString("- Opções de configuração\n")
		prompt.WriteString("- Diretrizes de contribuição\n")
		prompt.WriteString("- Informações de licença\n")

	default:
		prompt.WriteString("- Documentação clara e abrangente\n")
		prompt.WriteString("- Estrutura bem organizada em seções\n")
		prompt.WriteString("- Inclua exemplos de código\n")
		prompt.WriteString("- Adicione links e referências relevantes\n")
	}

	prompt.WriteString("\nInclua ao menos um diagrama Mermaid dentro de um bloco ```mermaid``` representando a estrutura descrita.\n")
	prompt.WriteString("\nFormate a saída em Markdown com títulos apropriados, blocos de código e boa formatação.\n")

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

	prompt.WriteString("Você é um editor técnico especialista. Melhore a documentação a seguir e responda em português do Brasil.\n\n")

	switch req.ImprovementType {
	case "grammar":
		prompt.WriteString("Foque em:\n")
		prompt.WriteString("- Corrigir erros de gramática e ortografia\n")
		prompt.WriteString("- Melhorar a estrutura das frases\n")
		prompt.WriteString("- Ajustar pontuação\n")

	case "clarity":
		prompt.WriteString("Foque em:\n")
		prompt.WriteString("- Tornar as explicações mais claras e concisas\n")
		prompt.WriteString("- Simplificar frases complexas\n")
		prompt.WriteString("- Remover ambiguidades\n")
		prompt.WriteString("- Melhorar a legibilidade\n")

	case "structure":
		prompt.WriteString("Foque em:\n")
		prompt.WriteString("- Reorganizar o conteúdo para melhor fluidez\n")
		prompt.WriteString("- Adicionar títulos e seções adequados\n")
		prompt.WriteString("- Melhorar a hierarquia do documento\n")
		prompt.WriteString("- Adicionar índice se necessário\n")

	case "complete":
		prompt.WriteString("Foque em:\n")
		prompt.WriteString("- Corrigir todos os problemas de gramática e ortografia\n")
		prompt.WriteString("- Melhorar clareza e legibilidade\n")
		prompt.WriteString("- Aperfeiçoar estrutura e organização\n")
		prompt.WriteString("- Acrescentar informações faltantes quando óbvias\n")
		prompt.WriteString("- Aprimorar exemplos de código\n")
		prompt.WriteString("- Adicionar links ou referências relevantes\n")
	}

	prompt.WriteString("\nDocumentação original:\n\n")
	prompt.WriteString(req.Content)
	prompt.WriteString("\n\nForneça a versão aprimorada em Markdown.\n")

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
