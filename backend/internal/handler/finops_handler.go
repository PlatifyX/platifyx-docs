package handler

import (
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type FinOpsHandler struct {
	service *service.FinOpsService
	cache   *service.CacheService
	log     *logger.Logger
}

func NewFinOpsHandler(service *service.FinOpsService, cache *service.CacheService, log *logger.Logger) *FinOpsHandler {
	return &FinOpsHandler{
		service: service,
		cache:   cache,
		log:     log,
	}
}

// GetStats returns aggregated cost statistics
func (h *FinOpsHandler) GetStats(c *gin.Context) {
	provider := c.Query("provider")     // azure, gcp, aws, or empty for all
	integration := c.Query("integration") // specific integration name

	// Build cache key
	cacheKey := service.BuildKey("finops:stats", provider+":"+integration)

	// Try cache first
	if h.cache != nil {
		var cachedStats interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedStats); err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			c.JSON(http.StatusOK, cachedStats)
			return
		}
	}

	// Cache MISS - fetch from service
	stats, err := h.service.GetStats(provider, integration)
	if err != nil {
		h.log.Errorw("Failed to get FinOps stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store in cache (1 hour TTL for cost data)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, stats, service.CacheDuration1Hour); err != nil {
			h.log.Warnw("Failed to cache FinOps stats", "error", err)
		}
	}

	c.JSON(http.StatusOK, stats)
}

// ListCosts returns detailed cost breakdown
func (h *FinOpsHandler) ListCosts(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	costs, err := h.service.GetAllCosts(provider, integration)
	if err != nil {
		h.log.Errorw("Failed to list costs", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, costs)
}

// ListResources returns all cloud resources
func (h *FinOpsHandler) ListResources(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	resources, err := h.service.GetAllResources(provider, integration)
	if err != nil {
		h.log.Errorw("Failed to list resources", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resources)
}

// GetAWSMonthlyCosts returns monthly cost data from AWS for the last year
func (h *FinOpsHandler) GetAWSMonthlyCosts(c *gin.Context) {
	cacheKey := service.BuildKey("finops:aws", "monthly")

	// Try cache first
	if h.cache != nil {
		var cachedData interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedData); err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			c.JSON(http.StatusOK, cachedData)
			return
		}
	}

	// Cache MISS
	data, err := h.service.GetAWSCostsByMonth()
	if err != nil {
		h.log.Errorw("Failed to get AWS monthly costs", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store in cache (6 hours TTL - AWS data updates daily)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, data, service.CacheDuration6Hours); err != nil {
			h.log.Warnw("Failed to cache AWS monthly costs", "error", err)
		}
	}

	c.JSON(http.StatusOK, data)
}

// GetAWSCostsByService returns cost data grouped by AWS service for a specified period
func (h *FinOpsHandler) GetAWSCostsByService(c *gin.Context) {
	// Get months parameter from query string, default to 12
	months := 12
	if monthsParam := c.Query("months"); monthsParam != "" {
		if val, err := strconv.Atoi(monthsParam); err == nil {
			if val > 0 && val <= 12 {
				months = val
			}
		}
	}

	cacheKey := service.BuildKey("finops:aws:byservice", strconv.Itoa(months))

	// Try cache first
	if h.cache != nil {
		var cachedData interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedData); err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			c.JSON(http.StatusOK, cachedData)
			return
		}
	}

	// Cache MISS
	data, err := h.service.GetAWSCostsByService(months)
	if err != nil {
		h.log.Errorw("Failed to get AWS costs by service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store in cache (6 hours TTL)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, data, service.CacheDuration6Hours); err != nil {
			h.log.Warnw("Failed to cache AWS costs by service", "error", err)
		}
	}

	c.JSON(http.StatusOK, data)
}

// GetAWSCostForecast returns AWS cost forecast
func (h *FinOpsHandler) GetAWSCostForecast(c *gin.Context) {
	data, err := h.service.GetAWSCostForecast()
	if err != nil {
		h.log.Errorw("Failed to get AWS cost forecast", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

// GetAWSCostsByTag returns cost data grouped by tag
func (h *FinOpsHandler) GetAWSCostsByTag(c *gin.Context) {
	tagKey := c.Query("tag")
	if tagKey == "" {
		tagKey = "Team" // Default tag
	}

	data, err := h.service.GetAWSCostsByTag(tagKey)
	if err != nil {
		h.log.Errorw("Failed to get AWS costs by tag", "error", err, "tag", tagKey)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

// GetAWSReservationUtilization returns Reserved Instance utilization data
func (h *FinOpsHandler) GetAWSReservationUtilization(c *gin.Context) {
	data, err := h.service.GetAWSReservationUtilization()
	if err != nil {
		h.log.Errorw("Failed to get AWS reservation utilization", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

// GetAWSSavingsPlansUtilization returns Savings Plans utilization data
func (h *FinOpsHandler) GetAWSSavingsPlansUtilization(c *gin.Context) {
	data, err := h.service.GetAWSSavingsPlansUtilization()
	if err != nil {
		h.log.Errorw("Failed to get AWS savings plans utilization", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, data)
}

// GetCostOptimizationRecommendations returns cost optimization recommendations
func (h *FinOpsHandler) GetCostOptimizationRecommendations(c *gin.Context) {
	provider := c.Query("provider")     // aws, azure, gcp, or empty for all
	integration := c.Query("integration") // specific integration name

	// Build cache key
	cacheKey := service.BuildKey("finops:recommendations", provider+":"+integration)

	// Try cache first (1 hour TTL for recommendations)
	if h.cache != nil {
		var cachedData interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedData); err == nil {
			h.log.Debugw("Cache HIT", "key", cacheKey)
			c.JSON(http.StatusOK, cachedData)
			return
		}
	}

	// Cache MISS - fetch from service
	recommendations, err := h.service.GetCostOptimizationRecommendations(provider, integration)
	if err != nil {
		h.log.Errorw("Failed to get cost optimization recommendations", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store in cache (1 hour TTL)
	if h.cache != nil {
		if err := h.cache.Set(cacheKey, recommendations, service.CacheDuration1Hour); err != nil {
			h.log.Warnw("Failed to cache cost optimization recommendations", "error", err)
		}
	}

	c.JSON(http.StatusOK, recommendations)
}
