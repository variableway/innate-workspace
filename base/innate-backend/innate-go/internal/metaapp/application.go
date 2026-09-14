package metaapp

import (
	"github.com/gin-gonic/gin"
	"os"
	"path/filepath"

	"github.com/variableway/innate-go/internal/meta"
	"github.com/variableway/innate-go/internal/metaapp/skeled"
	"github.com/variableway/innate-go/internal/store"
	"go.yorun.ai/vine/app"
	"go.yorun.ai/vine/core/di"
	"go.yorun.ai/vine/util/vpre"
)

// App is the Vine application exposing the Meta CRUD domain.
type App struct {
	app.Application
	app.WebberEnabled
}

// Name returns the stable Vine application name.
func (*App) Name() string { return "innate.meta" }

// InitComponents registers the domain store component.
func (*App) InitComponents(add app.TypeAdder) { add(app.T[*StoreComponent]()) }

// WebberInitHandlers registers the generated Meta Web handler.
func (*App) WebberInitHandlers(add app.TypeAdder) { add(app.T[*Web]()) }

// StoreComponent owns the SQLite persistence used by the development domain.
type StoreComponent struct {
	app.BaseModule
	Store   *store.Store
	Service *meta.Service
}

// DIInit opens the domain store during application assembly.
func (c *StoreComponent) DIInit() {
	path := os.Getenv("INNATE_META_DB")
	if path == "" {
		path = filepath.Join("data", "meta.sqlite")
	}
	st, err := store.Open(path)
	vpre.CheckNilError(err, "open meta store")
	c.Store = st
	c.Service = meta.NewService(st)
}

// Bind publishes the domain service to Web/Rpc handlers.
func (c *StoreComponent) Bind(b *di.Binder) {
	b.Bind(di.T[*meta.Service]()).ToInstance(c.Service)
}

// Web is the HTTP adapter for the Meta domain.
type Web struct {
	skeled.DefaultMetaCrudWebServer
	Service *meta.Service `inject:""`
	Context *gin.Context  `inject:""`
}
