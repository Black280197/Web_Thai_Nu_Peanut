# Database Setup Guide

## Hướng dẫn thiết lập Database Schema trong Supabase

### Bước 1: Truy cập Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào menu **SQL Editor** ở sidebar bên trái

### Bước 2: Chạy Schema Script

1. Click nút **New Query**
2. Copy toàn bộ nội dung file `schema.sql`
3. Paste vào SQL Editor
4. Click **Run** hoặc nhấn `Ctrl/Cmd + Enter`
5. Đợi script chạy xong (khoảng 10-15 giây)

### Bước 3: Verify Schema đã được tạo

Kiểm tra các bảng đã được tạo trong menu **Table Editor**:

- ✅ users
- ✅ daily_attendance
- ✅ wishes
- ✅ journals
- ✅ journal_tags
- ✅ friendships
- ✅ badges (với 11 badges mặc định)
- ✅ user_badges
- ✅ notifications
- ✅ countdown_settings

### Bước 4: Configure Authentication

#### 4.1 Enable Email Authentication

1. Vào **Authentication** > **Providers**
2. Enable **Email** provider
3. **Confirm email** - Enable nếu muốn yêu cầu xác thực email
4. **Secure email change** - Recommended: Enable

#### 4.2 Configure OAuth Providers

##### Google OAuth
1. Vào **Authentication** > **Providers** > **Google**
2. Enable Google provider
3. Nhập **Client ID** và **Client Secret** từ [Google Cloud Console](https://console.cloud.google.com/)
4. Add redirect URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

##### Twitter OAuth
1. Vào **Authentication** > **Providers** > **Twitter**
2. Enable Twitter provider
3. Nhập **API Key** và **API Secret** từ [Twitter Developer Portal](https://developer.twitter.com/)
4. Add callback URL tương tự

##### Discord OAuth
1. Vào **Authentication** > **Providers** > **Discord**
2. Enable Discord provider
3. Nhập **Client ID** và **Client Secret** từ [Discord Developer Portal](https://discord.com/developers/applications)
4. Add redirect URI tương tự

#### 4.3 Configure Email Templates

1. Vào **Authentication** > **Email Templates**
2. Customize các template sau:
   - **Confirm signup** - Email xác nhận đăng ký
   - **Reset password** - Email đặt lại mật khẩu
   - **Magic Link** - Email đăng nhập không mật khẩu (optional)

#### 4.4 URL Configuration

1. Vào **Authentication** > **URL Configuration**
2. Thêm các URL sau vào **Redirect URLs**:
   ```
   http://localhost:3000/*
   http://localhost:3000/template/Countdown.html
   http://localhost:3000/auth-callback.html
   https://yourdomain.com/*
   ```

### Bước 5: Test Database Connection

Chạy query test trong SQL Editor:

```sql
-- Test 1: Kiểm tra users table
SELECT COUNT(*) as user_count FROM public.users;

-- Test 2: Kiểm tra badges đã được insert
SELECT name, description FROM public.badges ORDER BY sort_order;

-- Test 3: Kiểm tra countdown settings
SELECT * FROM public.countdown_settings WHERE is_active = TRUE;

-- Test 4: Test RLS policies (phải login trước)
SELECT * FROM public.users WHERE id = auth.uid();
```

### Bước 6: Get Supabase Keys

1. Vào **Settings** > **API**
2. Copy các keys sau:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **anon public key**: Key cho client-side
   - **service_role key**: Key cho server-side (GIỮ BÍ MẬT!)

3. Cập nhật file `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Bước 7: Update Supabase Config

Cập nhật file `src/config/supabase.js` với keys của bạn:

```javascript
const supabaseUrl = 'YOUR_PROJECT_URL'
const supabaseAnonKey = 'YOUR_ANON_KEY'
```

## Database Schema Overview

### Tables Structure

```
┌─────────────────┐
│     users       │ ← Central table
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
    ┌────▼────┐      ┌─────▼─────┐
    │ wishes  │      │attendance │
    └─────────┘      └───────────┘
         │
         ├──────────────────┐
         │                  │
    ┌────▼────┐      ┌─────▼──────┐
    │journals │      │friendships │
    └────┬────┘      └────────────┘
         │
    ┌────▼─────┐
    │  tags    │
    └──────────┘

    ┌──────────┐      ┌─────────────┐
    │  badges  │─────▶│ user_badges │
    └──────────┘      └─────────────┘

    ┌──────────────┐   ┌────────────────┐
    │notifications │   │countdown_settings│
    └──────────────┘   └────────────────┘
```

### Key Features

1. **Row Level Security (RLS)**: Tất cả tables đều có RLS policies
2. **Automatic Timestamps**: Auto update `updated_at` với triggers
3. **Foreign Keys**: Cascade deletes để maintain data integrity
4. **Indexes**: Optimized queries với strategic indexes
5. **Default Data**: 11 badges và countdown settings đã được insert

## Troubleshooting

### Lỗi: "permission denied for schema public"

**Giải pháp**: Đảm bảo bạn đang chạy query với service_role hoặc postgres role trong SQL Editor.

### Lỗi: "relation already exists"

**Giải pháp**: Schema đã được tạo rồi. Nếu muốn recreate:
```sql
-- Drop all tables (CẢNH BÁO: Xóa tất cả dữ liệu!)
DROP TABLE IF EXISTS public.countdown_settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.journal_tags CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.wishes CASCADE;
DROP TABLE IF EXISTS public.daily_attendance CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Sau đó chạy lại schema.sql
```

### Lỗi: "new row violates row-level security policy"

**Giải pháp**: Đảm bảo user đã authenticated và có quyền thao tác với data.

## Next Steps

Sau khi setup xong database:

1. ✅ Cài đặt dependencies: `npm install`
2. ✅ Test authentication flow với Login.html
3. ✅ Verify registration flow với Register.html
4. ✅ Test forgot password flow
5. ✅ Check RLS policies hoạt động đúng

## Support

Nếu gặp vấn đề, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Project logs trong Dashboard > Logs
