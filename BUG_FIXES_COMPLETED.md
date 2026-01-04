# BUG FIXES & NEW FEATURES COMPLETED

## 🐛 Bug Fixes:

### 1. ✅ Site Settings RLS Policy Error
**Problem**: `new row violates row-level security policy for table "site_settings"`
**Solution**: 
- Added INSERT policy for site_settings table
- Policy allows admin users to insert new settings via UPSERT
- File: `database/current_query.sql` (line 505-515)
- Migration: `database/migration_fix_bugs.sql`

### 2. ✅ Countdown Time Selection Bug
**Problem**: Countdown settings only saved date, not specific time
**Solution**:
- Changed `target_date` column from `DATE` to `TIMESTAMPTZ`
- Updated admin-dashboard.js to combine date + time inputs
- Users can now select specific hour and minute
- File changes:
  - `database/current_query.sql` (line 198-203)
  - `public/js/admin-dashboard.js` (loadSettings, save handler)
  - `public/admin-dashboard.html` (split date/time inputs)

### 3. ✅ About Menu Not Opening Popup
**Problem**: Clicking "About" in navbar did nothing
**Solution**:
- Added About modal to index.html
- Added click handler in countdown.js
- Loads content from site_settings.about_content
- Supports HTML content (sanitized)
- Auto-popup on homepage if about_popup_enabled = true
- Files:
  - `public/index.html` (About link + modal HTML)
  - `public/js/countdown.js` (modal handlers)

## 🎉 New Features:

### 4. ✅ Google OAuth Login
**Implementation**:
- OAuth already configured, now syncs avatar automatically
- When user logs in with Google, avatar_url from Google profile is saved
- Updates public.users.avatar_url field
- Files modified:
  - `public/js/auth.js` (handleOAuthLogin, syncOAuthUserData)
  - `public/js/supabase-client.js` (onAuthStateChange)
  - `public/auth-callback.html` (NEW - OAuth redirect handler)

### 5. ✅ Avatar Upload for Registration
**Implementation**:
- Users can upload profile picture during registration
- Optional field (not required)
- Validates file size (max 2MB) and type (images only)
- Uploads to Supabase Storage: wishes-images/avatars/
- Preview shown before submission
- Files modified:
  - `public/register.html` (avatar upload UI)
  - `public/js/register.js` (file handling + preview)
  - `public/js/auth.js` (handleRegister with avatar parameter)

## 📋 Migration Steps:

### Step 1: Run Database Migration
```sql
-- Open Supabase SQL Editor and run:
-- File: database/migration_fix_bugs.sql

-- This will:
-- 1. Add INSERT policy for site_settings
-- 2. Change countdown target_date to TIMESTAMPTZ
```

### Step 2: Enable Google OAuth in Supabase
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials from Google Cloud Console
4. Set redirect URL to: `https://your-domain.com/auth-callback.html`

### Step 3: Test Features
- ✅ Test site settings save (should work now)
- ✅ Test countdown with specific time selection
- ✅ Click About menu → modal should appear
- ✅ Login with Google → avatar should sync
- ✅ Register new account with avatar upload

## 🔧 Technical Details:

### Site Settings UPSERT
```javascript
// Now uses upsert with onConflict
await supabase
  .from('site_settings')
  .upsert({
    setting_key: 'login_slogan',
    setting_value: sanitizeHTML(loginSlogan),
    updated_at: new Date().toISOString(),
    updated_by: user.id
  }, {
    onConflict: 'setting_key'
  })
```

### Countdown Date + Time
```javascript
// Combines separate inputs
const returnDate = document.getElementById('return-date').value
const returnTime = document.getElementById('return-time').value || '00:00'
const targetDateTime = new Date(`${returnDate}T${returnTime}:00`)

// Saves as ISO string with timezone
target_date: targetDateTime.toISOString()
```

### Google Avatar Sync
```javascript
// Auto-syncs on login
if (session.user.user_metadata?.avatar_url) {
  await supabase
    .from('users')
    .update({ 
      avatar_url: session.user.user_metadata.avatar_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.user.id)
}
```

### Registration Avatar Upload
```javascript
// Uploads to Storage then saves URL
let avatarUrl = null
if (avatarFile) {
  avatarUrl = await uploadImage(avatarFile, 'wishes-images', 'avatars', supabase)
}

// Passes to signup
await supabase.auth.signUp({
  email: email.trim(),
  password: password,
  options: {
    data: {
      username: username.trim(),
      avatar_url: avatarUrl
    }
  }
})
```

### About Modal Auto-Popup
```javascript
// Checks setting and shows after 1 second delay
const { data } = await supabase
  .from('site_settings')
  .select('setting_value')
  .eq('setting_key', 'about_popup_enabled')
  .single()

if (data && data.setting_value === 'true') {
  setTimeout(() => {
    aboutModal.classList.remove('hidden')
    loadAboutContent()
  }, 1000)
}
```

## ✅ Testing Checklist:

### Site Settings:
- [ ] Open Admin Dashboard → Site Settings
- [ ] Change login slogan to include HTML: `<strong>Test</strong>`
- [ ] Toggle "Show About Popup" on
- [ ] Click Save → should succeed (no RLS error)
- [ ] Check login page → slogan should show with bold text

### Countdown:
- [ ] Open Admin Dashboard → Countdown Settings
- [ ] Select date: 2026-06-15
- [ ] Select time: 14:30
- [ ] Click Save → should succeed
- [ ] Refresh page → date and time should persist correctly

### About Menu:
- [ ] Go to homepage (index.html)
- [ ] Click "About" in navbar
- [ ] Modal should appear with content from database
- [ ] Click X or backdrop → modal should close
- [ ] If about_popup_enabled is true → modal shows on page load

### Google Login:
- [ ] Click "Sign in with Google" on login page
- [ ] Complete Google authentication
- [ ] Redirects to auth-callback.html then homepage
- [ ] Check profile → avatar should be Google profile picture
- [ ] Check database → users.avatar_url should contain Google URL

### Registration Avatar:
- [ ] Go to register page
- [ ] Fill in username, email, password
- [ ] Click "Choose Image" and select photo
- [ ] Preview should show selected image
- [ ] Complete registration
- [ ] Check profile → avatar should be uploaded image
- [ ] Check database → users.avatar_url should contain Supabase Storage URL

## 🎊 All Done!

All 5 bugs/features have been implemented and are ready for testing!

**Next Steps**:
1. Run migration SQL (migration_fix_bugs.sql)
2. Enable Google OAuth in Supabase
3. Test each feature according to checklist
4. Enjoy your improved website! 🚀
