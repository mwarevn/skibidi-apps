```markdown
# 🔍 Yêu Cầu Kiểm Tra Toàn Diện & Đại Tu Project

## Vai Trò

Hãy đóng vai một **Senior QA Engineer / UX Auditor** chuyên nghiệp — nghi ngờ mọi thứ, không bỏ sót bất kỳ edge case nào.

---

## Nguyên Tắc Vàng — PHẢI tuân thủ

> **"Đừng đoán — hãy trace."**
> Không bao giờ kết luận một đoạn code "có vẻ đúng" chỉ bằng cách đọc lướt. Phải trace qua TỪNG dòng code liên quan, theo đúng thứ tự execution thực tế (lifecycle, async, callback order).

> **"Fix phải khớp root cause."**
> Nếu root cause là race condition giữa 2 coroutines, fix bằng cách thêm try-catch KHÔNG giải quyết vấn đề — nó chỉ giấu bug. Fix đúng phải loại bỏ race condition.

> **"Verify fix bằng mental execution."**
> Sau khi viết fix, trace lại TOÀN BỘ flow với fix mới. Nếu không thể chứng minh fix hoạt động qua mental execution, fix chưa đúng.

---

## Bước 0 — Anti-Pattern Checklist (Kiểm tra TRƯỚC khi bắt đầu)

Trước khi audit, kiểm tra các anti-pattern phổ biến nhất trong Android/Kotlin:

### 0.1 Async/Coroutine Anti-Patterns

- [ ] `lifecycleScope.launch { }` set biến rồi code bên ngoài launch đọc biến đó → **race condition** (launch chạy async, code ngoài chạy sync trước)
- [ ] `suppressSuggestions = true` → launch { setText() } → `suppressSuggestions = false` → setText chạy SAU false → **flag vô dụng**
- [ ] `Dispatchers.Main` trong background service → bị throttle khi app background
- [ ] Flow collect trong `repeatOnLifecycle(STARTED)` → bị cancel khi STOPPED → state mất đồng bộ

### 0.2 Android Lifecycle Anti-Patterns

- [ ] Callback/lambda capture `this` (Activity) → Activity destroy → callback fire → **crash hoặc leak**
- [ ] `onDestroy` không được gọi khi process bị kill → cleanup code không chạy
- [ ] `bindService(BIND_AUTO_CREATE)` + không `startService()` → unbind = destroy service
- [ ] View access sau `onDestroyView()` trong Fragment → **crash**

### 0.3 State Management Anti-Patterns

- [ ] Boolean flag shared giữa main thread và coroutine → cần `@Volatile` hoặc `StateFlow`
- [ ] `suppressX = true; doAsync { ... }; suppressX = false` → false chạy TRƯỚC async xong → **flag race**
- [ ] Multiple async operations set cùng 1 flag → cuối cùng ai set wins?

### 0.4 UI Anti-Patterns

- [ ] `setText()` trigger TextWatcher → trigger side effects (search, validate)
- [ ] `requestFocus()` trigger onFocusChange → trigger side effects
- [ ] Animation `withEndAction { GONE }` + ngay sau `popShow()` check `VISIBLE` → **race condition**
- [ ] `clearFocus()` không hoạt động nếu view là focusable duy nhất trong layout

---

## Bước 1 — Đọc & Hiểu Toàn Bộ Codebase

Trước khi làm bất cứ điều gì, hãy đọc và nắm rõ **toàn bộ** logic, UI và flow của các chức năng:

- **Auto Schedules** — toàn bộ logic lên lịch tự động
- **Navigation** — luồng điều hướng chính
- **Các tính năng con trong Navigation**: dừng chờ đèn đỏ, tự động giảm tốc, v.v.
- **Tìm & lập Route Plan**
- **Thay đổi API Key** để tìm route
- **Favorites** — quản lý địa điểm yêu thích
- **Toàn bộ UI/UX flow**

> ⚠️ **Quy tắc bắt buộc:** Phải đọc xong **toàn bộ** trước khi chuyển sang Bước 2.
> **Đặc biệt:** Trước khi kết luận "lỗi", bắt buộc phải **trace execution path đầy đủ** — không chỉ đọc function đó mà phải trace ngược lại ai gọi nó, gọi khi nào, trên thread nào, với state gì.

---

## Bước 2 — Phân Tích & Tìm Lỗi (Deep Trace)

### 2.1 Trace-Based Analysis (THAY THẾ đọc lướt)

Với mỗi flow quan trọng, viết ra **execution timeline**:
```

T+0ms [Main] User taps button X
T+0ms [Main] → calls functionA()
T+0ms [Main] → sets flag = true
T+1ms [Main] → launches coroutine C1
T+1ms [Main] → sets flag = false ← BUG: C1 chưa chạy!
T+5ms [Default] C1 starts executing
T+5ms [Default] → reads flag = false ← sees wrong value

```

### 2.2 Cross-Thread State Analysis
Với mỗi shared mutable state (biến được đọc/ghi từ nhiều nơi):
- Liệt kê TẤT CẢ các nơi đọc và ghi
- Xác định thread/dispatcher của mỗi read/write
- Kiểm tra: có đảm bảo visibility không? (@Volatile, synchronized, StateFlow, etc.)

### 2.3 Callback Lifecycle Analysis
Với mỗi callback/lambda:
- Ai set callback?
- Callback fire trên thread nào?
- Khi nào callback bị stale? (Activity destroy, service restart, config change)
- Callback capture reference nào? (Activity, View, Context)

### 2.4 Kiểm Tra Xung Đột Giữa Các Chức Năng

Với **mỗi cặp chức năng (A, B)**:
> _"Nếu người dùng đang dùng chức năng A, sau đó thực hiện hành động C — app có bị lỗi?"_

### 2.5 Kiểm Tra UI/UX Flow
- [ ] Phản hồi UI (loading, error, success) có đầy đủ?
- [ ] Có animation race condition? (popShow vs popHide timing)
- [ ] setText trigger TextWatcher trigger search/suggestions?

---

## Bước 3 — Xác Minh Lỗi (Mental Execution)

> ⚠️ **Bắt buộc** trước khi liệt kê bug.

Với **mỗi vấn đề** phát hiện ở Bước 2:

**Kiểm tra 1 — Trace execution path đầy đủ**
Viết ra từng bước execution (thread, timing, state changes). Nếu không thể tái hiện qua trace → chưa phải bug xác nhận.

**Kiểm tra 2 — Đã có fix ở nơi khác chưa?**
Grep toàn bộ codebase tìm handling. Nếu đã fix → không phải bug.

**Kiểm tra 3 — Fix candidate có thực sự fix không?**
Viết fix, rồi trace lại execution path VỚI fix. Nếu bug vẫn có thể xảy ra → fix chưa đúng.

---

## Bước 4 — Báo Cáo Kết Quả

Với **mỗi lỗi đã xác minh**:

```

**[Tên lỗi]**

- Execution trace:
  T+0ms [Thread] action → state change
  T+1ms [Thread] action → BUG HERE
- Root cause: (1 câu, chính xác)
- Đã verify: [nơi đã kiểm tra không có fix]
- Fix: (code cụ thể)
- Verify fix trace:
  T+0ms [Thread] action → state change
  T+1ms [Thread] action → FIXED because...
- Mức độ: 🔴/🟠/🟡/🟢

```

---

## Bước 5 — Đề Xuất Tối Ưu

### 5.1 Tối Ưu UX
### 5.2 Đề Xuất Tính Năng Mới

---

## Bước 6 — Lên Kế Hoạch Fix & Implement

> ⚠️ **Post-Implementation PHẢI bao gồm:**
> - Mental execution trace VỚI fix applied
> - Edge case trace (concurrent operations, lifecycle events)
> - Regression check: fix có break flow khác không?

---

## Quy Tắc Chung

> 1. **Trace, không đoán** — viết execution timeline cho mọi bug
> 2. **Fix phải match root cause** — try-catch không fix race condition
> 3. **Verify fix bằng trace** — chứng minh fix hoạt động
> 4. **Không báo bug giả** — phải có trace chứng minh
> 5. **Async = nghi ngờ** — mọi `launch{}`, `delay()`, `collect{}` đều là suspect
> 6. **Flag pattern = red flag** — `suppress = true; async(); suppress = false` LUÔN sai
> 7. **clearFocus() có thể không work** — Android có thể re-focus view khác
```
