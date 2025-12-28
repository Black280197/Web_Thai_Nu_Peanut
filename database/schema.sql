-- ============================================
-- HLE Peanut Fan Club Database Schema
-- ============================================
-- 
-- Hướng dẫn sử dụng:
-- 1. Đăng nhập vào Supabase Dashboard
-- 2. Vào SQL Editor
-- 3. Copy và paste toàn bộ script này
-- 4. Run để tạo database schema
-- 
-- ============================================

-- ============================================
-- 1. USERS TABLE (Extended from auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
  avatar_url TEXT,
  bio TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ============================================
-- 2. DAILY ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  attended_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, attended_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.daily_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.daily_attendance(attended_date);

-- ============================================
-- 3. WISHES TABLE (Daily, Birthday, Debut)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'birthday', 'debut')),
  content TEXT NOT NULL,
  sticker TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON public.wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_type ON public.wishes(type);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON public.wishes(status);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON public.wishes(created_at DESC);

-- ============================================
-- 4. JOURNALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'friends')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_privacy ON public.journals(privacy);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON public.journals(created_at DESC);

-- ============================================
-- 5. JOURNAL TAGS TABLE (User tagging)
-- ============================================
CREATE TABLE IF NOT EXISTS public.journal_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID REFERENCES public.journals(id) ON DELETE CASCADE NOT NULL,
  tagged_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journal_id, tagged_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journal_tags_journal_id ON public.journal_tags(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_tags_user_id ON public.journal_tags(tagged_user_id);

-- ============================================
-- 6. FRIENDSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- ============================================
-- 7. BADGES TABLE (11 achievement badges)
-- ============================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('check_ins', 'wishes_sent', 'streak', 'level', 'friends', 'special')),
  criteria_value INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_badges_criteria ON public.badges(criteria_type);

-- Insert default badges (11 badges)
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value, sort_order) VALUES
('Lời Chúc Đầu Tiên', 'Gửi lời chúc đầu tiên của bạn', '✉️', 'wishes_sent', 1, 1),
('Người Hâm Mộ Trung Thành', 'Gửi 11 lời chúc', '💌', 'wishes_sent', 11, 2),
('Kiên Nhẫn', 'Điểm danh 300 ngày (tượng trưng cho dự án 302)', '🌱', 'check_ins', 300, 3),
('Hộ Vệ Trung Thành', 'Đạt level 10', '⭐', 'level', 10, 4),
('Chuỗi Ngày Hoàn Hảo', 'Duy trì streak 30 ngày liên tiếp', '🔥', 'streak', 30, 5),
('Người Kết Nối', 'Kết bạn với 10 người', '🤝', 'friends', 10, 6),
('Siêu Sao', 'Đạt level 20', '💫', 'level', 20, 7),
('Huyền Thoại', 'Điểm danh 365 ngày', '👑', 'check_ins', 365, 8),
('Người Truyền Cảm Hứng', 'Gửi 50 lời chúc', '🎁', 'wishes_sent', 50, 9),
('Thành Viên Đặc Biệt', 'Tham gia từ những ngày đầu', '🏅', 'special', NULL, 10),
('Người Bạn Đồng Hành', 'Chuỗi điểm danh 100 ngày', '💖', 'streak', 100, 11)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. USER BADGES TABLE (Achievements earned)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wish_approved', 'wish_rejected', 'friend_request', 'friend_accepted', 'badge_awarded', 'check_in_reminder', 'system')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- 10. COUNTDOWN SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.countdown_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('return_date', 'birthday', 'debut_anniversary')),
  target_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default countdown (180 days from now)
INSERT INTO public.countdown_settings (event_type, target_date, title, description, is_active) VALUES
('return_date', CURRENT_DATE + INTERVAL '180 days', 'Ngày Trở Về', 'Đếm ngược đến ngày Peanut xuất ngũ', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countdown_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view all active users"
  ON public.users FOR SELECT
  USING (status = 'active' OR auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any user profile"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );



-- ============================================
-- DAILY ATTENDANCE POLICIES
-- ============================================
CREATE POLICY "Users can view their own attendance"
  ON public.daily_attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance"
  ON public.daily_attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- WISHES POLICIES
-- ============================================
CREATE POLICY "Users can view approved wishes"
  ON public.wishes FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can insert their own wishes"
  ON public.wishes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any wish"
  ON public.wishes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all wishes"
  ON public.wishes FOR SELECT
  USING (
    status = 'approved' 
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- JOURNALS POLICIES
-- ============================================
CREATE POLICY "Users can view public journals"
  ON public.journals FOR SELECT
  USING (
    privacy = 'public' 
    OR user_id = auth.uid()
    OR (
      privacy = 'friends' 
      AND EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = user_id)
          OR (requester_id = user_id AND addressee_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can manage their own journals"
  ON public.journals FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FRIENDSHIPS POLICIES
-- ============================================
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can respond to friend requests"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

-- ============================================
-- BADGES POLICIES
-- ============================================
CREATE POLICY "Everyone can view badges"
  ON public.badges FOR SELECT
  USING (TRUE);

-- ============================================
-- USER BADGES POLICIES
-- ============================================
CREATE POLICY "Users can view all user badges"
  ON public.user_badges FOR SELECT
  USING (TRUE);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- COUNTDOWN SETTINGS POLICIES
-- ============================================
CREATE POLICY "Everyone can view countdown settings"
  ON public.countdown_settings FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage countdown settings"
  ON public.countdown_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update users.updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update wishes.updated_at
CREATE TRIGGER update_wishes_updated_at
  BEFORE UPDATE ON public.wishes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update journals.updated_at
CREATE TRIGGER update_journals_updated_at
  BEFORE UPDATE ON public.journals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'member',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMPLETED!
-- ============================================
-- 
-- Schema đã được tạo thành công!
-- 
-- Các bước tiếp theo:
-- 1. Configure OAuth providers (Google, Twitter, Discord) trong Supabase Dashboard
-- 2. Configure email templates trong Authentication > Email Templates
-- 3. Set redirect URLs trong Authentication > URL Configuration
-- 4. Test authentication flow
-- 
-- ============================================
