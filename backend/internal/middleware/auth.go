package middleware

import (
	"net/http"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware middleware de autenticação JWT
func AuthMiddleware(authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extrair token do header "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// Validar token
		userID, err := authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Buscar usuário
		user, err := authService.GetUserFromToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Armazenar informações do usuário no contexto
		c.Set("user_id", userID)
		c.Set("user", user)
		c.Set("token", token)

		c.Next()
	}
}

// RequirePermission middleware para verificar permissões RBAC
func RequirePermission(userService *service.UserService, resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Buscar permissões do usuário
		permissions, err := userService.GetUserPermissions(userID.(string))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking permissions"})
			c.Abort()
			return
		}

		// Verificar se tem a permissão
		if !permissions.HasPermission(resource, action) && !permissions.IsAdmin() {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// OptionalAuth middleware que tenta autenticar mas não falha se não houver token
func OptionalAuth(authService *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token := parts[1]
				userID, err := authService.ValidateToken(token)
				if err == nil {
					user, err := authService.GetUserFromToken(token)
					if err == nil {
						c.Set("user_id", userID)
						c.Set("user", user)
						c.Set("token", token)
					}
				}
			}
		}
		c.Next()
	}
}
