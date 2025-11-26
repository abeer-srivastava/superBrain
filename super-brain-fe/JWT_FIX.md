# JWT Token Fix

## 🔴 Problem
Error: `"the auth header Bearer [object Object]"` and `"jwt malformed"`

**Root Cause**: 
1. Backend auth middleware was trying to verify the entire "Bearer TOKEN" string instead of extracting just the token
2. Frontend was sending token as object instead of string

---

## ✅ Fixes Applied

### Backend: Auth Middleware
Updated [middlewares/auth.ts](file:///home/levi1604/Desktop/2ndBrain/super-brain-be/src/middlewares/auth.ts):

```typescript
// Extract token from "Bearer TOKEN" format
const token = authHeader.substring(7); // Remove "Bearer " prefix
const decoded = jwt.verify(token, JWT_Password);
```

### Frontend: API Client  
Updated [lib/api.ts](file:///home/levi1604/Desktop/2ndBrain/super-brain-fe/lib/api.ts):

```typescript
// Handle backend returning token as plain string
const token = typeof response.data === 'string' ? response.data : response.data.token;
```

---

## 🎯 Next Steps

**You MUST restart your backend server** for the auth middleware changes to take effect:

```bash
# Stop current backend (Ctrl+C)
# Then restart:
npm run dev
```

Then try signup/signin again - should work now!
