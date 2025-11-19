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
	docsPath string
	log      *logger.Logger
}

func NewTechDocsService(docsPath string, log *logger.Logger) *TechDocsService {
	return &TechDocsService{
		docsPath: docsPath,
		log:      log,
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
