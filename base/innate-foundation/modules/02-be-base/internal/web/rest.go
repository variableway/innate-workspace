package web

import (
	"net/http"
	"strconv"
	"sync"

	"github.com/gin-gonic/gin"
	vineweb "go.yorun.ai/vine/core/web"

	"github.com/variableway/innate-be-base/skeled"
)

// RestDemo implements innate.bedemo.RestDemoWeb HTTP routes.
type RestDemo struct {
	skeled.DefaultRestDemoWebServer

	Context *gin.Context `inject:""`

	once  sync.Once
	mu    sync.Mutex
	items map[int]skeled.Item
	next  int
}

func (h *RestDemo) init() {
	h.once.Do(func() {
		h.items = map[int]skeled.Item{
			1: {Id: 1, Name: "Widget", Price: 100},
			2: {Id: 2, Name: "Gadget", Price: 250},
		}
		h.next = 3
	})
}

func (h *RestDemo) Routes(router *vineweb.Router) {
	router.GET("/health", h.Health)
	router.GET("/items", h.ListItems)
	router.GET("/items/:id", h.GetItem)
	router.POST("/items", h.CreateItem)
}

func (h *RestDemo) Health() {
	h.Context.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *RestDemo) ListItems() {
	h.init()
	h.mu.Lock()
	defer h.mu.Unlock()
	out := make([]skeled.Item, 0, len(h.items))
	for _, it := range h.items {
		out = append(out, it)
	}
	h.Context.JSON(http.StatusOK, gin.H{"items": out})
}

func (h *RestDemo) GetItem() {
	h.init()
	id, err := strconv.Atoi(h.Context.Param("id"))
	if err != nil {
		h.Context.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	it, ok := h.items[id]
	if !ok {
		h.Context.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	h.Context.JSON(http.StatusOK, it)
}

type createItemBody struct {
	Name  string `json:"name"`
	Price int    `json:"price"`
}

func (h *RestDemo) CreateItem() {
	h.init()
	var body createItemBody
	if err := h.Context.ShouldBindJSON(&body); err != nil || body.Name == "" {
		h.Context.JSON(http.StatusBadRequest, gin.H{"error": "name required"})
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	id := h.next
	h.next++
	it := skeled.Item{Id: id, Name: body.Name, Price: body.Price}
	h.items[id] = it
	h.Context.JSON(http.StatusCreated, it)
}
