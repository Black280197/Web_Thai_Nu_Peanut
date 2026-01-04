// Admin Dashboard JS - Updated with Toast Notifications and Image Upload
import { requireAdmin, supabase } from './supabase-client.js'
import { handleLogout } from './auth.js'
import { showToast, sanitizeHTML, showConfirm, uploadImage } from './utils.js'

// Require admin access
const user = await requireAdmin()

// Global state
let currentEventImage = null

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
      } else if (targetId === 'events') {
        loadEvents()
      } else if (targetId === 'site-settings') {
        loadSiteSettings()
      } else if (targetId === 'settings') {
        loadSettings()
      }
    })
  })
}

function updateHeader(tabId) {
  const titles = {
    users: 'User Management',
    wishes: 'Wishes Management',
    events: 'Events Management',
    'site-settings': 'Site Settings',
    settings: 'Countdown Settings'
  }
  
  const subtitles = {
    users: 'Manage accounts, permissions and status for the fan club',
    wishes: 'Review and manage birthday wishes from the fan club',
    events: 'Create and manage events and news posts',
    'site-settings': 'Customize text and content across the site',
    settings: 'Configure countdown and system settings'
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
    document.getElementById('admin-count').textContent = users.filter(u => u.role === 'admin').length
    document.getElementById('member-count').textContent = users.filter(u => u.role === 'member').length
    
    // Calculate active users (updated in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const activeCount = users.filter(u => new Date(u.updated_at) > oneDayAgo).length
    document.getElementById('active-users').textContent = activeCount
    
    // Render users table
    renderUsersTable(users)
  } catch (error) {
    console.error('Error loading users:', error)
    showToast('Failed to load users', 'error')
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body')
  if (!tbody) return
  
  tbody.innerHTML = users.map(user => {
    const joinDate = new Date(user.created_at).toLocaleDateString()
    const roleColor = user.role === 'admin' ? 'text-gold' : 'text-blue-400'
    
    return `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold">
              ${user.username ? user.username[0].toUpperCase() : 'U'}
            </div>
            <span class="font-medium">${user.username || 'Unknown'}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-slate-400">${user.email}</td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${roleColor} bg-white/5">
            ${user.role}
          </span>
        </td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-semibold text-green-400 bg-green-500/10">
            Active
          </span>
        </td>
        <td class="px-6 py-4 text-slate-400">${joinDate}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <select onchange="changeUserRole('${user.id}', this.value)" class="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm">
              <option value="member" ${user.role === 'member' ? 'selected' : ''}>Member</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <button onclick="deleteUser('${user.id}')" class="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

// Change user role
window.changeUserRole = async function(userId, newRole) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
    
    if (error) throw error
    
    showToast('Role updated successfully!', 'success')
    loadUsers()
  } catch (error) {
    console.error('Error updating role:', error)
    showToast('Failed to update role: ' + error.message, 'error')
  }
}

// Delete user
window.deleteUser = function(userId) {
  showConfirm('Are you sure you want to delete this user? This action cannot be undone.', async () => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      
      showToast('User deleted successfully!', 'success')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showToast('Failed to delete user: ' + error.message, 'error')
    }
  })
}

// ============= WISHES MANAGEMENT =============

async function loadWishes() {
  try {
    const { data: wishes, error } = await supabase
      .from('wishes')
      .select(`
        *,
        user:user_id (username, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Update stats
    const pending = wishes.filter(w => w.status === 'pending').length
    const approved = wishes.filter(w => w.status === 'approved').length
    const rejected = wishes.filter(w => w.status === 'rejected').length
    
    document.getElementById('pending-wishes-stat').textContent = pending
    document.getElementById('approved-wishes-stat').textContent = approved
    document.getElementById('rejected-wishes-stat').textContent = rejected
    
    // Update sidebar count
    const countBadge = document.getElementById('pending-wishes-count')
    if (pending > 0) {
      countBadge.textContent = pending
      countBadge.classList.remove('hidden')
    } else {
      countBadge.classList.add('hidden')
    }
    
    // Render wishes
    renderWishesList(wishes.filter(w => w.status === 'pending'))
  } catch (error) {
    console.error('Error loading wishes:', error)
    showToast('Failed to load wishes', 'error')
  }
}

function renderWishesList(wishes) {
  const container = document.getElementById('wishes-list')
  if (!container) return
  
  if (wishes.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-8">No pending wishes</p>'
    return
  }
  
  container.innerHTML = wishes.map(wish => {
    const date = new Date(wish.created_at).toLocaleDateString()
    
    return `
      <div class="bg-white/5 rounded-xl p-6 border border-white/5">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold">
              ${wish.user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p class="font-semibold">${wish.user?.username || 'Unknown'}</p>
              <p class="text-xs text-slate-400">${date}</p>
            </div>
          </div>
          ${wish.sticker ? `<span class="text-3xl">${wish.sticker}</span>` : ''}
        </div>
        <p class="text-slate-300 mb-4 whitespace-pre-wrap">${wish.content}</p>
        ${wish.image_url ? `
          <img src="${wish.image_url}" alt="Wish image" class="w-full max-w-xs max-h-48 object-cover rounded-lg mb-4"/>
        ` : ''}
        <div class="flex gap-2">
          <button onclick="moderateWish('${wish.id}', 'approved')" class="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">check</span>
            <span>Approve</span>
          </button>
          <button onclick="moderateWish('${wish.id}', 'rejected')" class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">close</span>
            <span>Reject</span>
          </button>
        </div>
      </div>
    `
  }).join('')
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
    
    showToast(
      status === 'approved' ? 'Wish approved!' : 'Wish rejected!',
      'success'
    )
    loadWishes()
  } catch (error) {
    console.error('Error moderating wish:', error)
    showToast('Failed to update wish: ' + error.message, 'error')
  }
}

// ============= COUNTDOWN SETTINGS =============

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

// Save countdown settings
document.getElementById('save-countdown-settings')?.addEventListener('click', async () => {
  try {
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
  } catch (error) {
    console.error('Error saving settings:', error)
    showToast('Failed to save settings: ' + error.message, 'error')
  }
})

// Continue in next part...
// Part 2: Events Management and Site Settings

// ============= EVENTS MANAGEMENT =============

let currentEventFilter = 'all'

// Load events
async function loadEvents() {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        author:author_id (username)
      `)
      .order('created_at', { ascending: false })
    
    if (currentEventFilter !== 'all') {
      query = query.eq('status', currentEventFilter)
    }
    
    const { data: events, error } = await query
    
    if (error) throw error
    
    renderEventsList(events || [])
  } catch (error) {
    console.error('Error loading events:', error)
    showToast('Failed to load events', 'error')
  }
}

// Render events list
function renderEventsList(events) {
  const container = document.getElementById('events-list')
  if (!container) return
  
  if (events.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-8">No events found</p>'
    return
  }
  
  container.innerHTML = events.map(event => {
    const createdDate = new Date(event.created_at).toLocaleDateString()
    const statusColors = {
      published: 'bg-green-500/20 text-green-400 border-green-500/30',
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    const statusIcons = {
      published: '✅',
      draft: '📝',
      archived: '📦'
    }
    
    return `
      <div class="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-primary/30 transition-all">
        <div class="flex gap-4">
          ${event.image_url ? `
            <img src="${event.image_url}" alt="${event.title}" class="w-32 h-32 rounded-lg object-cover flex-shrink-0" />
          ` : `
            <div class="w-32 h-32 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-5xl text-slate-400">event_note</span>
            </div>
          `}
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h4 class="text-lg font-bold text-white truncate flex-1">${event.title}</h4>
              <span class="px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[event.status]} whitespace-nowrap">
                ${statusIcons[event.status]} ${event.status}
              </span>
            </div>
            <p class="text-sm text-slate-400 mb-2 line-clamp-2">${event.excerpt || event.content.substring(0, 100) + '...'}</p>
            <div class="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">person</span>
                ${event.author?.username || 'Admin'}
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">calendar_today</span>
                ${createdDate}
              </span>
              ${event.view_count ? `
                <span>•</span>
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">visibility</span>
                  ${event.view_count} views
                </span>
              ` : ''}
            </div>
            <div class="flex gap-2">
              <button onclick="viewEventDetail('${event.id}')" class="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">visibility</span>
                <span>View</span>
              </button>
              <button onclick="editEvent('${event.id}')" class="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">edit</span>
                <span>Edit</span>
              </button>
              <button onclick="deleteEvent('${event.id}')" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">delete</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }).join('')
}

// Show event modal
function showEventModal(event = null) {
  const modal = document.getElementById('event-modal')
  const modalTitle = document.getElementById('event-modal-title')
  const form = document.getElementById('event-form')
  
  if (!modal) return
  
  // Reset image state
  currentEventImage = null
  document.getElementById('event-image-preview').classList.add('hidden')
  document.getElementById('event-image-url').value = ''
  
  if (event) {
    modalTitle.querySelector('span:last-child').textContent = 'Edit Event'
    document.getElementById('event-id').value = event.id
    document.getElementById('event-title').value = event.title
    document.getElementById('event-excerpt').value = event.excerpt || ''
    document.getElementById('event-content').value = event.content
    document.getElementById('event-image-url').value = event.image_url || ''
    document.getElementById('event-status').value = event.status
    
    // Show image preview if exists
    if (event.image_url) {
      currentEventImage = event.image_url
      showImagePreview(event.image_url)
    }
  } else {
    modalTitle.querySelector('span:last-child').textContent = 'New Event'
    form.reset()
    document.getElementById('event-id').value = ''
  }
  
  modal.classList.remove('hidden')
}

// Close event modal
function closeEventModal() {
  const modal = document.getElementById('event-modal')
  if (modal) modal.classList.add('hidden')
  currentEventImage = null
}

// Show image preview
function showImagePreview(url) {
  const preview = document.getElementById('event-image-preview')
  const img = document.getElementById('event-preview-img')
  img.src = url
  preview.classList.remove('hidden')
}

// Handle image upload
document.getElementById('event-image-file')?.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  try {
    showToast('Uploading image...', 'info')
    
    // Upload to Supabase Storage
    const imageUrl = await uploadImage(file, 'wishes-images', 'events', supabase)
    
    currentEventImage = imageUrl
    document.getElementById('event-image-url').value = imageUrl
    showImagePreview(imageUrl)
    
    showToast('Image uploaded successfully!', 'success')
  } catch (error) {
    console.error('Upload error:', error)
    showToast('Upload failed: ' + error.message, 'error')
  }
})

// Handle image URL input
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

// View event detail
window.viewEventDetail = async function(eventId) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        author:author_id (username)
      `)
      .eq('id', eventId)
      .single()
    
    if (error) throw error
    
    const modal = document.getElementById('event-detail-modal')
    const content = document.getElementById('event-detail-content')
    
    const publishedDate = event.published_at 
      ? new Date(event.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Not published'
    
    content.innerHTML = `
      ${event.image_url ? `
        <div class="w-full h-64 rounded-xl overflow-hidden mb-6">
          <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover" />
        </div>
      ` : ''}
      <div class="space-y-4">
        <div>
          <h2 class="text-3xl font-bold mb-2">${event.title}</h2>
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">person</span>
              ${event.author?.username || 'Admin'}
            </span>
            <span>•</span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">calendar_today</span>
              ${publishedDate}
            </span>
            ${event.view_count ? `
              <span>•</span>
              <span>${event.view_count} views</span>
            ` : ''}
          </div>
        </div>
        ${event.excerpt ? `
          <div class="p-4 bg-white/5 rounded-lg border-l-4 border-primary">
            <p class="text-slate-300 italic">${event.excerpt}</p>
          </div>
        ` : ''}
        <div class="prose prose-invert max-w-none">
          ${sanitizeHTML(event.content)}
        </div>
      </div>
    `
    
    modal.classList.remove('hidden')
  } catch (error) {
    console.error('Error loading event:', error)
    showToast('Failed to load event details', 'error')
  }
}

// Close event detail modal
document.getElementById('close-event-detail-modal')?.addEventListener('click', () => {
  document.getElementById('event-detail-modal').classList.add('hidden')
})

// Edit event
window.editEvent = async function(eventId) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    
    if (error) throw error
    
    showEventModal(event)
  } catch (error) {
    console.error('Error loading event:', error)
    showToast('Failed to load event', 'error')
  }
}

// Delete event
window.deleteEvent = function(eventId) {
  showConfirm('Are you sure you want to delete this event?', async () => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
      
      if (error) throw error
      
      showToast('Event deleted successfully!', 'success')
      loadEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      showToast('Failed to delete event: ' + error.message, 'error')
    }
  })
}

// Handle event form submission
document.getElementById('event-form')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const eventId = document.getElementById('event-id').value
  const title = document.getElementById('event-title').value
  const excerpt = document.getElementById('event-excerpt').value
  const content = document.getElementById('event-content').value
  const status = document.getElementById('event-status').value
  
  try {
    // Sanitize HTML content
    const sanitizedContent = sanitizeHTML(content)
    
    const eventData = {
      title,
      excerpt: excerpt || null,
      content: sanitizedContent,
      image_url: currentEventImage || null,
      status,
      updated_at: new Date().toISOString()
    }
    
    if (eventId) {
      // Update existing event
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
      
      if (error) throw error
      showToast('Event updated successfully!', 'success')
    } else {
      // Create new event
      eventData.author_id = user.id
      eventData.published_at = status === 'published' ? new Date().toISOString() : null
      
      const { error } = await supabase
        .from('events')
        .insert([eventData])
      
      if (error) throw error
      showToast('Event created successfully!', 'success')
    }
    
    closeEventModal()
    loadEvents()
  } catch (error) {
    console.error('Error saving event:', error)
    showToast('Failed to save event: ' + error.message, 'error')
  }
})

// Event filter buttons
document.querySelectorAll('.event-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentEventFilter = btn.dataset.status
    
    // Update active button
    document.querySelectorAll('.event-filter-btn').forEach(b => {
      b.classList.remove('bg-primary', 'text-white')
      b.classList.add('text-slate-600', 'dark:text-slate-400')
    })
    btn.classList.add('bg-primary', 'text-white')
    btn.classList.remove('text-slate-600', 'dark:text-slate-400')
    
    loadEvents()
  })
})

// Add event button
document.getElementById('add-event-btn')?.addEventListener('click', () => {
  showEventModal()
})

// Close modal buttons
document.getElementById('close-event-modal')?.addEventListener('click', closeEventModal)
document.getElementById('cancel-event')?.addEventListener('click', closeEventModal)

// ============= SITE SETTINGS =============

// Load site settings
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

// Save site settings
document.getElementById('save-site-settings')?.addEventListener('click', async () => {
  try {
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
  } catch (error) {
    console.error('Error saving site settings:', error)
    showToast('Failed to save settings: ' + error.message, 'error')
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
