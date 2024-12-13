#!/usr/bin/env sh

# Trap INT (Ctrl+C), TERM, and EXIT signals
trap 'pnpm run dev:stop:all' INT TERM EXIT

# Start tsc-watch and run the start script on success
tsc-watch -b . --onSuccess "pnpm run dev:start:all"