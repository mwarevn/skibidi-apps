---
name: qa-audit
version: 2.0.0
description: >
    AI Agent kiểm thử toàn diện dự án: scan logic/flow, UI/UX, chạy test tự động,
    in log đầy đủ, tự học sau mỗi lỗi, tự tối ưu. Trigger khi user nói:
    "kiểm thử dự án", "test project", "audit", "review code", "tìm lỗi", "fix bug",
    "scan tính năng", "check UI/UX", "run test", "chạy test", "in log", hoặc bất kỳ
    yêu cầu kiểm tra/sửa code nào. LUÔN đọc skill này TRƯỚC khi làm bất cứ điều gì.
self_learning: true
self_optimize: true
ask_when_blocked: true
---

# 🤖 AI QA Agent — Kiểm Thử Dự Án Toàn Diện v2.0

---

## ⚡ Hai Quy Tắc Tuyệt Đối

> **Quy tắc 1 — Hỏi ngay khi thiếu thông tin.**
> Không đoán mò. Thiếu requirement, thiếu context, thiếu expected output → hỏi
> user ngay lập tức. Không tiến thêm bước nào trước khi có đủ thông tin.

> **Quy tắc 2 — Tự học sau mỗi lần sai.**
> Mỗi khi phát hiện output sai, test fail, hoặc logic lỗi → ghi vào
> [LEARNING LOG] → điều chỉnh approach → chạy lại. Không lặp lại cùng một
> sai lầm 2 lần.

---

## 📋 PRE-FLIGHT — Thu Thập Thông Tin (BẮT BUỘC TRƯỚC MỌI THỨ)

### ✅ Checklist thông tin cần có TRƯỚC khi bắt đầu

Nếu bất kỳ mục nào dưới đây CHƯA biết → **DỪNG và hỏi user ngay**:

```
[ ] 1. PROJECT TYPE: Web app / Mobile / CLI / API / Library / khác?
[ ] 2. TECH STACK: Ngôn ngữ, framework, runtime version?
[ ] 3. ENTRY POINT: File/command để chạy project?
[ ] 4. REQUIREMENTS: Tính năng nào phải làm gì? Expected outputs là gì?
[ ] 5. TEST FRAMEWORK: Có sẵn (Jest/Pytest/JUnit/...) hay viết manual tests?
[ ] 6. ENV/CONFIG: Biến môi trường, config file cần thiết?
[ ] 7. TEST DATA: Có sample data / fixtures / mock data không?
[ ] 8. KNOWN ISSUES: User đã biết bug gì chưa?
```

**Format hỏi user:**

```
🔍 Tôi cần thêm thông tin để kiểm thử chính xác:

1. [Câu hỏi cụ thể #1]
2. [Câu hỏi cụ thể #2]
...

Vui lòng trả lời để tôi bắt đầu kiểm thử.
```

### Scope Lock

Sau khi có đủ thông tin, thông báo scope:

```
📋 AUDIT SCOPE v2.0
══════════════════════════════════════════════
Project:     [tên + type]
Stack:       [tech stack]
Sẽ kiểm:    [danh sách tính năng/modules]
Bỏ qua:     [node_modules, build, generated, ...]
Test mode:   [automated / manual / hybrid]
Log level:   [VERBOSE / INFO / ERROR]
══════════════════════════════════════════════
Bắt đầu? (Y) hoặc điều chỉnh scope?
```

---

## PHASE 0 — Project Inventory (BẮT BUỘC)

### 0.1 — Scan cấu trúc dự án

```bash
# Chạy lệnh này để có cái nhìn tổng quan
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/build/*" \
  -not -path "*/dist/*" \
  -not -path "*/__pycache__/*" \
  | sort
```

Output mẫu cần đạt:

```
project/
├── src/
│   ├── [modules...]
├── tests/
│   ├── [test files...]
├── package.json / requirements.txt / ...
└── README.md
```

### 0.2 — Đọc từng file theo dependency order

Thứ tự: `types/models` → `utils/helpers` → `services/logic` → `controllers/routes` → `UI/views`

Với mỗi file ghi lại:

```
FILE: [path]
  Mục đích:    [làm gì?]
  State:       [biến/flag nào được giữ?]
  Input:       [nhận gì vào?]
  Output:      [trả ra gì?]
  Async:       [có async operation không?]
  Side effects:[setText, setState, emit, db write...]
  Dependencies:[phụ thuộc file/module nào?]
```

### 0.3 — Tạo Feature Map

Liệt kê TẤT CẢ tính năng, mỗi tính năng ghi:

```
FEATURE: [tên]
  Entry:        [user action / API endpoint / event]
  Flow:         step1 → step2 → step3 → output
  Expected out: [kết quả đúng phải là gì]
  Edge cases:   [trường hợp đặc biệt]
  Tested:       [ ] Chưa / [x] Đã test
```

### 0.4 — Global State Map

```
STATE: [tên biến]
  Tạo bởi:   [file:line]
  Ghi bởi:   [file:line, context]
  Đọc bởi:   [file:line, context]
  Sync:       [mechanism / none ← suspect nếu none]
```

### 0.5 — Feature Interaction Matrix

| Feature A | Feature B | Dùng đồng thời? | Conflict tiềm năng? |
| --------- | --------- | --------------- | ------------------- |
| ...       | ...       | Có/Không        | [mô tả / None]      |

---

## PHASE 1 — Logic & Flow Audit

### 1.1 — Kiểm tra từng tính năng

Với mỗi feature trong Feature Map:

```
🔍 SCANNING: [Feature Name]
══════════════════════════════════
Flow trace:
  INPUT:  [data/action vào]
  STEP 1: [function/handler] → [output của step]
  STEP 2: [function/handler] → [output của step]
  ...
  OUTPUT: [kết quả cuối]

Expected: [requirement nói gì]
Actual:   [code thực tế làm gì]
Match:    ✅ / ❌ [nếu không match → ghi vào BUG LIST]
══════════════════════════════════
```

### 1.2 — Anti-Pattern Checklist

**Async/Concurrency:**

- [ ] Race condition: `flag=true` → async → `flag=false` (không await)
- [ ] Data race: shared state đọc/ghi từ nhiều threads không có sync
- [ ] Dangling reference: callback capture biến đã bị destroy
- [ ] Last-write-wins: nhiều async cùng update một state

**State Management:**

- [ ] Infinite loop: UI update → side effect → trigger UI update lại
- [ ] Stale state: đọc state trước khi async hoàn tất
- [ ] Suppress fail: `suppress=true; async_op(); suppress=false` (async chạy sau)

**Error Handling:**

- [ ] Uncaught exception path
- [ ] Missing null/undefined check
- [ ] Swallowed errors (empty catch block)
- [ ] Missing loading/error state trong UI

**Business Logic:**

- [ ] Off-by-one errors
- [ ] Missing validation (input, boundary)
- [ ] Wrong calculation / formula
- [ ] Missing authorization check
- [ ] Data transformation loss

### 1.3 — Execution Timeline (mỗi suspect)

```
T+0ms  [Context]  Action
T+Xms  [Context]  → function() called
T+Xms  [Context]  → state change
T+Xms  [Context]  → ⚠️ BUG: [lý do cụ thể]
```

---

## PHASE 2 — UI/UX Audit

> ⚠️ Chỉ áp dụng cho dự án có giao diện (Web, Mobile, Desktop).
> Nếu là pure API/CLI → bỏ qua phase này, ghi "N/A".

### 2.1 — Visual Consistency

```
🎨 UI AUDIT: [Screen/Component Name]
══════════════════════════════════════
[ ] Layout đúng với design/mockup không?
[ ] Font sizes, colors, spacing consistent?
[ ] Responsive? (Mobile/Tablet/Desktop)
[ ] Dark mode / Light mode hoạt động?
[ ] Icons/images load đúng?
[ ] Z-index / overlap issues?
══════════════════════════════════════
```

### 2.2 — Interaction & Flow

```
[ ] Button/CTA có feedback khi click không? (loading, disabled state)
[ ] Form validation: error messages rõ ràng?
[ ] Navigation flow đúng không? (breadcrumb, back button, deep link)
[ ] Modal/Drawer open/close đúng?
[ ] Scroll behavior đúng?
[ ] Keyboard navigation / Tab order?
[ ] Touch targets đủ lớn (≥44px) trên mobile?
```

### 2.3 — Loading & Error States

```
[ ] Loading skeleton / spinner hiển thị khi fetch data?
[ ] Empty state có message hữu ích không?
[ ] Error state: có message + action để retry không?
[ ] Network offline: có graceful degradation không?
[ ] Timeout handling?
```

### 2.4 — Accessibility (a11y)

```
[ ] alt text cho images?
[ ] aria-label cho interactive elements?
[ ] Color contrast đủ (≥4.5:1 cho text thường)?
[ ] Screen reader friendly?
[ ] Focus visible khi tab?
```

### 2.5 — Performance UX

```
[ ] First contentful paint < 2s?
[ ] Interaction to Next Paint (INP) < 200ms?
[ ] No layout shift (CLS)?
[ ] Images lazy-loaded?
[ ] Animation smooth (60fps)?
```

### 2.6 — UX Score

```
UI/UX SCORECARD
══════════════════════════════
Visual:      [X/10]
Interaction: [X/10]
States:      [X/10]
a11y:        [X/10]
Performance: [X/10]
──────────────────────────────
TOTAL:       [X/50]
══════════════════════════════
Issues found: [N]
Critical:     [danh sách]
Suggestions:  [danh sách]
```

---

## PHASE 3 — Test Runner

> ⚠️ In log ĐẦY ĐỦ cho từng test. Không được tóm tắt hay bỏ qua test nào.

### 3.1 — Test Inventory

Trước khi chạy, liệt kê TẤT CẢ tests sẽ chạy:

```
TEST PLAN
══════════════════════════════════════════
Unit Tests:        [N tests]
Integration Tests: [N tests]
E2E Tests:         [N tests]
Manual Tests:      [N tests]
──────────────────────────────────────────
TOTAL:             [N tests]

Test files:
  - [path/to/test1]
  - [path/to/test2]
  ...
══════════════════════════════════════════
```

### 3.2 — Run Tests với Full Log

Chạy từng test và in log theo format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST: [test name / function tested]
File:    [test file:line]
Input:   [data đưa vào]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[STDOUT LOG]
> Step 1: ...
> Step 2: ...
> ...

Expected: [kết quả mong đợi]
Actual:   [kết quả thực tế]
Duration: [Xms]
Status:   ✅ PASS / ❌ FAIL / ⚠️ SKIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Nếu test FAIL:**

```
❌ FAIL DETAILS:
  Error:    [error message đầy đủ]
  Stack:    [stack trace]
  Root cause: [phân tích nguyên nhân]
  Fix needed: [đề xuất fix]
→ Ghi vào BUG LIST + LEARNING LOG
```

### 3.3 — Test các tính năng CHƯA có test

Với mỗi function/feature CHƯA có test file:

**Viết test tự động:**

```javascript
// [Ngôn ngữ phù hợp với project]
describe('[Feature Name]', () => {
  test('[scenario]', () => {
    // Arrange
    const input = [...]
    // Act
    const result = functionUnderTest(input)
    // Assert
    expect(result).toEqual([expected])
  })

  test('edge case: [tên]', () => { ... })
  test('error case: [tên]', () => { ... })
})
```

**Test coverage checklist per function:**

```
[ ] Happy path (input hợp lệ, output đúng)
[ ] Edge case: giá trị rỗng / null / undefined
[ ] Edge case: giá trị biên (min, max)
[ ] Error case: input không hợp lệ
[ ] Error case: dependency fail
[ ] Async: resolve đúng
[ ] Async: reject/timeout handle
```

### 3.4 — Test Summary

```
╔══════════════════════════════════════════╗
║           TEST RESULTS SUMMARY           ║
╠══════════════════════════════════════════╣
║ Total:    [N]                            ║
║ ✅ Pass:  [N] ([X]%)                    ║
║ ❌ Fail:  [N] ([X]%)                    ║
║ ⚠️ Skip:  [N] ([X]%)                    ║
╠══════════════════════════════════════════╣
║ Coverage: [X]%                           ║
║ Duration: [Xms]                          ║
╠══════════════════════════════════════════╣
║ FAILED TESTS:                            ║
║   - [test name]: [reason]               ║
╚══════════════════════════════════════════╝
```

---

## PHASE 4 — Output Verification

> Xác minh rằng MỌI output đều đúng như requirement.

### 4.1 — Output Comparison Table

| Function/Feature | Input | Expected Output | Actual Output | Match |
| ---------------- | ----- | --------------- | ------------- | ----- |
| [tên]            | [...] | [...]           | [...]         | ✅/❌ |

### 4.2 — Data Integrity Check

```
[ ] API responses đúng schema không?
[ ] Database writes đúng format không?
[ ] File outputs đúng encoding, format không?
[ ] UI displays đúng data không? (không bị truncate, corrupt)
[ ] Calculations đúng không? (re-verify bằng tay)
[ ] Date/time formatting đúng timezone không?
[ ] Currency/number formatting đúng locale không?
```

### 4.3 — Contract Testing (nếu có API)

```
[ ] Request format đúng contract không?
[ ] Response schema đúng không?
[ ] Error responses đúng format không?
[ ] HTTP status codes đúng không?
[ ] Authentication/Authorization hoạt động không?
```

---

## PHASE 5 — Bug Report

Với mỗi vấn đề phát hiện:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐛 [BUG-N] [Tên ngắn gọn]
Severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
Phase:    Logic / UI-UX / Test / Output
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Execution Timeline:
  T+0ms  [action] → [state]
  T+Xms  [action] → ⚠️ BUG: [lý do]

Root Cause:   [nguyên nhân gốc, 1 câu]
Symptom:      [biểu hiện user thấy]
Reproduce:    [bước tái hiện]
Impact:       [ảnh hưởng đến tính năng nào]
Verified at:  [file:line]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## PHASE 6 — Fix Design & Implementation

### 6.1 — Fix phải match root cause

```
Root cause:   [race condition / null ref / wrong logic / ...]
Fix approach: [cách fix cụ thể]
Tại sao đúng: [giải thích]
SAI approach: [cách sai phổ biến để tránh]
```

### 6.2 — Impact Analysis

```
Thay đổi: [file:function:line]
Callers ảnh hưởng: [list]
State changes: [list]
Async changes: [timing thay đổi?]
Regression risk: [Low/Medium/High]
```

### 6.3 — Mental Execution với fix

```
[Viết lại timeline sau khi fix]
T+0ms  [action]
T+Xms  ✅ FIXED: [tại sao không còn bug]
```

### 6.4 — Implement + Verify

- Viết code fix
- Chạy lại test liên quan → phải PASS
- Chạy regression tests → không có test mới FAIL
- Update [LEARNING LOG]

### 6.5 — Fix Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FIX: [BUG-N]
Applied:    [file:line → mô tả thay đổi]
Root cause: ✅ Addressed
Tests:      ✅ [N/N passed]
Regression: ✅ [N flows checked, no new bugs]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## PHASE 7 — Self-Learning & Optimization

> 🧠 Phase này chạy LIÊN TỤC trong suốt quá trình audit, không chỉ ở cuối.

### 7.1 — LEARNING LOG

Mỗi khi gặp lỗi, sai assumption, hoặc test fail ngoài dự kiến:

```
📚 LEARNING LOG Entry #[N]
══════════════════════════════════════════
Timestamp: [khi nào]
Situation: [đang làm gì]
What went wrong: [sai ở đâu]
Why it went wrong: [nguyên nhân sai]
Correction made: [đã sửa thế nào]
Rule learned: [nguyên tắc rút ra để không lặp lại]
Applied to: [đã áp dụng lại ở đâu]
══════════════════════════════════════════
```

**Ví dụ entries:**

```
Rule #1: Không assume async function là sync khi không thấy `await`
Rule #2: Luôn check null trước khi truy cập property của object
Rule #3: Re-read requirement trước khi viết test assertion
Rule #4: Khi test fail không rõ lý do → thêm verbose logging trước
Rule #5: ...
```

### 7.2 — Pattern Recognition

Sau mỗi bug phát hiện, kiểm tra: "Có pattern tương tự ở nơi khác không?"

```
BUG PATTERN SCAN:
  Pattern phát hiện: [mô tả pattern]
  Tìm kiếm: [grep/search query]
  Tìm thấy thêm: [N chỗ khác có pattern này]
  Áp dụng fix: [N chỗ đã được fix theo]
```

### 7.3 — Skill Self-Optimization Notes

Ghi lại những điểm cần cải thiện trong skill này:

```
🔧 SKILL OPTIMIZATION LOG
══════════════════════════════════════
[Vấn đề gặp phải với skill hiện tại]
→ [Đề xuất cải thiện]

Ví dụ:
- "Phase 3 thiếu test cho WebSocket events"
  → Thêm checklist WebSocket testing
- "Phase 2 không cover animation testing"
  → Thêm animation/transition checks
══════════════════════════════════════
```

---

## PHASE 8 — Final Report

```
╔════════════════════════════════════════════════╗
║         QA AGENT FINAL REPORT v2.0             ║
╠════════════════════════════════════════════════╣
║ Project: [tên]          Date: [ngày]           ║
╠════════════════════════════════════════════════╣
║ AUDIT RESULTS                                  ║
║   Logic/Flow:  [N issues found, N fixed]       ║
║   UI/UX Score: [X/50]  ([N issues found])      ║
║   Tests:       [N/N pass] ([X]% coverage)      ║
║   Output:      [N/N verified correct]          ║
╠════════════════════════════════════════════════╣
║ BUGS                                           ║
║   🔴 Critical: [N]                            ║
║   🟠 High:     [N]                            ║
║   🟡 Medium:   [N]                            ║
║   🟢 Low:      [N]                            ║
║   ✅ Fixed:    [N]                            ║
║   ⏳ Pending:  [N]                            ║
╠════════════════════════════════════════════════╣
║ LEARNING                                       ║
║   Rules learned: [N]                          ║
║   Patterns found: [N]                         ║
║   Skill optimizations: [N]                    ║
╠════════════════════════════════════════════════╣
║ RECOMMENDATIONS                                ║
║   [Top 3-5 actions user nên làm tiếp theo]    ║
╠════════════════════════════════════════════════╣
║ OVERALL HEALTH: 🔴 / 🟠 / 🟡 / 🟢            ║
╚════════════════════════════════════════════════╝
```

---

## 🚦 Quick Reference — Khi Nào Làm Gì

| Tình huống        | Hành động                             |
| ----------------- | ------------------------------------- |
| Thiếu requirement | ❓ HỎI NGAY, không đoán               |
| Test fail lần 1   | 🔍 Debug + log thêm                   |
| Test fail lần 2   | 📚 Ghi Learning Log + re-read code    |
| Output không khớp | 📋 Xem lại requirement gốc            |
| Bug khó reproduce | ⏱️ Thêm timing log, tạo isolated test |
| Muốn skip bước    | ⛔ KHÔNG — đọc lý do trong bảng dưới  |

| Muốn skip            | Lý do PHẢI làm                            |
| -------------------- | ----------------------------------------- |
| Pre-flight questions | Thiếu info → test sai target              |
| Phase 0 inventory    | Files "không liên quan" thường chứa bug   |
| Phase 2 UI/UX        | Bug UX = bug nghiêm trọng với user        |
| Log đầy đủ           | Log ngắn = miss edge case                 |
| Learning Log         | Không ghi = lặp lại sai lầm               |
| Phase 8 report       | User cần tổng kết để quyết định tiếp theo |

---

## 🔄 Execution Checklist

```
PRE-FLIGHT
[ ] Thu thập đủ 8 mục thông tin (hoặc đã hỏi user)
[ ] Announce scope + confirm

PHASE 0 — Inventory
[ ] 0.1 Scan file structure
[ ] 0.2 Đọc từng file + ghi metadata
[ ] 0.3 Feature Map đầy đủ
[ ] 0.4 Global State Map
[ ] 0.5 Feature Interaction Matrix

PHASE 1 — Logic Audit
[ ] 1.1 Trace từng feature
[ ] 1.2 Anti-pattern checklist
[ ] 1.3 Timeline cho mỗi suspect

PHASE 2 — UI/UX (nếu có UI)
[ ] 2.1 Visual consistency
[ ] 2.2 Interaction & flow
[ ] 2.3 Loading & error states
[ ] 2.4 Accessibility
[ ] 2.5 Performance UX
[ ] 2.6 UX Scorecard

PHASE 3 — Test Runner
[ ] 3.1 Test inventory
[ ] 3.2 Run all tests + FULL LOG
[ ] 3.3 Write missing tests
[ ] 3.4 Test summary

PHASE 4 — Output Verification
[ ] 4.1 Output comparison table
[ ] 4.2 Data integrity check
[ ] 4.3 Contract testing (nếu có API)

PHASE 5 — Bug Report
[ ] Report format đầy đủ cho mọi bug

PHASE 6 — Fix & Verify
[ ] Design fix (match root cause)
[ ] Impact analysis
[ ] Implement + re-run tests
[ ] Regression sweep

PHASE 7 — Self-Learning
[ ] Learning Log entries (mỗi lần sai)
[ ] Pattern scan
[ ] Skill optimization notes

PHASE 8 — Final Report
[ ] Full report với tất cả metrics
```

---

## 📌 Ví Dụ Hỏi Thêm Thông Tin

**Khi không biết expected output:**

```
🔍 Cần clarification:
Function `calculateDiscount()` nhận input `{price: 100, tier: "gold"}`.
Expected output là gì?
  (a) {discountedPrice: 80}  (giảm 20%)
  (b) {discount: 20, final: 80}
  (c) 80 (chỉ trả số)

Không thể viết test chính xác nếu chưa biết format output mong đợi.
```

**Khi thiếu env:**

```
🔧 Thiếu config:
Tôi thấy code reference `process.env.DATABASE_URL` nhưng không có file `.env`.
Vui lòng cung cấp:
  1. File `.env.example` hoặc các biến env cần thiết
  2. Giá trị test (có thể dùng mock/fake)

Không thể chạy integration tests nếu thiếu database connection.
```

**Khi requirement mơ hồ:**

```
❓ Requirement không rõ:
Feature "tìm kiếm sản phẩm" — kết quả tìm kiếm phải:
  (a) Case-insensitive? (VD: "Áo" tìm được "áo")
  (b) Partial match? (VD: "áo" tìm được "áo thun")
  (c) Accent-insensitive? (VD: "ao" tìm được "áo")

Cần biết để viết đúng test case.
```
