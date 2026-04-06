# WordPress Blog API - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar API REST para recibir posts de WordPress, optimizar imágenes con Sharp, y servir dinámicamente desde Firebase Storage.

**Architecture:** API monolítica con dos endpoints (upload-image, wordpress-sync), middleware de seguridad, transformación WordPress → Nuxt Content, carga dinámica runtime.

**Tech Stack:** Nuxt 3, Nitro, Firebase Admin SDK, Sharp, Turndown, TypeScript

**Design Document:** `docs/plans/2026-02-14-wordpress-api-design.md`

---

## Prerequisites

Before starting implementation, review the complete design document which contains:
- Full architecture diagrams
- API specifications
- Security configuration
- Code examples
- Testing strategies

---

## Implementation Tasks

### Phase 1: Foundation (Tasks 1-3)

**Task 1: Dependencies & Config**
- Install: firebase-admin, sharp, turndown
- Update nuxt.config.ts with runtime config
- Add 1GiB memory to Firebase Functions
- Create .env.example
- Commit: "chore: install dependencies and configure runtime for blog API"

**Task 2: Core Utilities**
- Create logger.ts (structured JSON logging)
- Create error-handler.ts (BlogApiError class)
- Commit: "feat(blog-api): add structured logger and error handler"

**Task 3: Firebase Storage Client**
- Create firebase-storage.ts (upload, download, list functions)
- Implement singleton Firebase Admin app
- Commit: "feat(blog-api): add Firebase Storage client utilities"

---

### Phase 2: Business Logic (Tasks 4-5)

**Task 4: Image Optimizer**
- Create image-optimizer.ts with Sharp pipeline
- Config: featured (1920x1080, quality 85) vs content (1200px, quality 80)
- Commit: "feat(blog-api): add Sharp image optimizer utility"

**Task 5: WordPress Transformer**
- Create wordpress-to-nuxt.ts
- Implement HTML → Markdown conversion (Turndown)
- Category mapping (Guías → guias, etc.)
- Commit: "feat(blog-api): add WordPress to Nuxt Content transformer"

---

### Phase 3: Security & APIs (Tasks 6-8)

**Task 6: Security Middleware**
- Create blog-api-auth.ts middleware
- Implement IP whitelist validation
- Implement API key validation
- Implement rate limiting (100 req/hour)
- Commit: "feat(blog-api): add security middleware with rate limiting"

**Task 7: Upload Image Endpoint**
- Create server/api/blog/upload-image.post.ts
- Handle multipart/form-data
- Validate file type and size (max 10MB)
- Optimize with Sharp → Upload to Storage
- Commit: "feat(blog-api): add image upload endpoint with Sharp optimization"

**Task 8: WordPress Sync Endpoint**
- Create server/api/blog/wordpress-sync.post.ts
- Transform WordPress payload → Markdown
- Upload .md to Firebase Storage (blog-posts/)
- Commit: "feat(blog-api): add WordPress post sync endpoint"

---

### Phase 4: Dynamic Content (Tasks 9-10)

**Task 9: Content Loader Plugin**
- Create server/plugins/content-dynamic-loader.ts
- Hook into Nuxt Content lifecycle
- Implement 5-minute cache TTL
- Commit: "feat(blog-api): add dynamic content loader plugin with cache"

**Task 10: Posts Dynamic Endpoint**
- Create server/api/blog/posts-dynamic.get.ts
- Return cached dynamic posts
- Commit: "feat(blog-api): add endpoint to serve dynamic posts"

---

### Phase 5: Finalization (Tasks 11-13)

**Task 11: Update .gitignore**
- Add content-dynamic/, blog-posts/, .env to .gitignore
- Commit: "chore: update .gitignore for dynamic blog content"

**Task 12: Create Feature Branch**
- Checkout main and pull latest
- Create branch: feat/wordpress-blog-api
- Cherry-pick design commits if needed

**Task 13: Testing**
- Create docs/testing/blog-api-curl-tests.sh
- Test image upload, post sync, authentication, rate limiting
- Verify posts appear in /blog
- Commit: "test(blog-api): add cURL integration tests"

---

## File Structure

```
packages/ui-alquilatucarro/
├── server/
│   ├── api/blog/
│   │   ├── upload-image.post.ts
│   │   ├── wordpress-sync.post.ts
│   │   └── posts-dynamic.get.ts
│   ├── middleware/
│   │   └── blog-api-auth.ts
│   ├── plugins/
│   │   └── content-dynamic-loader.ts
│   └── utils/
│       ├── logger.ts
│       ├── error-handler.ts
│       ├── firebase-storage.ts
│       ├── image-optimizer.ts
│       └── wordpress-to-nuxt.ts
├── nuxt.config.ts (modified)
├── .env.example (created)
└── .gitignore (modified)

docs/
├── plans/
│   ├── 2026-02-14-wordpress-api-design.md
│   └── 2026-02-14-wordpress-blog-api-plan.md
└── testing/
    └── blog-api-curl-tests.sh
```

---

## Environment Variables

Required in `.env` (DO NOT COMMIT):

```
NUXT_FIREBASE_PROJECT_ID=
NUXT_FIREBASE_CLIENT_EMAIL=
NUXT_FIREBASE_PRIVATE_KEY=
NUXT_FIREBASE_STORAGE_BUCKET=
NUXT_BLOG_API_KEY=
NUXT_BLOG_API_ALLOWED_IPS=
```

Get values from:
- Firebase Console → Project Settings → Service Accounts
- Generate secure random key for BLOG_API_KEY
- Add server IPs to BLOG_API_ALLOWED_IPS

---

## Testing Checklist

- [ ] Image upload returns optimized WebP
- [ ] WordPress post sync creates .md in Storage
- [ ] Posts appear in /blog immediately
- [ ] Invalid API key returns 401
- [ ] Unauthorized IP returns 403
- [ ] 101st request returns 429 (rate limit)
- [ ] Cache refreshes after 5 minutes

---

## Success Criteria

1. WordPress can upload images and receive URLs
2. WordPress can create posts visible in /blog
3. Images optimized to WebP with >70% savings
4. API blocked for unauthorized IPs
5. Rate limiting prevents abuse
6. Posts persist between deploys (Firebase Storage)
7. Cache reduces latency to <50ms (cache hit)

---

## Implementation Details

For complete implementation details including:
- Full code for each file
- Exact commands and expected outputs
- Step-by-step TDD approach
- API specifications
- Security configuration

Refer to: `docs/plans/2026-02-14-wordpress-api-design.md`

---

**Estimated Time:** 3-4 hours
**Total Commits:** 13
**Dependencies:** firebase-admin, sharp, turndown
