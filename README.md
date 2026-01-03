# 🌸 HLE Peanut Fan Club Website

Website cộng đồng người hâm mộ Peanut (Wang-ho) - Cựu tuyển thủ HLE Esports đang trong thời gian nhập ngũ.

## ✨ Tính năng chính

### 🔐 Authentication (Đã hoàn thành)
- ✅ Đăng ký tài khoản với email/password/username
- ✅ Đăng nhập với email/password
- ✅ OAuth login (Google, Twitter, Discord)
- ✅ Quên mật khẩu và reset qua email
- ✅ Xác thực email sau đăng ký
- ✅ Session management với Supabase Auth

### ⏰ Countdown Timer
- Đếm ngược đến ngày xuất ngũ
- Khung hình đặc biệt cho tuần sinh nhật và kỷ niệm debut
- Admin có thể thay đổi thời gian đếm ngược

### 💌 Wishes System
- **Daily Wishes**: Gửi lời chúc hàng ngày
- **Birthday Wishes**: Campaign 302 lời chúc sinh nhật
- **Debut Anniversary Wishes**: Lời chúc kỷ niệm debut
- Hệ thống kiểm duyệt của admin
- Hiển thị lời chúc đã được duyệt với effects đặc biệt

### 🌱 Daily Attendance
- Check-in hàng ngày với hình ảnh cây phát triển
- Streak tracking
- Leaderboard top supporters
- Thông báo nhắc nhở nếu quên điểm danh

### 🏆 Badge System
- 11 achievement badges
- Tự động trao tặng khi đạt milestone
- Hiển thị tiến độ và collection

### 👥 Social Features
- Friend system (search, add, accept/reject)
- Daily journal với tagging
- Public/Friends-only privacy

### 📢 Notifications
- Real-time notifications
- Thông báo khi wish được duyệt
- Friend request alerts
- Badge award notifications
- Check-in reminders

### ⚙️ Admin Dashboard
- Admin users (suspend, block, delete)
- Phân quyền admin/member
- Kiểm duyệt wishes
- Thống kê và analytics

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm hoặc yarn
- Supabase account

### Installation

1. **Clone repository**
```bash
git clone https://github.com/Black280197/Web_Thai_Nu_Peanut.git
cd Web_Thai_Nu_Peanut
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Setup Supabase Database**

Làm theo hướng dẫn trong `database/README.md`:
- Chạy `database/schema.sql` trong Supabase SQL Editor
- Configure authentication providers
- Setup email templates

4. **Configure environment variables**

File `.env` đã có sẵn với keys của bạn:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ueoidpcbanfojffhiani.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. **Update Supabase config**

Cập nhật `src/config/supabase.js` với anon key của bạn.

6. **Chạy development server**
```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## 📁 Project Structure

```
Web_Thai_Nu_Peanut/
├── template/                    # HTML templates
│   ├── Login.html              # ✅ Login page
│   ├── Register.html           # ✅ Registration page
│   ├── Forgot-Password.html    # ✅ Password recovery
│   ├── Countdown.html          # Homepage với countdown
│   ├── Daily_Attendance_Tree.html
│   ├── Daily_Well_Wishes_Submission.html
│   ├── Peanut_Birthday_Wishes_Submission.html
│   ├── Peanut_Debut_Wishes_Submission.html
│   ├── User_Profile_And_Badges.html
│   ├── Daily_Journal_Entry.html
│   ├── Freiend_Search_And_Requests.html
│   └── Admin_User_Management_Dashboard.html
│
├── public/
│   └── js/                     # Client-side JavaScript
│       ├── login.js            # ✅ Login logic
│       ├── register.js         # ✅ Registration logic
│       └── forgot-password.js  # ✅ Password recovery logic
│
├── src/
│   ├── config/
│   │   └── supabase.js         # ✅ Supabase client config
│   ├── services/
│   │   └── auth.service.js     # ✅ Authentication service
│   └── utils/
│       └── validation.js       # ✅ Form validation utilities
│
├── database/
│   ├── schema.sql              # ✅ Complete database schema
│   └── README.md               # ✅ Database setup guide
│
├── document/
│   └── Task.md                 # Project requirements
│
├── .env                        # Environment variables
├── .env.example                # Environment template
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🎨 Tech Stack

### Frontend
- **HTML5/CSS3**: Semantic markup
- **TailwindCSS**: Utility-first CSS framework
- **JavaScript ES6+**: Modules, async/await
- **Material Icons**: Google Material Symbols

### Backend & Database
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Email + OAuth)
  - Row Level Security
  - Real-time subscriptions
  
### Authentication
- Email/Password authentication
- OAuth providers: Google, Twitter, Discord
- Email verification
- Password reset flow

## 📊 Database Schema

Chi tiết về database schema xem trong `database/README.md`

### Main Tables:
- `users` - User profiles và metadata
- `daily_attendance` - Check-in records
- `wishes` - Daily/Birthday/Debut wishes
- `journals` - User journals
- `friendships` - Friend connections
- `badges` - Achievement badges (11 badges)
- `user_badges` - Earned badges
- `notifications` - User notifications
- `countdown_settings` - Admin countdown config

## 🔒 Security

- ✅ Row Level Security (RLS) enabled trên tất cả tables
- ✅ Secure password hashing với Supabase Auth
- ✅ Email verification required
- ✅ CSRF protection
- ✅ Input validation và sanitization
- ✅ XSS protection

## 🌐 Deployment

### Recommended Stack:
- **Frontend**: Vercel, Netlify, hoặc Cloudflare Pages
- **Database**: Supabase (already configured)
- **CDN**: Cloudflare

### Deploy với Vercel:
```bash
npm install -g vercel
vercel
```

### Deploy với Netlify:
```bash
npm install -g netlify-cli
netlify deploy
```

## 📝 Development Roadmap

### ✅ Phase 1: Authentication (COMPLETED)
- [x] Login page với form validation
- [x] Registration với email verification
- [x] Password recovery flow
- [x] OAuth integration
- [x] Session management
- [x] Database schema setup

### 🚧 Phase 2: Core Features (IN PROGRESS)
- [ ] Connect Countdown.html với database
- [ ] Implement admin countdown settings
- [ ] Daily attendance check-in logic
- [ ] Wishes submission và moderation
- [ ] User profile với activity history
- [ ] Notification system

### 📅 Phase 3: Gamification
- [ ] Badge award automation
- [ ] XP và leveling system
- [ ] Leaderboards
- [ ] Streak tracking

### 📅 Phase 4: Social Features
- [ ] Friend system
- [ ] Journal entries với tags
- [ ] User search và discovery

### 📅 Phase 5: Admin & Polish
- [ ] Complete admin dashboard
- [ ] Language switching (EN/CN/KR/VI)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Testing và bug fixes

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

ISC License - See LICENSE file for details

## 👨‍💻 Author

- GitHub: [@Black280197](https://github.com/Black280197)

## 🙏 Acknowledgments

- Peanut (Wang-ho) - Inspiration for this project
- HLE Esports community
- Supabase team for amazing BaaS platform

## 📞 Support

Nếu gặp vấn đề:
1. Check `database/README.md` cho database setup
2. Review Supabase Dashboard logs
3. Open issue trên GitHub

---

**Made with ❤️ for HLE Peanut fans worldwide** 🥜✨