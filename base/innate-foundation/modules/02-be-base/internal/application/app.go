package application

import (
	"go.yorun.ai/vine/app"

	"github.com/variableway/innate-be-base/internal/web"
)

// RestDemoApp is a standalone Vine app exposing REST via Webber.
type RestDemoApp struct {
	app.Application
	app.WebberEnabled
}

func (*RestDemoApp) Name() string { return "innate.bedemo" }

func (*RestDemoApp) WebberInitHandlers(add app.TypeAdder) {
	add(app.T[*web.RestDemo]())
}
