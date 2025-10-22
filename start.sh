#!/bin/bash

set -e

echo "Starting database..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "Failed to start database"
    exit 1
fi

echo "Waiting for database to be ready..."
for i in {1..5}; do
    echo "Waiting... $i/5"
    sleep 1
done

echo "Starting development servers..."
npm run dev