# Vercel Hobby Deployment Fixes

## Issues Fixed

### 1. **Missing Runtime Configuration**
Added to all order-related API routes:
- `export const dynamic = "force-dynamic"` - Prevents static optimization
- `export const runtime = "nodejs"` - Ensures Node.js runtime
- `export const maxDuration = 10` - Explicit timeout for Vercel Hobby (10 seconds max)

**Files Modified:**
- `/src/app/api/orders/route.ts`
- `/src/app/api/orders/[id]/route.ts`
- `/src/app/api/orders/[id]/items/[itemId]/route.ts`

### 2. **Caching Issues**
Changed caching headers from:
```typescript
"Cache-Control": "s-maxage=60, stale-while-revalidate=300"
```
To:
```typescript
"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
```

This ensures Vercel's edge network doesn't serve stale data for order listings.

### 3. **Missing Revalidation**
Added `revalidatePath()` calls after all update operations:
- After updating order status (PUT `/api/orders/[id]`)
- After updating item status (PATCH `/api/orders/[id]/items/[itemId]`)

This triggers Next.js to refresh cached data when orders are modified.

### 4. **Database Query Timeouts**
Added MongoDB query timeouts:
```typescript
.maxTimeMS(8000) // 8 second timeout (leaves 2s for processing)
```

This prevents the 10-second Vercel function timeout from being exceeded.

### 5. **Database Connection Optimization**
Enhanced MongoDB connection pooling for serverless:
```typescript
{
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 8000,
  connectTimeoutMS: 8000,
}
```

## Additional Recommendations

### 1. **Add Database Indexes**
Create indexes to speed up queries (especially important on Vercel):

```typescript
// In your Order model
orderSchema.index({ storeKey: 1, status: 1 });
orderSchema.index({ name: 1 });
orderSchema.index({ processedAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ shopifyId: 1 });
```

### 2. **Monitor Function Execution Time**
Add timing logs to identify slow queries:

```typescript
const startTime = Date.now();
// ... your code
console.log(`Query took: ${Date.now() - startTime}ms`);
```

### 3. **Check Vercel Logs**
View real-time logs on Vercel:
```bash
vercel logs --follow
```

### 4. **Environment Variables**
Ensure these are set in Vercel dashboard:
- `MONGODB_URI` - Your MongoDB connection string
- `MONGODB_DB` - Database name (optional, defaults to "flyscreen")
- `JWT_SECRET` - For authentication
- Any other required environment variables

### 5. **Reduce Payload Size**
Consider pagination limits:
- Current default: 10 items per page
- Don't fetch unnecessary fields in `.select()`
- Use projection to exclude large nested documents

### 6. **Add Error Handling for Timeouts**
Wrap queries in try-catch to handle timeouts gracefully:

```typescript
try {
  const orders = await OrderModel.find(filterQuery)
    .maxTimeMS(8000)
    .exec();
} catch (error) {
  if (error.name === 'MongoServerError' && error.code === 50) {
    return NextResponse.json(
      { error: "Query timeout - please try with fewer filters" },
      { status: 504 }
    );
  }
  throw error;
}
```

## Testing on Vercel

1. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Fix Vercel serverless issues with orders"
   git push
   ```

2. **Check deployment:**
   - Visit your Vercel dashboard
   - Monitor function execution times
   - Check logs for errors

3. **Test the following:**
   - Listing orders with various filters
   - Updating order status
   - Updating item status
   - Check if changes reflect immediately

## Common Vercel Hobby Limitations

- **Function Timeout:** 10 seconds (cannot be increased on Hobby)
- **No cron jobs** (use Vercel Cron on Pro plan or external service)
- **Limited concurrent executions**
- **1 day function logs retention**

## If Issues Persist

1. **Check MongoDB Atlas:**
   - Ensure M0 (free tier) isn't throttling
   - Verify network access allows Vercel's IP ranges
   - Check connection limits

2. **Simplify Queries:**
   - Remove complex `$and` conditions if timeout occurs
   - Implement pagination with smaller page sizes
   - Cache filter results in memory (with TTL)

3. **Consider Upgrade:**
   - Vercel Pro: 60-second function timeout
   - Or use separate API server for complex queries

## Debugging Checklist

- [ ] Environment variables set correctly in Vercel
- [ ] MongoDB connection string works from Vercel
- [ ] Database indexes created
- [ ] No console errors in Vercel logs
- [ ] Frontend correctly calls API endpoints
- [ ] Authentication tokens valid
- [ ] CORS not blocking requests (if frontend is separate domain)
