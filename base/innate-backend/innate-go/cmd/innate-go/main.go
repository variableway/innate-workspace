package main

import (
	"os"

	"github.com/variableway/innate-go/internal/cli"
)

func main() {
	os.Exit(cli.Main(os.Args[1:]))
}
