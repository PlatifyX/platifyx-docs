package domain

import "time"

type TechDoc struct {
	Path         string    `json:"path"`
	Name         string    `json:"name"`
	Content      string    `json:"content"`
	IsDirectory  bool      `json:"isDirectory"`
	Size         int64     `json:"size"`
	ModifiedTime time.Time `json:"modifiedTime"`
}

type TechDocFolder struct {
	Path     string          `json:"path"`
	Name     string          `json:"name"`
	Children []TechDocFolder `json:"children,omitempty"`
	Files    []TechDoc       `json:"files,omitempty"`
}

type TechDocTreeNode struct {
	Path        string            `json:"path"`
	Name        string            `json:"name"`
	IsDirectory bool              `json:"isDirectory"`
	Children    []TechDocTreeNode `json:"children,omitempty"`
}
