#!/bin/bash

echo "Starting Laravel Service..."

# Check PHP version
PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
echo "PHP version: $PHP_VERSION"

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    echo "⚠️  Composer not found. Trying local composer..."
    
    # Try to use local composer if available
    if [ -f "/tmp/composer" ]; then
        COMPOSER="php /tmp/composer"
        echo "Using local composer"
    else
        echo "Cannot find composer. Please install it first."
        exit 1
    fi
else
    COMPOSER="composer"
    echo "Composer found"
fi

# Install dependencies if vendor folder doesn't exist
if [ ! -d "vendor" ]; then
    echo "Installing dependencies..."
    $COMPOSER install --no-interaction --prefer-dist
else
    echo "Dependencies already installed"
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs

# Set permissions
chmod -R 777 bootstrap/cache storage

# Clear cach
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
echo "PHP RUN"
# Start server
php artisan serve --host=0.0.0.0 --port=8080
