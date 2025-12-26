# 🔥 HOTFIX: Missing Refs Declaration

## ❌ Lỗi
```
ReferenceError: abortControllerRef is not defined
at ChatPage.tsx:110:7
```

## 🔍 Nguyên Nhân
Hai refs được sử dụng nhưng chưa được khai báo:
1. `abortControllerRef` - Dùng để cancel requests
2. `initialLoadDoneRef` - Khai báo 2 lần (duplicate)

## ✅ Giải Pháp

### Fix 1: Thêm abortControllerRef
```typescript
// Line 92: Thêm vào phần khai báo refs
const abortControllerRef = useRef<AbortController | null>(null);
```

### Fix 2: Gộp initialLoadDoneRef
```typescript
// Line 93: Khai báo 1 lần duy nhất
const initialLoadDoneRef = useRef<number | null>(null);

// Line 237-240: XÓA khai báo duplicate
// ❌ const initialLoadDoneRef = useRef<number | null>(null);
```

## 📝 Tất Cả Refs Cần Thiết

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const isMountedRef = useRef(true);
const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
const abortControllerRef = useRef<AbortController | null>(null); // ✅ NEW
const initialLoadDoneRef = useRef<number | null>(null); // ✅ MOVED
```

## ✅ Status
**Fixed:** ✅  
**File:** `fronend_web/src/pages/ChatPage.tsx`  
**Lines:** 84-93

## 🧪 Test
```bash
cd fronend_web
npm run dev
```

Mở browser → Không còn lỗi "not defined"! ✅
