.PHONY: install gen build run smoke clean

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
export PATH := $(shell go env GOPATH)/bin:$(PATH)

install:
	bash "$(ROOT)/scripts/install-vine.sh" --with-go

gen:
	skelc check --skel-in "$(ROOT)/skel"
	skelc gen go --skel-in "$(ROOT)/skel" --go-out "$(ROOT)/skeled"

build: gen
	cd "$(ROOT)" && go build -o "$(ROOT)/bin/rest-demo" ./cmd/rest-demo

run: build
	cd "$(ROOT)" && ./bin/rest-demo

smoke:
	curl -sf http://127.0.0.1:18081/health && echo
	curl -sf http://127.0.0.1:18081/items && echo

clean:
	rm -rf "$(ROOT)/bin" "$(ROOT)/vine.sqlite"*
