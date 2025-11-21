package handler

import (
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

// FinOpsHandler gerencia endpoints de FinOps
type FinOpsHandler struct {
	*base.BaseHandler
	service *service.FinOpsService
}

// NewFinOpsHandler cria uma nova instância
func NewFinOpsHandler(
	finopsService *service.FinOpsService,
	cache *service.CacheService,
	log *logger.Logger,
) *FinOpsHandler {
	return &FinOpsHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
		service:     finopsService,
	}
}

// GetStats returns aggregated cost statistics
func (h *FinOpsHandler) GetStats(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	cacheKey := service.BuildKey("finops:stats", provider+":"+integration)

	h.WithCache(c, cacheKey, service.CacheDuration1Hour, func() (interface{}, error) {
		return h.service.GetStats(provider, integration)
	})
}

// ListCosts returns detailed cost breakdown
func (h *FinOpsHandler) ListCosts(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	costs, err := h.service.GetAllCosts(provider, integration)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Success(c, costs)
}

// ListResources returns all cloud resources
func (h *FinOpsHandler) ListResources(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	resources, err := h.service.GetAllResources(provider, integration)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Success(c, resources)
}

// GetAWSMonthlyCosts returns monthly cost data from AWS for the last year
func (h *FinOpsHandler) GetAWSMonthlyCosts(c *gin.Context) {
	cacheKey := service.BuildKey("finops:aws", "monthly")

	h.WithCache(c, cacheKey, service.CacheDuration6Hours, func() (interface{}, error) {
		return h.service.GetAWSCostsByMonth()
	})
}

// GetAWSCostsByService returns cost data grouped by AWS service
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

	h.WithCache(c, cacheKey, service.CacheDuration6Hours, func() (interface{}, error) {
		return h.service.GetAWSCostsByService(months)
	})
}

// GetAWSCostForecast returns AWS cost forecast
func (h *FinOpsHandler) GetAWSCostForecast(c *gin.Context) {
	data, err := h.service.GetAWSCostForecast()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Success(c, data)
}

// GetAWSCostsByTag returns cost data grouped by tag
func (h *FinOpsHandler) GetAWSCostsByTag(c *gin.Context) {
	tagKey := c.Query("tag")
	if tagKey == "" {
		tagKey = "Team" // Default tag
	}

	data, err := h.service.GetAWSCostsByTag(tagKey)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Success(c, data)
}

// GetAWSReservationUtilization returns Reserved Instance utilization data
func (h *FinOpsHandler) GetAWSReservationUtilization(c *gin.Context) {
	data, err := h.service.GetAWSReservationUtilization()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Success(c, data)
}

// GetAWSSavingsPlansUtilization returns Savings Plans utilization data
func (h *FinOpsHandler) GetAWSSavingsPlansUtilization(c *gin.Context) {
	data, err := h.service.GetAWSSavingsPlansUtilization()
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Success(c, data)
}

// GetCostOptimizationRecommendations returns cost optimization recommendations
func (h *FinOpsHandler) GetCostOptimizationRecommendations(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	cacheKey := service.BuildKey("finops:recommendations", provider+":"+integration)

	h.WithCache(c, cacheKey, service.CacheDuration1Hour, func() (interface{}, error) {
		return h.service.GetCostOptimizationRecommendations(provider, integration)
	})
}
