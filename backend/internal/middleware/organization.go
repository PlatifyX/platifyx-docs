package middleware

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

func OrganizationMiddleware(orgRepo *repository.OrganizationRepository, userOrgRepo *repository.UserOrganizationRepository, log *logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgUUID := c.GetHeader("X-Organization-UUID")
		if orgUUID == "" {
			orgUUID = c.Query("organization")
		}

		if orgUUID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Organization UUID is required. Provide it via X-Organization-UUID header or organization query parameter",
			})
			c.Abort()
			return
		}

		org, err := orgRepo.GetByUUID(orgUUID)
		if err != nil {
			log.Errorw("Organization not found", "uuid", orgUUID, "error", err)
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Organization not found",
			})
			c.Abort()
			return
		}

		userID, exists := c.Get("user_id")
		if exists {
			userOrg, err := userOrgRepo.GetByUserAndOrganization(userID.(string), orgUUID)
			if err != nil {
				log.Errorw("Failed to check user organization access", "error", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to verify organization access",
				})
				c.Abort()
				return
			}

			if userOrg == nil {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "User does not have access to this organization",
				})
				c.Abort()
				return
			}

			c.Set("organization_role", userOrg.Role)
		}

		c.Set("organization_uuid", orgUUID)
		c.Set("organization", org)

		c.Next()
	}
}

func OptionalOrganizationMiddleware(orgRepo *repository.OrganizationRepository, log *logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		orgUUID := c.GetHeader("X-Organization-UUID")
		if orgUUID == "" {
			orgUUID = c.Query("organization")
		}

		if orgUUID != "" {
			org, err := orgRepo.GetByUUID(orgUUID)
			if err == nil && org != nil {
				c.Set("organization_uuid", orgUUID)
				c.Set("organization", org)
			}
		}

		c.Next()
	}
}


