# User Feedback System - Completed

## Ngày: 2026-01-04

## Tổng quan
Thêm chức năng gửi ý kiến/feedback cho admin, cho phép users gửi suggestions và admin quản lý centralized.

## Database Schema

### Bảng `feedback`
```sql
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  read_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
```

### RLS Policies
1. **Users can view their own feedback** - SELECT với `auth.uid() = user_id`
2. **Admins can view all feedback** - SELECT với admin role OR own feedback
3. **Authenticated users can insert feedback** - INSERT yêu cầu `auth.uid() = user_id`
4. **Admins can update feedback** - UPDATE cho phép admins mark as read

## Frontend Implementation

### 1. Floating Feedback Button (`public/index.html`)

**HTML Structure (Lines ~208-265):**
```html
<!-- Floating feedback button (bottom-right) -->
<button id="feedback-button" class="hidden fixed bottom-6 right-6 z-40 size-14 
  bg-gradient-to-br from-primary to-pink-600 rounded-full 
  shadow-lg shadow-primary/30 hover:shadow-primary/50 
  flex items-center justify-center group">
  <span class="material-symbols-outlined text-white text-2xl">mail</span>
  <div class="tooltip">Send Feedback</div>
</button>

<!-- Feedback Modal -->
<div id="feedback-modal" class="hidden fixed inset-0 z-50 
  flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
  <div class="bg-surface-dark rounded-2xl max-w-lg w-full p-6 shadow-2xl">
    <h3 class="text-xl font-bold mb-4">Send Feedback</h3>
    
    <!-- Subject input (max 100 chars) -->
    <input id="feedback-subject" type="text" maxlength="100" 
      placeholder="Subject" class="w-full mb-4" />
    
    <!-- Message textarea (max 1000 chars) -->
    <textarea id="feedback-message" rows="6" maxlength="1000" 
      placeholder="Your feedback or suggestions..."></textarea>
    
    <!-- Character counter -->
    <div class="text-sm text-slate-400 mb-4">
      <span id="char-count">0</span>/1000 characters
    </div>
    
    <!-- Error/success messages -->
    <div id="feedback-error" class="hidden mb-4 p-3 bg-red-500/20 
      text-red-200 rounded-lg"></div>
    <div id="feedback-success" class="hidden mb-4 p-3 bg-green-500/20 
      text-green-200 rounded-lg"></div>
    
    <!-- Action buttons -->
    <div class="flex gap-3 justify-end">
      <button id="cancel-feedback" class="px-4 py-2 text-slate-400">Cancel</button>
      <button id="submit-feedback" class="px-6 py-2 bg-primary rounded-lg">Send</button>
    </div>
  </div>
</div>
```

**Features:**
- ✅ Floating action button (chỉ hiện khi đã login)
- ✅ Tooltip hiển thị "Send Feedback" khi hover
- ✅ Modal với backdrop blur effect
- ✅ Character counter real-time
- ✅ Error/success message display

### 2. Feedback JavaScript Logic (`public/js/countdown.js`)

**Show Button Logic (Lines ~243-247):**
```javascript
const feedbackButton = document.getElementById('feedback-button')
if (user && feedbackButton) {
  feedbackButton.classList.remove('hidden')
}
```

**Character Counter (Lines ~260-262):**
```javascript
feedbackMessage.addEventListener('input', () => {
  charCount.textContent = feedbackMessage.value.length
})
```

**Form Submission (Lines ~286-320):**
```javascript
submitFeedbackBtn.addEventListener('click', async () => {
  const subject = feedbackSubject.value.trim()
  const message = feedbackMessage.value.trim()
  
  // Validation
  if (!subject || !message) {
    showFeedbackError('Please fill in all fields')
    return
  }
  
  if (!user) {
    showFeedbackError('You must be logged in to send feedback')
    return
  }
  
  // Insert to database
  const { error } = await supabase.from('feedback').insert([{
    user_id: user.id,
    subject: subject,
    message: message,
    status: 'unread'
  }])
  
  if (error) {
    showFeedbackError('Failed to send feedback. Please try again.')
    return
  }
  
  // Success
  showFeedbackSuccess('Thank you for your feedback!')
  
  // Reset form and auto-close after 2 seconds
  setTimeout(() => {
    feedbackModal.classList.add('hidden')
    feedbackSubject.value = ''
    feedbackMessage.value = ''
    charCount.textContent = '0'
    document.getElementById('feedback-success').classList.add('hidden')
  }, 2000)
})
```

**Modal Controls:**
- ✅ Open modal on button click
- ✅ Close on X button, Cancel button, or backdrop click
- ✅ Auto-close after successful submission

### 3. Admin Dashboard Management (`public/admin-dashboard.html`)

**Navigation Tab (Lines ~103-110):**
```html
<a id="nav-feedback" class="nav-tab flex items-center gap-3 px-4 py-3 
  rounded-full text-slate-600 dark:text-slate-400 
  hover:bg-pink-50 dark:hover:bg-white/5 transition-colors group" 
  href="#feedback">
  <span class="material-symbols-outlined">mail</span>
  <span class="text-sm font-medium">Feedback</span>
  <span id="unread-feedback-count" class="ml-auto bg-primary/20 
    text-primary px-2 py-0.5 rounded-full text-[10px] font-bold hidden">0</span>
</a>
```

**Tab Content (Lines ~298-333):**
```html
<div id="tab-feedback" class="tab-content hidden">
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-bold">User Feedback</h3>
        <p class="text-sm text-slate-500">View and manage feedback from users</p>
      </div>
      <div class="text-sm text-slate-500">
        <span id="total-feedback-count">0</span> total submissions
      </div>
    </div>
    
    <!-- Filter buttons -->
    <div class="flex gap-2 flex-wrap">
      <button class="feedback-filter-btn active" data-filter="all">All</button>
      <button class="feedback-filter-btn" data-filter="unread">Unread</button>
      <button class="feedback-filter-btn" data-filter="read">Read</button>
    </div>
    
    <!-- Feedback list -->
    <div class="bg-surface-light/50 dark:bg-surface-dark/50 rounded-xl border">
      <div id="feedback-list" class="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        <!-- Populated by JavaScript -->
      </div>
    </div>
  </div>
</div>
```

### 4. Admin Dashboard JavaScript (`public/js/admin-dashboard.js`)

**Load Feedback (Lines ~853-879):**
```javascript
async function loadFeedback(statusFilter = 'all') {
  currentFeedbackFilter = statusFilter
  
  let query = supabase
    .from('feedback')
    .select(`*, user:users(username, email)`)
  
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  
  const { data: feedbackItems, error } = await query
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  renderFeedbackList(feedbackItems || [])
  updateFeedbackCounts(feedbackItems || [])
}
```

**Render Feedback List (Lines ~881-948):**
```javascript
function renderFeedbackList(feedbackItems) {
  const container = document.getElementById('feedback-list')
  
  if (feedbackItems.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-6xl">mail</span>
        <p class="text-slate-500">No feedback found</p>
      </div>
    `
    return
  }
  
  container.innerHTML = feedbackItems.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    
    const isUnread = item.status === 'unread'
    const statusBadge = isUnread 
      ? '<span class="badge badge-yellow">Unread</span>'
      : '<span class="badge badge-green">Read</span>'
    
    const messagePreview = item.message.length > 100 
      ? item.message.substring(0, 100) + '...' 
      : item.message
    
    return `
      <div class="feedback-item ${isUnread ? 'unread' : ''}">
        <div class="flex items-start justify-between">
          <div>
            <span class="font-medium">${item.user?.username}</span>
            ${statusBadge}
          </div>
          <span class="text-xs text-slate-500">${date}</span>
        </div>
        
        <h4 class="font-medium">${escapeHtml(item.subject)}</h4>
        <p class="text-sm feedback-preview-${item.id}">${escapeHtml(messagePreview)}</p>
        
        ${item.message.length > 100 ? `
          <button onclick="toggleFeedbackMessage('${item.id}')">Show more</button>
        ` : ''}
        
        ${isUnread ? `
          <button onclick="markFeedbackAsRead('${item.id}')">
            <span class="material-symbols-outlined">done</span>
            Mark as Read
          </button>
        ` : ''}
      </div>
    `
  }).join('')
}
```

**Mark as Read (Lines ~989-1012):**
```javascript
window.markFeedbackAsRead = async function(feedbackId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('feedback')
    .update({
      status: 'read',
      read_by: user.id,
      read_at: new Date().toISOString()
    })
    .eq('id', feedbackId)
  
  if (error) throw error
  
  showToast('Feedback marked as read', 'success')
  loadFeedback(currentFeedbackFilter)
  updateUnreadCount()
}
```

**Update Unread Counter (Lines ~1023-1043):**
```javascript
async function updateUnreadCount() {
  const { count, error } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread')
  
  if (error) throw error
  
  const badge = document.getElementById('unread-feedback-count')
  if (badge) {
    if (count > 0) {
      badge.textContent = count
      badge.classList.remove('hidden')
    } else {
      badge.classList.add('hidden')
    }
  }
}
```

**Filter Buttons (Lines ~1045-1060):**
```javascript
document.querySelectorAll('.feedback-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active state
    document.querySelectorAll('.feedback-filter-btn').forEach(b => {
      b.classList.remove('active', 'bg-primary/20', 'text-primary')
      b.classList.add('text-slate-600', 'dark:text-slate-400')
    })
    
    btn.classList.add('active', 'bg-primary/20', 'text-primary')
    btn.classList.remove('text-slate-600', 'dark:text-slate-400')
    
    const filter = btn.dataset.filter
    loadFeedback(filter)
  })
})
```

**Tab Integration (Lines ~56-62, ~76-82):**
```javascript
// In initTabs()
if (targetId === 'feedback') {
  loadFeedback('all')
}

// In updateHeader()
feedback: 'User Feedback',
// ...
feedback: 'View and manage feedback from users',

// In initialization
updateUnreadCount() // Update badge on load
```

## User Flow

### 1. Submitting Feedback (User Side)
1. User đăng nhập vào bất kỳ page nào (index, birthday-wishes, etc.)
2. Thấy floating mail button ở góc dưới bên phải
3. Click vào button → Modal hiện ra
4. Nhập subject (max 100 chars) và message (max 1000 chars)
5. Character counter update real-time
6. Click "Send" → Feedback được lưu vào database với status 'unread'
7. Success message hiện ra, form reset, modal tự đóng sau 2 giây

### 2. Managing Feedback (Admin Side)
1. Admin login vào admin dashboard
2. Thấy "Feedback" tab với unread counter badge (nếu có unread)
3. Click vào Feedback tab
4. Thấy danh sách feedback với filters: All / Unread / Read
5. Mỗi feedback item hiển thị:
   - Username và email của người gửi
   - Subject và message (truncated nếu dài)
   - Timestamp
   - Status badge (Unread/Read)
   - "Show more" button nếu message dài
   - "Mark as Read" button nếu chưa đọc
6. Click "Mark as Read" → Status update, unread counter giảm
7. Click filter buttons để xem theo trạng thái

## Features Summary

### User Features
- ✅ Floating action button (non-intrusive)
- ✅ Modal form với validation
- ✅ Character limit (100 subject, 1000 message)
- ✅ Real-time character counter
- ✅ Success/error feedback
- ✅ Auto-close after success
- ✅ Only visible to logged-in users

### Admin Features
- ✅ Dedicated Feedback tab trong admin dashboard
- ✅ Unread counter badge in navigation
- ✅ Filter by status (All/Unread/Read)
- ✅ View sender info (username, email)
- ✅ Expand/collapse long messages
- ✅ Mark as read functionality
- ✅ Total feedback count
- ✅ Sorted by newest first
- ✅ Responsive list with scrolling

### Security Features
- ✅ RLS policies protect user data
- ✅ Users can only view their own feedback
- ✅ Admins can view all feedback
- ✅ Only authenticated users can insert
- ✅ Only admins can mark as read
- ✅ XSS protection with escapeHtml()

## Files Modified
1. ✅ `database/current_query.sql` - Added feedback table and RLS policies
2. ✅ `database/migration_add_feedback.sql` - Standalone migration script
3. ✅ `public/index.html` - Added feedback modal and floating button
4. ✅ `public/js/countdown.js` - Added feedback submission logic
5. ✅ `public/admin-dashboard.html` - Added feedback tab UI
6. ✅ `public/js/admin-dashboard.js` - Added feedback management functions

## Migration Script
Run: `database/migration_add_feedback.sql`

## Testing Checklist
- [ ] User login và thấy floating button
- [ ] Click button → modal mở
- [ ] Character counter hoạt động
- [ ] Submit feedback thành công
- [ ] Modal đóng sau 2 giây
- [ ] Admin thấy feedback trong dashboard
- [ ] Unread counter hiển thị đúng
- [ ] Filter buttons hoạt động
- [ ] Mark as read cập nhật status
- [ ] Unread counter giảm sau mark as read
- [ ] Long messages có "Show more"
- [ ] RLS policies prevent unauthorized access

## Future Enhancements
- [ ] Reply to feedback (2-way communication)
- [ ] Email notification khi có feedback mới
- [ ] Feedback categories/tags
- [ ] Export feedback to CSV
- [ ] Delete feedback option
- [ ] Search/filter by keyword
- [ ] Pagination for large lists
- [ ] Rich text editor cho message

## Notes
- Feedback button chỉ xuất hiện trên index.html hiện tại
- Có thể thêm vào birthday-wishes.html và các pages khác
- Status chỉ có 2 trạng thái: unread/read (có thể extend thêm resolved, archived, etc.)
- Message length limit 1000 chars (có thể tăng nếu cần)
