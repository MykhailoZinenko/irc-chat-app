#!/bin/bash

set -e

echo "Starting database..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "Failed to start database"
    exit 1
fi

echo "Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install root dependencies"
    exit 1
fi

echo "Installing server dependencies..."
cd apps/server
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install server dependencies"
    exit 1
fi

echo "Creating server .env file..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=irc_chat_app
EOF
fi

echo "Generating app key..."
node ace generate:key
if [ $? -ne 0 ]; then
    echo "Failed to generate app key"
    exit 1
fi

echo "Waiting for database to be ready..."
for i in {1..5}; do
    echo "Waiting... $i/5"
    sleep 1
done

echo "Running database migrations..."
node ace migration:run
if [ $? -ne 0 ]; then
    echo "Failed to run migrations"
    exit 1
fi
cd ../..

echo "Installing client dependencies..."
cd apps/client
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install client dependencies"
    exit 1
fi
cd ../..

echo "Starting development servers..."
npm run dev