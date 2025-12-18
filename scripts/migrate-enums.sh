#!/bin/bash

# Enum Migration Script for Golden Services
# This script updates enum values before applying Prisma schema changes

set -e  # Exit on error

echo "🔄 Starting enum migration..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    set -a
    source <(cat .env | grep -v '^#' | grep -v '^$' | sed 's/\r$//')
    set +a
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please check your .env file or export it manually:"
    echo "export DATABASE_URL='postgresql://username:password@localhost:5432/golden_services'"
    exit 1
fi

echo "✅ Database URL found"

# Remove Prisma-specific query parameters for psql
# psql doesn't support ?schema=public, so we need to strip it
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?schema=public//' | sed 's/?.*$//')

echo "📝 Updating existing enum values..."
psql "$PSQL_URL" -f prisma/migrations/pre-migration-enum-update.sql

if [ $? -eq 0 ]; then
    echo "✅ Enum values updated successfully"
    echo ""
    echo "🚀 Now running Prisma schema push..."
    npx prisma db push

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration completed successfully!"
        echo "🎉 Your database is now up to date"
    else
        echo ""
        echo "❌ Prisma schema push failed"
        echo "Please check the error messages above"
        exit 1
    fi
else
    echo ""
    echo "❌ Failed to update enum values"
    echo "Please check your database connection and try again"
    exit 1
fi
