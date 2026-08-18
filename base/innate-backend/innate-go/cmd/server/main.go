package main

import (
	"os"

	"github.com/variableway/innate-go/internal/cli"
)

func main() {
	// preserve "go run ./cmd/server" as meta server
	os.Exit(cli.Main(append([]string{"server", "meta"}, os.Args[1:]...)))
}
