package dto

// ==================== 邀请管理 ====================

// AdminReferralStatsResponse 邀请统计概览
type AdminReferralStatsResponse struct {
	TotalReferrals     int64                  `json:"total_referrals"`
	TotalRewardsPoints int64                  `json:"total_rewards_points"`
	TodayReferrals     int64                  `json:"today_referrals"`
	TodayRewardsPoints int64                  `json:"today_rewards_points"`
	ActiveReferralRate float64                `json:"active_referral_rate"`
	TopReferrers       []AdminTopReferrerItem `json:"top_referrers"`
}

// AdminTopReferrerItem Top邀请人
type AdminTopReferrerItem struct {
	UserID        uint   `json:"user_id"`
	Email         string `json:"email"`
	Nickname      string `json:"nickname"`
	ReferralCount int64  `json:"referral_count"`
	TotalEarned   int64  `json:"total_earned"`
}

// AdminReferralListRequest 邀请关系列表请求
type AdminReferralListRequest struct {
	AdminPaginationRequest
	ReferrerEmail string `form:"referrer_email"`
	RefereeEmail  string `form:"referee_email"`
	StartDate     string `form:"start_date"`
	EndDate       string `form:"end_date"`
}

// AdminReferralListItem 邀请关系列表项
type AdminReferralListItem struct {
	ID                   uint   `json:"id"`
	ReferrerID           uint   `json:"referrer_id"`
	ReferrerEmail        string `json:"referrer_email"`
	ReferrerNickname     string `json:"referrer_nickname"`
	RefereeID            uint   `json:"referee_id"`
	RefereeEmail         string `json:"referee_email"`
	RefereeNickname      string `json:"referee_nickname"`
	RefereeStatus        int8   `json:"referee_status"`
	RefereeTotalConsumed int64  `json:"referee_total_consumed"`
	SignupReward         int64  `json:"signup_reward"`
	FirstRechargeReward  int64  `json:"first_recharge_reward"`
	TotalReward          int64  `json:"total_reward"`
	CreatedAt            string `json:"created_at"`
}

// AdminReferrerDetailResponse 邀请人详情
type AdminReferrerDetailResponse struct {
	Referrer      AdminReferrerInfo      `json:"referrer"`
	Referees      []AdminRefereeItem     `json:"referees"`
	TotalReferees int64                  `json:"total_referees"`
	Page          int                    `json:"page"`
	PageSize      int                    `json:"page_size"`
}

// AdminReferrerInfo 邀请人信息
type AdminReferrerInfo struct {
	UserID              uint   `json:"user_id"`
	Email               string `json:"email"`
	Nickname            string `json:"nickname"`
	InviteCode          string `json:"invite_code"`
	TotalReferrals      int64  `json:"total_referrals"`
	TotalEarned         int64  `json:"total_earned"`
	SignupRewardsTotal  int64  `json:"signup_rewards_total"`
	RechargeRewardsTotal int64 `json:"recharge_rewards_total"`
}

// AdminRefereeItem 被邀请人项
type AdminRefereeItem struct {
	RefereeID           uint                        `json:"referee_id"`
	Email               string                      `json:"email"`
	Status              int8                         `json:"status"`
	RegisteredAt        string                      `json:"registered_at"`
	TotalConsumed       int64                       `json:"total_consumed"`
	TotalRecharged      int64                       `json:"total_recharged"`
	SignupReward        int64                       `json:"signup_reward"`
	FirstRechargeReward int64                       `json:"first_recharge_reward"`
	RewardTransactions  []AdminReferralTransaction  `json:"reward_transactions"`
}

// AdminReferralTransaction 邀请相关交易
type AdminReferralTransaction struct {
	ID          uint   `json:"id"`
	Type        string `json:"type"`
	Amount      int64  `json:"amount"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
}

// AdminReferrerDetailRequest 邀请人详情请求
type AdminReferrerDetailRequest struct {
	AdminPaginationRequest
}
