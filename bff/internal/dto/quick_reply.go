package dto

// QuickReplyItem 快捷回复项
type QuickReplyItem struct {
	ID      uint   `json:"id"`
	Content string `json:"content"`
}

// QuickReplyListResponse 快捷回复列表响应
type QuickReplyListResponse struct {
	Items []QuickReplyItem `json:"items"`
}
