// Admin Dashboard JS
import { requireAdmin, supabase, isAdmin } from './supabase-client.js'
import { handleLogout } from './auth.js'

// Require admin access
const user = await requireAdmin()

// Load admin username
async function loadAdminProfile() {
  if (!user) return
  
  const { data } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()
  
  if (data) {
    document.getElementById('admin-username').textContent = data.username || 'Admin'
  }
}

// Tab navigation
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab')
  const tabContents = document.querySelectorAll('.tab-content')
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault()
      const targetId = tab.getAttribute('href').substring(1)
      
      // Update active tab
      tabs.forEach(t => {
        t.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30')
        t.classList.add('text-slate-600', 'dark:text-slate-400')
        const span = t.querySelector('span:first-child')
        if (span) span.classList.remove('fill-1')
      })
      
      tab.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30')
      tab.classList.remove('text-slate-600', 'dark:text-slate-400')
      const span = tab.querySelector('span:first-child')
      if (span) span.classList.add('fill-1')
      
      // Show target content
      tabContents.forEach(content => {
        if (content.id === `tab-${targetId}`) {
          content.classList.remove('hidden')
        } else {
          content.classList.add('hidden')
        }
      })
      
      // Update header
      updateHeader(targetId)
      
      // Load data for the tab
      if (targetId === 'users') {
        loadUsers()
      } else if (targetId === 'wishes') {
        loadWishes()
      } else if (targetId === 'settings') {
        loadSettings()
      }
    })
  })
}

function updateHeader(tabId) {
  const titles = {
    users: 'Admin người dùng',
    wishes: 'Admin lời chúc',
    settings: 'Cài đặt hệ thống'
  }
  
  const subtitles = {
    users: 'Admin tài khoản, phân quyền và trạng thái cho fan club',
    wishes: 'Duyệt và Admin lời chúc sinh nhật từ fan club',
    settings: 'Cấu hình countdown và các thiết lập hệ thống'
  }
  
  document.getElementById('page-title').textContent = titles[tabId] || titles.users
  document.getElementById('page-subtitle').textContent = subtitles[tabId] || subtitles.users
}

// ============= USERS MANAGEMENT =============

async function loadUsers() {
  try {
    // Load all users with role
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, created_at, role, updated_at')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Update stats
    document.getElementById('total-users').textContent = users.length
    
    const adminCount = users.filter(u => u.role === 'admin').length
    const memberCount = users.filter(u => u.role === 'member').length
    
    document.getElementById('admin-count').textContent = adminCount
    document.getElementById('member-count').textContent = memberCount
    
    // Calculate active users (updated today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeCount = users.filter(u => {
      if (!u.updated_at) return false
      const updateDate = new Date(u.updated_at)
      return updateDate >= today
    }).length
    document.getElementById('active-users').textContent = activeCount
    
    // Render users table
    renderUsersTable(users)
    
  } catch (error) {
    console.error('Error loading users:', error)
    alert('Không thể tải danh sách người dùng')
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body')
  tbody.innerHTML = ''
  
  users.forEach(user => {
    const row = document.createElement('tr')
    row.className = 'hover:bg-white/5 transition-colors'
    
    const roleColor = user.role === 'admin' ? 'gold' : 'blue-400'
    const roleIcon = user.role === 'admin' ? 'admin_panel_settings' : 'person'
    
    row.innerHTML = `
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-white font-bold">
            ${user.username ? user.username[0].toUpperCase() : 'U'}
          </div>
          <span class="font-medium">${user.username || 'Unknown'}</span>
        </div>
      </td>
      <td class="px-6 py-4 text-sm text-slate-400">${user.email || 'N/A'}</td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${roleColor}/20 text-${roleColor}">
          <span class="material-symbols-outlined text-sm">${roleIcon}</span>
          ${user.role}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
          <span class="material-symbols-outlined text-sm">check_circle</span>
          Active
        </span>
      </td>
      <td class="px-6 py-4 text-sm text-slate-400">${new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <button onclick="changeUserRole('${user.id}', '${user.role}')" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Đổi role">
            <span class="material-symbols-outlined text-sm">swap_horiz</span>
          </button>
          <button onclick="deleteUser('${user.id}')" class="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Xóa">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </td>
    `
    
    tbody.appendChild(row)
  })
}

// Change user role
window.changeUserRole = async function(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'member' : 'admin'
  
  if (!confirm(`Bạn có chắc muốn đổi role thành ${newRole}?`)) return
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
    
    if (error) throw error
    
    alert('Đã cập nhật role!')
    loadUsers()
  } catch (error) {
    console.error('Error changing role:', error)
    alert('Không thể đổi role: ' + error.message)
  }
}

// Delete user
window.deleteUser = async function(userId) {
  if (!confirm('Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác!')) return
  
  try {
    // Note: This will fail with RLS unless proper policies are set
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
    
    alert('Đã xóa người dùng!')
    loadUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('Không thể xóa người dùng: ' + error.message)
  }
}

// Search and filter users
document.getElementById('search-users')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase()
  const rows = document.querySelectorAll('#users-table-body tr')
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase()
    row.style.display = text.includes(searchTerm) ? '' : 'none'
  })
})

document.getElementById('filter-role')?.addEventListener('change', (e) => {
  const role = e.target.value
  const rows = document.querySelectorAll('#users-table-body tr')
  
  rows.forEach(row => {
    if (role === 'all') {
      row.style.display = ''
    } else {
      const roleText = row.querySelector('td:nth-child(3)').textContent.toLowerCase()
      row.style.display = roleText.includes(role) ? '' : 'none'
    }
  })
})

// ============= WISHES MANAGEMENT =============

async function loadWishes() {
  try {
    // Load wishes with user info
    const { data: wishes, error } = await supabase
      .from('wishes')
      .select('id, content, sticker, status, created_at, users!wishes_user_id_fkey(username)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Update stats
    const pendingCount = wishes.filter(w => w.status === 'pending').length
    const approvedCount = wishes.filter(w => w.status === 'approved').length
    const rejectedCount = wishes.filter(w => w.status === 'rejected').length
    
    document.getElementById('pending-wishes-stat').textContent = pendingCount
    document.getElementById('approved-wishes-stat').textContent = approvedCount
    document.getElementById('rejected-wishes-stat').textContent = rejectedCount
    
    // Update nav badge
    const badge = document.getElementById('pending-wishes-count')
    if (pendingCount > 0) {
      badge.textContent = pendingCount
      badge.classList.remove('hidden')
    } else {
      badge.classList.add('hidden')
    }
    
    // Render pending wishes
    renderWishesList(wishes.filter(w => w.status === 'pending'))
    
  } catch (error) {
    console.error('Error loading wishes:', error)
    alert('Không thể tải danh sách lời chúc')
  }
}

function renderWishesList(wishes) {
  const list = document.getElementById('wishes-list')
  
  if (wishes.length === 0) {
    list.innerHTML = '<p class="text-center text-slate-400">Không có lời chúc nào cần duyệt</p>'
    return
  }
  
  list.innerHTML = ''
  
  wishes.forEach(wish => {
    const card = document.createElement('div')
    card.className = 'p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors'
    
    card.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-semibold">${wish.users?.username || 'Anonymous'}</span>
            <span class="text-2xl">${wish.sticker || '🎉'}</span>
            <span class="text-xs text-slate-400">${new Date(wish.created_at).toLocaleString('vi-VN')}</span>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed">${wish.content}</p>
        </div>
        <div class="flex flex-col gap-2">
          <button onclick="moderateWish('${wish.id}', 'approved')" class="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold hover:bg-green-500/30 transition-colors">
            Duyệt
          </button>
          <button onclick="moderateWish('${wish.id}', 'rejected')" class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors">
            Từ chối
          </button>
        </div>
      </div>
    `
    
    list.appendChild(card)
  })
}

// Moderate wish
window.moderateWish = async function(wishId, status) {
  try {
    const { error } = await supabase
      .from('wishes')
      .update({ 
        status,
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', wishId)
    
    if (error) throw error
    
    alert(status === 'approved' ? 'Đã duyệt lời chúc!' : 'Đã từ chối lời chúc!')
    loadWishes()
  } catch (error) {
    console.error('Error moderating wish:', error)
    alert('Không thể cập nhật: ' + error.message)
  }
}

// ============= SETTINGS MANAGEMENT =============

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
      // Convert to local datetime format
      const date = new Date(data.target_date)
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      document.getElementById('return-date').value = localDate.toISOString().slice(0, 16)
      document.getElementById('countdown-title').value = data.title || ''
      document.getElementById('countdown-description').value = data.description || ''
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

document.getElementById('save-countdown-settings')?.addEventListener('click', async () => {
  try {
    const returnDate = document.getElementById('return-date').value
    const title = document.getElementById('countdown-title').value
    const description = document.getElementById('countdown-description').value
    
    if (!returnDate) {
      alert('Vui lòng chọn ngày trở về')
      return
    }
    
    const { error } = await supabase
      .from('countdown_settings')
      .update({
        target_date: new Date(returnDate).toISOString(),
        title,
        description
      })
      .eq('event_type', 'return_date')
      .eq('is_active', true)
    
    if (error) throw error
    
    alert('Đã lưu cài đặt!')
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Không thể lưu: ' + error.message)
  }
})

// ============= INITIALIZATION =============

// Handle logout
document.getElementById('logout-button')?.addEventListener('click', async () => {
  await handleLogout()
  window.location.href = '/login.html'
})

// Initialize
loadAdminProfile()
initTabs()
loadUsers() // Load users by default
