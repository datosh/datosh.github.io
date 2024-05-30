#!/bin/bash
VERSION='v1.0.0'
curl -L https://github.com/datosh/goinvaders/releases/download/${VERSION}/goinvaders.wasm > static/goinvaders/goinvaders.wasm
curl -L https://github.com/datosh/goinvaders/releases/download/${VERSION}/wasm_exec.js > static/goinvaders/wasm_exec.js
