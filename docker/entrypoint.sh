#!/bin/sh

set -e

echo "Running migrations..."
npm run migration:run


echo "Starting NestJS..."
exec npm run start:dev