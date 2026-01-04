# HƯỚNG DẪN CẬP NHẬT HỆ THỐNG ADMIN

## Đã hoàn thành:

### 1. CSS và UI
✅ Thêm Toast notification CSS vào `admin-dashboard.html`
✅ Cập nhật Site Settings UI với login slogan, about popup toggle
✅ Sửa Countdown Settings để chọn cả date và time riêng
✅ Cải thiện Event Modal với upload ảnh, dropdown đẹp hơn
✅ Thêm Event Detail Modal

### 2. Database Schema
✅ Thêm 2 settings mới vào `database/current_query.sql`:
- `login_slogan`: Text hiển thị ở login page
- `about_popup_enabled`: Toggle cho about popup

### 3. Utility Functions
✅ Tạo `public/js/utils.js` với:
- `showToast(message, type)` - Toast notifications
- `sanitizeHTML(html)` - XSS protection  
- `showConfirm(message, onConfirm, onCancel)` - Confirmation dialog
- `uploadImage(file, bucket, folder, supabase)` - Upload ảnh lên Supabase Storage

## CẦN HOÀN THIỆN:

### Cách thực hiện nhanh:

1. **Chạy SQL để cập nhật database:**
```sql
-- Chạy file database/current_query.sql để thêm settings mới
-- Hoặc chỉ chạy phần sau:
INSERT INTO public.site_settings (setting_key, setting_value, description) VALUES
('login_slogan', 'Welcome to Wangho''s Flower Garden - A special place for Peanut''s fans to connect and celebrate together.', 'Login page slogan text'),
('about_popup_enabled', 'false', 'Show about popup on homepage')
ON CONFLICT (setting_key) DO NOTHING;
```

2. **Cập nhật admin-dashboard.js:**

Thay dòng import đầu file từ:
```javascript
import { requireAdmin, supabase, isAdmin } from './supabase-client.js'
import { handleLogout } from './auth.js'
```

Thành:
```javascript
import { requireAdmin, supabase, isAdmin } from './supabase-client.js'
import { handleLogout } from './auth.js'
import { showToast, sanitizeHTML, showConfirm, uploadImage } from './utils.js'
```

3. **Thay thế tất cả `alert()` bằng `showToast()`:**

Tìm và thay thế:
- `alert('...')` → `showToast('...', 'success')` (cho thành công)
- `alert('Không thể...')` → `showToast('...', 'error')` (cho lỗi)
- `alert('Vui lòng...')` → `showToast('...', 'warning')` (cho cảnh báo)

4. **Thay thế tất cả `confirm()` bằng `showConfirm()`:**

Từ:
```javascript
if (!confirm('Message')) return
// code
```

Thành:
```javascript
showConfirm('Message', async () => {
  // code
})
```

5. **Cập nhật loadSettings() function:**

Thay thế toàn bộ function `loadSettings()` (khoảng dòng 362) với:
```javascript
async function loadSettings() {
  try {
    const { data, error } = await supabase
      .from('countdown_settings')
      .select('*')
      .eq('event_type', 'return_date')
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    
    if (data) {
      const targetDate = new Date(data.target_date)
      document.getElementById('return-date').value = targetDate.toISOString().split('T')[0]
      document.getElementById('return-time').value = targetDate.toTimeString().slice(0, 5)
      document.getElementById('countdown-title').value = data.title || ''
      document.getElementById('countdown-description').value = data.description || ''
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}
```

6. **Cập nhật save countdown settings:**

Tìm `document.getElementById('save-countdown-settings')` và thay code trong đó với:
```javascript
const returnDate = document.getElementById('return-date').value
const returnTime = document.getElementById('return-time').value || '00:00'
const title = document.getElementById('countdown-title').value
const description = document.getElementById('countdown-description').value

if (!returnDate) {
  showToast('Please select a return date', 'warning')
  return
}

// Combine date and time
const targetDateTime = new Date(`${returnDate}T${returnTime}:00`)

const { error } = await supabase
  .from('countdown_settings')
  .update({
    target_date: targetDateTime.toISOString(),
    title,
    description,
    updated_at: new Date().toISOString()
  })
  .eq('event_type', 'return_date')
  .eq('is_active', true)

if (error) throw error

showToast('Settings saved successfully!', 'success')
```

7. **Cập nhật loadSiteSettings():**

Tìm function `loadSiteSettings()` và cập nhật để load thêm 2 settings mới:
```javascript
async function loadSiteSettings() {
  try {
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
    
    if (error) throw error
    
    settings?.forEach(setting => {
      if (setting.setting_key === 'login_welcome_title') {
        document.getElementById('login-title').value = setting.setting_value
      } else if (setting.setting_key === 'login_welcome_message') {
        document.getElementById('login-message').value = setting.setting_value
      } else if (setting.setting_key === 'login_slogan') {
        document.getElementById('login-slogan').value = setting.setting_value
      } else if (setting.setting_key === 'about_content') {
        document.getElementById('about-content').value = setting.setting_value
      } else if (setting.setting_key === 'about_popup_enabled') {
        document.getElementById('about-popup-enabled').checked = setting.setting_value === 'true'
      }
    })
  } catch (error) {
    console.error('Error loading site settings:', error)
    showToast('Failed to load settings', 'error')
  }
}
```

8. **Cập nhật save site settings:**

Tìm `document.getElementById('save-site-settings')` và thay code với:
```javascript
const loginTitle = document.getElementById('login-title').value
const loginMessage = document.getElementById('login-message').value
const loginSlogan = document.getElementById('login-slogan').value
const aboutContent = document.getElementById('about-content').value
const aboutPopupEnabled = document.getElementById('about-popup-enabled').checked

const updates = [
  { setting_key: 'login_welcome_title', setting_value: loginTitle },
  { setting_key: 'login_welcome_message', setting_value: loginMessage },
  { setting_key: 'login_slogan', setting_value: sanitizeHTML(loginSlogan) },
  { setting_key: 'about_content', setting_value: sanitizeHTML(aboutContent) },
  { setting_key: 'about_popup_enabled', setting_value: aboutPopupEnabled ? 'true' : 'false' }
]

for (const update of updates) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({
      setting_key: update.setting_key,
      setting_value: update.setting_value,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }, {
      onConflict: 'setting_key'
    })
  
  if (error) throw error
}

showToast('Site settings saved successfully!', 'success')
```

9. **Thêm Event management code:**

Thêm vào cuối file, trước phần "INITIALIZATION":

```javascript
// ============= EVENTS MANAGEMENT =============

let currentEventImage = null

// (Copy toàn bộ Events management code từ admin-dashboard-part2.js)
```

10. **Cập nhật Event Modal handlers:**

Thêm các event listeners:
```javascript
// Image upload
document.getElementById('event-image-file')?.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  try {
    showToast('Uploading image...', 'info')
    const imageUrl = await uploadImage(file, 'wishes-images', 'events', supabase)
    currentEventImage = imageUrl
    document.getElementById('event-image-url').value = imageUrl
    showImagePreview(imageUrl)
    showToast('Image uploaded successfully!', 'success')
  } catch (error) {
    showToast('Upload failed: ' + error.message, 'error')
  }
})

// Image URL input
document.getElementById('event-image-url')?.addEventListener('change', (e) => {
  const url = e.target.value.trim()
  if (url) {
    currentEventImage = url
    showImagePreview(url)
  }
})

// Remove image
document.getElementById('remove-event-image')?.addEventListener('click', () => {
  currentEventImage = null
  document.getElementById('event-image-url').value = ''
  document.getElementById('event-image-preview').classList.add('hidden')
})
```

## KIỂM TRA:

Sau khi cập nhật, test các chức năng:

1. ✓ Toast notifications hiển thị đúng
2. ✓ Confirm dialogs đẹp hơn
3. ✓ Event modal có upload ảnh
4. ✓ Site Settings lưu được login slogan và about popup
5. ✓ Countdown settings chọn được giờ cụ thể
6. ✓ Event detail modal hiển thị HTML đã sanitize
7. ✓ Không có XSS vulnerability

## GHI CHÚ:

- File backup: `public/js/admin-dashboard-backup.js`
- Tham khảo code hoàn chỉnh trong `admin-dashboard-new.js` và `admin-dashboard-part2.js`
- Login slogan sẽ load từ setting `login_slogan` thay vì `about_content`
- Tất cả HTML input đều được sanitize qua `sanitizeHTML()`
