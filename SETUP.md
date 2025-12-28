# 🚀 Quick Setup Guide - HLE Peanut Fan Club

## Bắt đầu nhanh trong 5 phút!

### ✅ Đã hoàn thành:
1. ✅ Project structure created
2. ✅ Dependencies installed
3. ✅ Authentication pages created (Login, Register, Forgot Password)
4. ✅ Supabase client configured
5. ✅ Database schema ready

### 📋 Checklist tiếp theo:

#### 1. Setup Supabase Database (5 phút)

**Bước 1:** Đăng nhập [Supabase Dashboard](https://app.supabase.com)

**Bước 2:** Vào SQL Editor và chạy file `database/schema.sql`
```
1. Click "SQL Editor" ở sidebar
2. Click "New Query"
3. Copy nội dung file database/schema.sql
4. Paste vào editor
5. Click "Run" (hoặc Ctrl/Cmd + Enter)
6. Chờ ~10 giây để tạo schema
```

**Bước 3:** Lấy Supabase keys
```
1. Vào Settings > API
2. Copy "Project URL"
3. Copy "anon public" key
```

**Bước 4:** Cập nhật file `src/config/supabase.js`

Thay thế dòng này:
```javascript
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE'
```

Với anon key thực của bạn từ Supabase Dashboard.

#### 2. Configure Email Authentication (3 phút)

**Trong Supabase Dashboard:**
```
1. Vào Authentication > Providers
2. Enable "Email" provider
3. Enable "Confirm email" nếu muốn verify email
4. Save
```

#### 3. Configure OAuth (Optional - 10 phút)

**Google OAuth:**
```
1. Vào Google Cloud Console
2. Tạo OAuth credentials
3. Copy Client ID và Secret
4. Paste vào Supabase > Authentication > Providers > Google
5. Add redirect URL: https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

**Twitter & Discord:** Tương tự với respective developer portals.

#### 4. Test Authentication

**Chạy dev server:**
```bash
npm run dev
```

**Test các trang:**
- 🔐 Login: http://localhost:3000/template/Login.html
- 📝 Register: http://localhost:3000/template/Register.html
- 🔑 Forgot Password: http://localhost:3000/template/Forgot-Password.html

#### 5. Create Admin User (Important!)

**Sau khi đăng ký user đầu tiên:**

Vào Supabase SQL Editor và chạy:
```sql
-- Update user role to admin
UPDATE public.users 
SET role = 'admin'
WHERE email = 'YOUR_EMAIL@example.com';
```

## 🎯 Test Checklist

### Authentication Flow:
- [ ] Đăng ký tài khoản mới
- [ ] Check email verification (nếu enabled)
- [ ] Đăng nhập với email/password
- [ ] Test "Forgot Password" flow
- [ ] Test OAuth login (Google/Twitter/Discord)
- [ ] Test logout

### Database:
- [ ] Verify tables được tạo trong Table Editor
- [ ] Check 11 badges đã được insert
- [ ] Verify countdown_settings có data
- [ ] Test RLS policies

## 🐛 Troubleshooting

### Lỗi: "Failed to fetch"
**Giải pháp:** 
- Check Supabase URL và keys trong `src/config/supabase.js`
- Verify project đang active trong Supabase Dashboard

### Lỗi: "Invalid login credentials"
**Giải pháp:**
- Verify email đã được confirm (nếu required)
- Check user tồn tại trong auth.users table
- Verify RLS policies

### Lỗi: "Cannot read properties of null"
**Giải pháp:**
- Clear browser cache và cookies
- Check console logs cho chi tiết
- Verify JavaScript modules đang load đúng

### Không nhận được email verification
**Giải pháp:**
- Check spam folder
- Verify email templates trong Supabase > Authentication > Email Templates
- Check email service status trong Dashboard

## 📚 Next Steps

Sau khi authentication hoạt động:

1. **Connect Countdown page** với database
2. **Implement Daily Attendance** check-in logic
3. **Build Wishes Submission** system
4. **Create Admin Moderation** panel
5. **Add Notification** system

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Project Structure](../README.md)
- [Database Schema](../database/README.md)

## 💡 Tips

1. **Development:**
   - Dùng Chrome DevTools Network tab để debug API calls
   - Check Supabase Dashboard > Logs để xem errors
   - Console.log là bạn tốt!

2. **Testing:**
   - Tạo multiple test accounts
   - Test edge cases (empty fields, invalid emails, etc.)
   - Test trên different browsers

3. **Security:**
   - KHÔNG commit `.env` file lên Git
   - KHÔNG share service_role key publicly
   - Always validate input ở cả client và server

## ✅ Ready to Code!

Khi mọi thứ đã setup xong:

```bash
# Start development
npm run dev

# Open browser
http://localhost:3000/template/Login.html
```

**Happy coding! 🚀**

---

Có vấn đề? Check `database/README.md` hoặc open issue trên GitHub!
