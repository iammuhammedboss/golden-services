@echo off
REM Enum Migration Script for Golden Services (Windows)
REM This script updates enum values before applying Prisma schema changes

echo Starting enum migration...
echo.

REM Run the pre-migration SQL script
echo Updating existing enum values...
psql -f prisma/migrations/pre-migration-enum-update.sql

if %errorlevel% equ 0 (
    echo Enum values updated successfully
    echo.
    echo Now running Prisma schema push...
    call npx prisma db push

    if %errorlevel% equ 0 (
        echo.
        echo Migration completed successfully!
        echo Your database is now up to date
    ) else (
        echo.
        echo Prisma schema push failed
        echo Please check the error messages above
        exit /b 1
    )
) else (
    echo.
    echo Failed to update enum values
    echo Please check your database connection and try again
    exit /b 1
)
