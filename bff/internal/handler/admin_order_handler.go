package handler

import (
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var adminOrderService *service.AdminOrderService

func InitAdminOrderService() {
	adminOrderService = service.NewAdminOrderService()
}

// AdminGetOrders GET /api/admin/orders
func AdminGetOrders(c *gin.Context) {
	var req dto.AdminOrderListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminOrderService.ListOrders(&req)
	if err != nil {
		utils.InternalError(c, "获取订单列表失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetOrderSummary GET /api/admin/orders/summary
func AdminGetOrderSummary(c *gin.Context) {
	var req dto.AdminOrderListRequest
	c.ShouldBindQuery(&req)

	result, err := adminOrderService.GetOrderSummary(&req)
	if err != nil {
		utils.InternalError(c, "获取订单统计失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetTransactions GET /api/admin/transactions
func AdminGetTransactions(c *gin.Context) {
	var req dto.AdminTransactionListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminOrderService.ListTransactions(&req)
	if err != nil {
		utils.InternalError(c, "获取交易流水失败")
		return
	}
	utils.Success(c, result)
}
