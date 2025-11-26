# CORS & API Path Fix

## 🔴 Critical Issues Found

### Issue 1: CORS Error
**Error**: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource"

**Cause**: Your Express backend didn't have CORS middleware enabled, so the browser blocked requests from `http://localhost:3001` (frontend) to `http://localhost:3000` (backend).

**Fix**: Added CORS to [backend/src/index.ts](file:///home/levi1604/Desktop/2ndBrain/super-brain-be/src/index.ts):
```typescript
import cors from "cors";

app.use(cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true
}));
```

---

### Issue 2: Wrong API Path
**Error**: 404 errors on all API calls

**Cause**: Backend routes are at `/api/v1/user/*` but frontend was calling `/api/*`

**Fix**: Updated frontend [lib/api.ts](file:///home/levi1604/Desktop/2ndBrain/super-brain-fe/lib/api.ts):
```typescript
baseURL: "http://localhost:3000/api/v1/user"
```

---

## ✅ Next Steps

1. **Restart your backend server** (the CORS change requires restart)
2. **Refresh the frontend** in your browser
3. **Try signup again** - should work now!

The CORS errors will be gone and API calls will reach the correct endpoints.
