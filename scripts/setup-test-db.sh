#!/bin/bash

# This script creates a test database for running the tests
# You may need to modify the MySQL credentials to match your environment

MYSQL_USER="root"
MYSQL_PASSWORD=""  # Add your MySQL password here if needed
TEST_DB_NAME="todo_test_db"

# Create the test database if it doesn't exist
echo "Creating test database if it doesn't exist..."
mysql -u $MYSQL_USER $([ -n "$MYSQL_PASSWORD" ] && echo "-p$MYSQL_PASSWORD") -e "CREATE DATABASE IF NOT EXISTS $TEST_DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Confirm database creation
if [ $? -eq 0 ]; then
  echo "Test database '$TEST_DB_NAME' created successfully!"
  echo "Ready to run tests with: npm test"
else
  echo "Error creating test database. Please check your MySQL credentials."
  exit 1
fi 