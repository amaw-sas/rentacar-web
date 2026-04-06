#!/bin/bash

# Blog API Manual Testing Script
# Usage: ./scripts/blog-api-test.sh

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-test-api-key}"
ALLOWED_IP="${ALLOWED_IP:-127.0.0.1}"

echo "==================================="
echo "Blog API Manual Testing"
echo "==================================="
echo "Base URL: $BASE_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: Upload Image (Featured)
echo "Test 1: Upload Featured Image"
echo "-------------------------------"
if [ -f "scripts/test-image.jpg" ]; then
  curl -X POST "$BASE_URL/api/blog/upload-image" \
    -H "X-API-Key: $API_KEY" \
    -H "X-Forwarded-For: $ALLOWED_IP" \
    -F "file=@scripts/test-image.jpg" \
    -F "type=featured"
  echo -e "\n"
else
  echo "Skipped: test-image.jpg not found"
  echo ""
fi

# Test 2: Upload Image (Content)
echo "Test 2: Upload Content Image"
echo "-----------------------------"
if [ -f "scripts/test-image.jpg" ]; then
  curl -X POST "$BASE_URL/api/blog/upload-image" \
    -H "X-API-Key: $API_KEY" \
    -H "X-Forwarded-For: $ALLOWED_IP" \
    -F "file=@scripts/test-image.jpg" \
    -F "type=content"
  echo -e "\n"
else
  echo "Skipped: test-image.jpg not found"
  echo ""
fi

# Test 3: WordPress Sync
echo "Test 3: WordPress Post Sync"
echo "----------------------------"
curl -X POST "$BASE_URL/api/blog/wordpress-sync" \
  -H "X-API-Key: $API_KEY" \
  -H "X-Forwarded-For: $ALLOWED_IP" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "title": { "rendered": "Test Blog Post" },
    "content": { "rendered": "<p>This is test content</p>" },
    "excerpt": { "rendered": "<p>Test excerpt</p>" },
    "slug": "test-blog-post",
    "date": "2026-02-14T10:00:00",
    "modified": "2026-02-14T10:00:00",
    "_embedded": {
      "wp:featuredmedia": [{
        "source_url": "https://example.com/image.jpg",
        "alt_text": "Test image"
      }],
      "wp:term": [
        [{ "name": "Guías" }],
        [{ "name": "test" }]
      ]
    }
  }'
echo -e "\n"

# Test 4: Get Dynamic Posts
echo "Test 4: Get Dynamic Posts"
echo "-------------------------"
curl -X GET "$BASE_URL/api/blog/posts-dynamic"
echo -e "\n"

echo "==================================="
echo "Testing Complete"
echo "==================================="
