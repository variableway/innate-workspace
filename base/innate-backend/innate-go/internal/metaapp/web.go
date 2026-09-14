package metaapp

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	vineweb "go.yorun.ai/vine/core/web"
)

// Routes exposes the stable Meta HTTP contract through Vine Web.
func (h *Web) Routes(router *vineweb.Router) {
	router.GET("/healthz", h.Health)
	router.GET("/api/meta/raw-requests", h.ListRawRequests)
	router.GET("/api/meta/:table", h.List)
	router.GET("/api/meta/:table/:id", h.Get)
	router.POST("/api/meta/:table", h.Create)
	router.PUT("/api/meta/:table/:id", h.Update)
	router.DELETE("/api/meta/:table/:id", h.Delete)
}

func (h *Web) Health() { h.Context.JSON(http.StatusOK, gin.H{"status": "ok"}) }

func (h *Web) List() {
	c := h.Context
	h.audit(http.MethodGet, nil)
	rows, err := h.Service.List(c, c.Param("table"))
	if err != nil {
		writeMetaError(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}

func (h *Web) Get() {
	c := h.Context
	h.audit(http.MethodGet, nil)
	row, err := h.Service.Get(c, c.Param("table"), c.Param("id"))
	if err != nil {
		writeMetaError(c, http.StatusBadRequest, err)
		return
	}
	if row == nil {
		writeMetaError(c, http.StatusNotFound, nil)
		return
	}
	c.JSON(http.StatusOK, row)
}

type writeBody struct {
	Data json.RawMessage `json:"data"`
	ID   string          `json:"id,omitempty"`
}

func (h *Web) Create() {
	c := h.Context
	var body writeBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Data) == 0 || !json.Valid(body.Data) {
		writeMetaError(c, http.StatusBadRequest, errInvalidJSON)
		return
	}
	h.audit(http.MethodPost, body.Data)
	row, err := h.Service.Create(c, c.Param("table"), body.ID, body.Data)
	if err != nil {
		writeMetaError(c, http.StatusConflict, err)
		return
	}
	c.JSON(http.StatusCreated, row)
}

func (h *Web) Update() {
	c := h.Context
	var body writeBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Data) == 0 || !json.Valid(body.Data) {
		writeMetaError(c, http.StatusBadRequest, errInvalidJSON)
		return
	}
	h.audit(http.MethodPut, body.Data)
	row, err := h.Service.Update(c, c.Param("table"), c.Param("id"), body.Data)
	if err != nil {
		writeMetaError(c, http.StatusInternalServerError, err)
		return
	}
	if row == nil {
		writeMetaError(c, http.StatusNotFound, nil)
		return
	}
	c.JSON(http.StatusOK, row)
}

func (h *Web) Delete() {
	c := h.Context
	h.audit(http.MethodDelete, nil)
	ok, err := h.Service.Delete(c, c.Param("table"), c.Param("id"))
	if err != nil {
		writeMetaError(c, http.StatusInternalServerError, err)
		return
	}
	if !ok {
		writeMetaError(c, http.StatusNotFound, nil)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Web) ListRawRequests() {
	rows, err := h.Service.ListRawRequests(h.Context, 100)
	if err != nil {
		writeMetaError(h.Context, http.StatusInternalServerError, err)
		return
	}
	h.Context.JSON(http.StatusOK, gin.H{"items": rows})
}

func (h *Web) audit(method string, body []byte) {
	_ = h.Service.LogRequest(h.Context, method, h.Context.Request.URL.Path, h.Context.Param("table"), body)
}

var errInvalidJSON = &metaError{message: "invalid JSON body"}

type metaError struct{ message string }

func (e *metaError) Error() string { return e.message }

func writeMetaError(c *gin.Context, status int, err error) {
	message := http.StatusText(status)
	if err != nil {
		message = err.Error()
	}
	c.JSON(status, gin.H{"error": gin.H{"code": status, "message": message}})
}
