# Blog API Testing Scripts

Manual testing scripts for the WordPress Blog API endpoints.

## Prerequisites

- Server running locally or deployed
- Valid API key configured in environment
- IP address whitelisted

## Usage

### Basic Usage

```bash
./scripts/blog-api-test.sh
```

### Custom Configuration

```bash
BASE_URL=https://your-site.com \
API_KEY=your-api-key \
ALLOWED_IP=your-ip \
./scripts/blog-api-test.sh
```

## Environment Variables

- `BASE_URL` - API base URL (default: http://localhost:3000)
- `API_KEY` - Your API key (default: test-api-key)
- `ALLOWED_IP` - Your whitelisted IP (default: 127.0.0.1)

## Test Cases

1. **Upload Featured Image** - Tests image upload with type=featured
2. **Upload Content Image** - Tests image upload with type=content
3. **WordPress Sync** - Tests full WordPress post synchronization
4. **Get Dynamic Posts** - Tests retrieval of synced posts

## Notes

- Requires `test-image.jpg` in scripts/ directory for image upload tests
- All tests require valid API key and whitelisted IP
- Check server logs for detailed error messages
