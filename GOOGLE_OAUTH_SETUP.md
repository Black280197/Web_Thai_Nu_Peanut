# GOOGLE OAUTH SETUP GUIDE

## 🔧 Fix Avatar & Google Login Issues

### Issue 1: Avatar không hiển thị sau khi đăng ký
**Root Cause**: Database trigger `handle_new_user()` không lưu `avatar_url` từ user metadata

**Solution**: 
1. Run migration SQL: `database/migration_fix_bugs.sql`
2. Trigger đã được update để lưu avatar từ `raw_user_meta_data->>'avatar_url'`
3. Nếu user đã tồn tại, avatar sẽ được update bằng ON CONFLICT

### Issue 2: Google Login không hoạt động
**Root Cause**: Supabase chưa được cấu hình Google OAuth provider

---

## 📋 GOOGLE OAUTH CONFIGURATION STEPS

### Step 1: Tạo Google Cloud Project

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **Google+ API**:
   - Vào "APIs & Services" → "Library"
   - Tìm "Google+ API" 
   - Click "Enable"

### Step 2: Tạo OAuth Credentials

1. Vào "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Chọn "Application type": **Web application**
4. Nhập tên: `Wangho Flower Garden`
5. Thêm **Authorized JavaScript origins**:
   ```
   https://ueoidpcbanfojffhiani.supabase.co
   http://localhost:5500
   ```
6. Thêm **Authorized redirect URIs**:
   ```
   https://ueoidpcbanfojffhiani.supabase.co/auth/v1/callback
   http://localhost:5500/auth-callback.html
   ```
7. Click "Create"
8. Copy **Client ID** và **Client Secret**

### Step 3: Cấu hình Supabase

1. Mở [Supabase Dashboard](https://app.supabase.com/)
2. Chọn project: `ueoidpcbanfojffhiani`
3. Vào **Authentication** → **Providers**
4. Tìm **Google** và click để mở
5. Bật **Enable Sign in with Google**
6. Paste **Client ID** (từ bước 2.8)
7. Paste **Client Secret** (từ bước 2.8)
8. Click **Save**

### Step 4: Verify Configuration

1. Mở trang login: `http://localhost:5500/login.html`
2. Click nút "Sign in with Google"
3. Popup Google login sẽ hiện ra
4. Chọn tài khoản Google
5. Redirect về `auth-callback.html`
6. Sau đó redirect về `index.html`
7. Avatar từ Google sẽ tự động sync

---

## 🧪 TESTING AVATAR DISPLAY

### Test 1: Đăng ký với avatar upload
```
1. Vào /register.html
2. Điền thông tin: username, email, password
3. Click "Choose Image" và chọn ảnh
4. Preview ảnh sẽ hiện ra
5. Click "Register"
6. Sau khi register thành công, login
7. Check homepage → avatar phải hiển thị ảnh đã upload
```

### Test 2: Đăng ký không có avatar
```
1. Vào /register.html
2. Điền thông tin (không chọn ảnh)
3. Register thành công
4. Login
5. Avatar sẽ hiển thị chữ cái đầu của username trong circle màu
```

### Test 3: Google login
```
1. Vào /login.html
2. Click "Sign in with Google"
3. Chọn tài khoản Google
4. Redirect về homepage
5. Avatar phải là ảnh profile Google
```

---

## 🔍 TROUBLESHOOTING

### Avatar không hiển thị sau khi đăng ký

**Check 1**: Xem avatar_url có trong database không
```sql
SELECT id, username, avatar_url 
FROM public.users 
WHERE email = 'your-email@example.com';
```

**Solution**: Nếu avatar_url là NULL hoặc empty:
- Run migration: `database/migration_fix_bugs.sql`
- Delete user và đăng ký lại
- Hoặc manually update:
```sql
UPDATE public.users 
SET avatar_url = 'https://your-supabase-url/storage/v1/object/public/wishes-images/avatars/filename.jpg'
WHERE id = 'user-id';
```

### Google login button không làm gì

**Check 1**: Console có lỗi không?
- Open DevTools → Console
- Click Google button
- Check for errors

**Check 2**: OAuth redirect URI đúng chưa?
```
Expected: https://ueoidpcbanfojffhiani.supabase.co/auth/v1/callback
```

**Check 3**: Google OAuth enabled trong Supabase?
- Supabase Dashboard → Authentication → Providers
- Google phải có checkmark xanh "Enabled"

### Avatar upload lỗi "Upload failed"

**Check 1**: Storage bucket tồn tại chưa?
```
Supabase Dashboard → Storage
→ Check "wishes-images" bucket exists
→ Check Public access enabled
```

**Check 2**: Storage policies đúng chưa?
```sql
-- Policy cho authenticated users upload
SELECT * FROM storage.policies 
WHERE bucket_id = 'wishes-images';
```

**Solution**: Nếu thiếu policies:
```sql
-- Run storage policies từ current_query.sql
-- Lines 580-593
```

### Google avatar không sync

**Check 1**: Auth callback có chạy không?
- Vào `auth-callback.html` sau khi login Google
- Check console log: "User signed in: ..."
- Check avatar_url trong user.user_metadata

**Solution**: Force sync avatar
```javascript
// Run in browser console sau khi login
const { data: { user } } = await supabase.auth.getUser()
console.log('Avatar URL:', user.user_metadata.avatar_url)

// Update manually
await supabase.from('users').update({ 
  avatar_url: user.user_metadata.avatar_url 
}).eq('id', user.id)
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Run migration SQL (migration_fix_bugs.sql)
- [ ] Google Cloud OAuth credentials created
- [ ] Supabase Google provider enabled
- [ ] Authorized redirect URIs configured
- [ ] Storage bucket "wishes-images" exists
- [ ] Storage policies allow upload/read
- [ ] Test register with avatar → avatar shows
- [ ] Test register without avatar → initial shows
- [ ] Test Google login → Google avatar shows
- [ ] Test avatar persists after logout/login

---

## 📝 NOTES

1. **Avatar URL Format**:
   - Uploaded: `https://ueoidpcbanfojffhiani.supabase.co/storage/v1/object/public/wishes-images/avatars/xxxxx.jpg`
   - Google: `https://lh3.googleusercontent.com/...`

2. **Avatar Size Limits**:
   - Upload: Max 2MB
   - Formats: JPG, PNG, GIF, WebP

3. **Security**:
   - Avatars are stored in public bucket
   - Anyone can view avatar URLs
   - Users can only delete their own uploads

4. **Fallback Avatar**:
   - If no avatar: Show first letter of username
   - Background: gradient from primary to pink-600
   - Text: white, bold, centered

---

## 🚀 QUICK FIX COMMANDS

```bash
# 1. Run migration in Supabase SQL Editor
# Copy content from: database/migration_fix_bugs.sql

# 2. Verify trigger updated
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

# 3. Check existing users' avatars
SELECT username, 
       CASE 
         WHEN avatar_url IS NULL OR avatar_url = '' THEN 'NO AVATAR'
         ELSE 'HAS AVATAR'
       END as avatar_status
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

# 4. Force update avatar for a user
UPDATE public.users 
SET avatar_url = 'NEW_URL_HERE'
WHERE email = 'user@example.com';
```

Sau khi làm theo guide này, cả avatar upload và Google login sẽ hoạt động! 🎉
