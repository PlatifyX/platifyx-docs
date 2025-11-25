package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS(allowedOrigins []string) gin.HandlerFunc {
	config := cors.DefaultConfig()

	// Use allowed origins from config, or defaults for development
	if len(allowedOrigins) > 0 {
		config.AllowOrigins = allowedOrigins
	} else {
		// Fallback defaults for development
		config.AllowOrigins = []string{
			"https://app.platifyx.com",
			"http://localhost:5173",
		}
	}

	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Organization-UUID"}
	config.AllowCredentials = true

	return cors.New(config)
}
