#!/bin/bash

echo "Stopping development servers..."
pkill -f "npm run dev" || true
pkill -f "turbo run dev" || true
pkill -f "node ace serve" || true
pkill -f "quasar dev" || true

echo "Stopping database..."
docker-compose down
if [ $? -ne 0 ]; then
    echo "Failed to stop database"
    exit 1
fi

echo "All services stopped."