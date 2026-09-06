package main

import (
	"go.yorun.ai/vine/app/standalone"

	"github.com/variableway/innate-go/samples/vine-rest/internal/application"
)

func main() {
	standalone.NewWithOption[*application.RestDemoApp](standalone.Option{
		SQLiteFile:   "./vine.sqlite",
		SeedYAMLFile: "./seed.yaml",
	}).StartAndWait()
}
