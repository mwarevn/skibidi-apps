# UI Style Guide — AI Agent Reference

> Tài liệu này dành cho AI Agent khi xây dựng giao diện. Tuân thủ nghiêm ngặt mọi quy tắc dưới đây để đảm bảo tính nhất quán về visual và UX.

---

## 1. Design Philosophy

Giao diện theo phong cách **Soft Filled Minimal** — mọi thứ phải:

- Trông **nhẹ, sạch, và dễ thở**
- Không gây rối mắt, không chồng đè lên nhau
- Animation **mượt mà, có chủ đích** — không giật, không nhảy đột ngột
- Accessible: mọi element phải dễ tương tác, không bị che khuất
- UI không chen chúc, không bị out khỏi màn hình (overflow).

### Nguyên tắc màu sắc (bất biến dù đổi palette)

- **Toàn bộ màu sắc lấy từ palette token** (`scale[N]`, `accentN`) — không hardcode giá trị màu trực tiếp
- **Phân cấp visual** (hierarchy, depth, state) được tạo ra bằng cách dùng các bước sáng/tối **liên tiếp trong cùng palette** — không thêm màu ngoài hệ thống
- **Semantic color** (warning, error, success) chỉ dùng đúng ngữ cảnh, không dùng làm màu trang trí
- Khi palette thay đổi (xám → xanh → cam, v.v.), chỉ cần cập nhật **Section 4 — Color System**, toàn bộ component tự cập nhật theo vì đều dùng token

---

## 2. Shape & Geometry

### Border Radius

- **Mặc định (card, panel, container):** `border-radius: 20px` trở lên — ưu tiên dùng `24px` hoặc `28px`
- **Button:** `border-radius: 999px` (pill shape hoàn toàn tròn)
- **Input field:** `border-radius: 16px`
- **Badge / tag nhỏ:** `border-radius: 999px`
- **Icon button:** `border-radius: 50%` hoặc `999px`
- **KHÔNG ĐƯỢC** dùng `border-radius: 0`, `4px`, hoặc bất kỳ góc vuông nào

### Border

- **KHÔNG dùng border** trên bất kỳ component nào (cards, buttons, inputs, v.v.)
- Nếu cần phân tách, dùng background color contrast hoặc subtle shadow thay vì border line

### Shadow

- **KHÔNG dùng box-shadow** — kể cả shadow nhẹ
- Phân tách layer bằng cách dùng background color khác nhau từ color palette

---

## 3. Spacing & Layout

### Padding

- **Card / container:** `padding: 20px 24px` (medium padding)
- **Button lớn:** `padding: 14px 28px`
- **Button nhỏ:** `padding: 8px 18px`
- **Input:** `padding: 12px 16px`
- **Section gap:** `gap: 16px` đến `gap: 24px`

### Layout Rules

- Các element **KHÔNG được chồng đè** lên nhau trừ khi intentional (ví dụ: avatar stack)
- Dùng `display: flex` hoặc `display: grid` có gap rõ ràng
- Mọi clickable element phải có `min-height: 44px` để dễ tap trên mobile
- Tránh z-index conflict: chỉ dùng z-index khi thực sự cần (modal, tooltip, dropdown)

---

## 4. Color System

### Nguyên tắc

- Toàn bộ giao diện dùng **thang xám monochrome** — không có màu accent đặc biệt ngoài semantic states
- Background phải **soft** (không phải trắng/đen thuần)
- Text phải có đủ contrast với background (tối thiểu 4.5:1 theo WCAG AA)

### Dark Mode Palette

```
scale[0]  = hsla(0, 0%, 0%, 1)   → App background (deepest)
scale[1]  = hsla(0, 0%, 5%, 1)   → Page background
scale[2]  = hsla(0, 0%, 10%, 1)  → Card background
scale[3]  = hsla(0, 0%, 16%, 1)  → Elevated card / panel
scale[4]  = hsla(0, 0%, 22%, 1)  → Input background
scale[5]  = hsla(0, 0%, 29%, 1)  → Hover state background
scale[6]  = hsla(0, 0%, 35%, 1)  → Active / pressed background
scale[7]  = hsla(0, 0%, 42%, 1)  → Placeholder text / disabled
scale[8]  = hsla(0, 0%, 48%, 1)  → Secondary text
scale[9]  = hsla(0, 0%, 55%, 1)  → Muted label text
scale[10] = hsla(0, 0%, 94%, 1)  → Body text
scale[11] = hsla(0, 0%, 100%, 1) → Primary / heading text
```

### Light Mode Palette

```
scale[0]  = hsla(0, 0%, 100%, 1) → App background (lightest)
scale[1]  = hsla(0, 0%, 96%, 1)  → Page background
scale[2]  = hsla(0, 0%, 92%, 1)  → Card background
scale[3]  = hsla(0, 0%, 87%, 1)  → Elevated card / panel
scale[4]  = hsla(0, 0%, 82%, 1)  → Input background
scale[5]  = hsla(0, 0%, 75%, 1)  → Hover state background
scale[6]  = hsla(0, 0%, 67%, 1)  → Active / pressed background
scale[7]  = hsla(0, 0%, 60%, 1)  → Placeholder text / disabled
scale[8]  = hsla(0, 0%, 52%, 1)  → Secondary text
scale[9]  = hsla(0, 0%, 45%, 1)  → Muted label text
scale[10] = hsla(0, 0%, 8%, 1)   → Body text
scale[11] = hsla(0, 0%, 0%, 1)   → Primary / heading text
```

### Accent (Dark Mode)

```
accent1  = hsla(0, 0%, 92%, 1)  → Lightest accent (background tint)
accent2  = hsla(0, 0%, 86%, 1)
accent3  = hsla(0, 0%, 81%, 1)
accent4  = hsla(0, 0%, 75%, 1)
accent5  = hsla(0, 0%, 70%, 1)
accent6  = hsla(0, 0%, 65%, 1)
accent7  = hsla(0, 0%, 60%, 1)
accent8  = hsla(0, 0%, 55%, 1)
accent9  = hsla(0, 0%, 50%, 1)  → Mid accent
accent10 = hsla(0, 0%, 12%, 1)
accent11 = hsla(0, 0%, 6%, 1)
accent12 = hsla(0, 0%, 0%, 1)   → Darkest accent (text on accent bg)
```

### Accent (Light Mode)

```
accent1  = hsla(0, 0%, 8%, 1)   → Darkest accent (background)
accent2  = hsla(0, 0%, 14%, 1)
accent3  = hsla(0, 0%, 19%, 1)
accent4  = hsla(0, 0%, 25%, 1)
accent5  = hsla(0, 0%, 30%, 1)
accent6  = hsla(0, 0%, 35%, 1)
accent7  = hsla(0, 0%, 40%, 1)
accent8  = hsla(0, 0%, 45%, 1)
accent9  = hsla(0, 0%, 50%, 1)  → Mid accent
accent10 = hsla(0, 0%, 88%, 1)
accent11 = hsla(0, 0%, 94%, 1)
accent12 = hsla(0, 0%, 100%, 1) → Lightest (text on dark accent bg)
```

### Semantic Colors (dùng cho trạng thái đặc biệt)

| Trạng thái | Token     | Màu gốc      | Ghi chú                             |
| ---------- | --------- | ------------ | ----------------------------------- |
| Warning    | `warning` | Yellow scale | Dùng cho cảnh báo, chú ý            |
| Error      | `error`   | Red scale    | Validation lỗi, hành động nguy hiểm |
| Success    | `success` | Green scale  | Xác nhận thành công, trạng thái OK  |

---

## 5. Component Specifications

### Card / Panel

```
background:    scale[2] (dark) | scale[2] (light)
border-radius: 24px
border:        none
box-shadow:    none
padding:       20px 24px
```

### Button — Primary (Filled)

```
background:    scale[11] (dark) = white | scale[11] (light) = black
color:         scale[0]  (dark) = black | scale[0]  (light) = white
border-radius: 999px
border:        none
padding:       13px 24px
font-weight:   600
```

### Button — Secondary

```
background:    scale[3]
color:         scale[10]
border-radius: 999px
border:        none
padding:       13px 24px
```

### Button — Ghost / Text

```
background:    transparent
color:         scale[9]
border-radius: 999px
border:        none
padding:       13px 24px
```

> Hover state cho mọi button: background chuyển sang scale[5], transition mượt 150ms

### Input Field

```
background:    scale[3] (dark) | scale[3] (light)
color:         scale[10]
placeholder:   scale[7]
border-radius: 16px
border:        none
padding:       12px 16px
```

> Focus state: background chuyển sang scale[4], không dùng outline màu — thay bằng thay đổi background

### Badge / Tag

```
background:    scale[4]
color:         scale[9]
border-radius: 999px
border:        none
padding:       4px 12px
font-size:     12px
font-weight:   500
```

### Modal / Overlay

```
backdrop:      hsla(0, 0%, 0%, 0.5) với backdrop-filter: blur(8px)
container:     scale[2], border-radius: 28px, padding: 28px
```

### Tooltip

```
background:    scale[4]
color:         scale[10]
border-radius: 12px
padding:       6px 12px
font-size:     13px
```

---

## 6. Animation & Transitions

### Nguyên tắc bắt buộc

- **LUÔN** dùng `transition` hoặc `animation` khi:
    - Component xuất hiện / biến mất
    - Kích thước thay đổi (height, width)
    - Vị trí thay đổi
    - Màu sắc hoặc background thay đổi (hover, focus, active)
- **KHÔNG BAO GIỜ** để UI "nhảy" hoặc thay đổi đột ngột không có animation

### Timing Standards

| Loại tương tác        | Duration            | Easing                       |
| --------------------- | ------------------- | ---------------------------- |
| Hover / focus         | 150ms               | `ease`                       |
| Button click feedback | 100ms               | `ease-in`                    |
| Modal mở/đóng         | 250ms               | `cubic-bezier(0.16,1,0.3,1)` |
| Dropdown / menu       | 200ms               | `cubic-bezier(0.16,1,0.3,1)` |
| Page transition       | 300ms               | `ease-in-out`                |
| Height auto animation | 250ms               | `ease-in-out`                |
| List item stagger     | 50ms delay mỗi item | `ease`                       |

### CSS Snippet chuẩn

```css
/* Transition mặc định cho mọi interactive element */
transition:
    background-color 150ms ease,
    color 150ms ease,
    opacity 150ms ease,
    transform 150ms ease;

/* Modal / panel xuất hiện */
@keyframes slideUpFadeIn {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
animation: slideUpFadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;

/* Height collapse (accordion, expandable) */
/* Dùng max-height hoặc thư viện như Radix/Framer Motion */
transition:
    max-height 250ms ease-in-out,
    opacity 200ms ease;
```

### Hover & Active States

```css
/* Button hover */
button:hover {
    background: scale[5];
    transform: none;
}
button:active {
    background: scale[6];
    transform: scale(0.98);
}

/* Card hover (nếu clickable) */
.card:hover {
    background: scale[3];
}
```

---

## 7. Typography

- **Font**: Chọn font sans-serif có character riêng — không dùng Inter, Roboto, Arial
- **Heading**: font-weight `700`, color `scale[11]`
- **Body**: font-weight `400`, color `scale[10]`
- **Secondary / caption**: font-weight `400`, color `scale[8]` hoặc `scale[9]`
- **Label**: font-weight `500`, color `scale[9]`
- **Line height**: 1.5 cho body, 1.2 cho heading
- **Letter spacing heading**: `-0.02em` đến `-0.03em`

---

## 8. Layering & Z-Index

Sử dụng thang z-index nhất quán, không để conflict:

```
z-index: 0    → Default content
z-index: 10   → Sticky header / sidebar
z-index: 100  → Dropdown / popover
z-index: 200  → Tooltip
z-index: 300  → Modal backdrop
z-index: 400  → Modal container
z-index: 500  → Toast / notification
```

---

## 9. Checklist trước khi hoàn thiện UI

Trước khi deliver bất kỳ component hoặc screen nào, AI Agent phải kiểm tra:

- [ ] Không có border nào trên component
- [ ] Không có box-shadow nào
- [ ] Tất cả radius đủ lớn (≥ 16px với container, 999px với pill)
- [ ] Tất cả interactive element có transition animation
- [ ] Không có element nào chồng đè nhau ngoài ý muốn
- [ ] Tất cả màu đều lấy từ palette định nghĩa ở trên
- [ ] Dark mode và light mode đều được hỗ trợ
- [ ] Semantic color (warning/error/success) chỉ dùng đúng context
- [ ] Min touch target ≥ 44px cho mobile
- [ ] Modal/overlay có backdrop blur

---

> **Lưu ý cuối:** Mọi màu sắc trong hệ thống đều đến từ **token** (`scale[N]`, `accentN`, semantic colors) — không bao giờ hardcode giá trị HSLA vào component. Khi cần đổi palette, chỉ cập nhật **Section 4** là đủ, toàn bộ giao diện sẽ tự động nhất quán.
