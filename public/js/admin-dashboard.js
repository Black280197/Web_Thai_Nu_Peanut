// Admin Dashboard JS
import { requireAdmin, supabase, isAdmin } from './supabase-client.js'
import { handleLogout } from './auth.js'
import { showToast, sanitizeHTML, showConfirm, uploadImage } from './utils.js'

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
        window.loadWishes()
      } else if (targetId === 'events') {
        loadEvents()
      } else if (targetId === 'feedback') {
        loadFeedback('all')
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
    feedback: 'User Feedback',
    'site-settings': 'Site Settings',
    settings: 'Countdown Settings'
  }

  const subtitles = {
    users: 'Manage accounts, permissions and status for the fan club',
    wishes: 'Review and manage birthday wishes from the fan club',
    events: 'Create and manage events and news posts',
    feedback: 'View and manage feedback from users',
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
    showToast('Failed to load users', 'error')
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
window.changeUserRole = async function (userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'member' : 'admin'

  showConfirm(`Are you sure you want to change role to ${newRole}?`, async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      showToast('Role updated successfully!', 'success')
      loadUsers()
    } catch (error) {
      console.error('Error changing role:', error)
      showToast('Failed to change role: ' + error.message, 'error')
    }
  })
}

// Delete user
window.deleteUser = async function (userId) {
  showConfirm('Are you sure you want to delete this user? This action cannot be undone!', async () => {
    try {
      // Note: This will fail with RLS unless proper policies are set
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

let currentWishesFilter = 'pending'

window.loadWishes = async function loadWishes(statusFilter = 'pending') {
  try {
    currentWishesFilter = statusFilter
    
    // Load wishes with user info
    const { data: wishes, error } = await supabase
      .from('wishes')
      .select('id, content, sticker, image_url, status, created_at, users!wishes_user_id_fkey(username)')
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

    // Update filter card active states
    updateWishesFilterUI(statusFilter)

    // Update list title
    const titleMap = {
      pending: 'Pending Wishes',
      approved: 'Approved Wishes',
      rejected: 'Rejected Wishes'
    }
    const listTitle = document.getElementById('wishes-list-title')
    if (listTitle) {
      listTitle.textContent = titleMap[statusFilter] || 'Wishes'
    }

    // Render filtered wishes
    renderWishesList(wishes.filter(w => w.status === statusFilter))

  } catch (error) {
    console.error('Error loading wishes:', error)
    alert('Không thể tải danh sách lời chúc')
  }
}

function renderWishesList(wishes) {
  const list = document.getElementById('wishes-list')

  if (wishes.length === 0) {
    const emptyMessages = {
      pending: 'Không có lời chúc nào đang chờ duyệt',
      approved: 'Không có lời chúc nào đã được duyệt',
      rejected: 'Không có lời chúc nào bị từ chối'
    }
    list.innerHTML = `<p class="text-center text-slate-400">${emptyMessages[currentWishesFilter] || 'Không có lời chúc nào'}</p>`
    return
  }

  list.innerHTML = ''

  wishes.forEach(wish => {
    const card = document.createElement('div')
    card.className = 'p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors'

    const imageHtml = wish.image_url
      ? `<div class="mt-3">
           <img src="${wish.image_url}" alt="Wish image" class="max-w-xs max-h-48 rounded-lg border border-white/10 object-cover" />
         </div>`
      : ''

    card.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-semibold">${wish.users?.username || 'Anonymous'}</span>
            <span class="text-2xl">${wish.sticker || '🎉'}</span>
            <span class="text-xs text-slate-400">${new Date(wish.created_at).toLocaleString('vi-VN')}</span>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed">${wish.content}</p>
          ${imageHtml}
        </div>
        ${wish.status === 'pending' ? `
          <div class="flex flex-col gap-2">
            <button onclick="moderateWish('${wish.id}', 'approved')" class="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold hover:bg-green-500/30 transition-colors">
              Duyệt
            </button>
            <button onclick="moderateWish('${wish.id}', 'rejected')" class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors">
              Từ chối
            </button>
          </div>
        ` : `
          <div class="flex flex-col gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${
              wish.status === 'approved' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }">
              ${wish.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
            </span>
          </div>
        `}
      </div>
    `

    list.appendChild(card)
  })
}

// Update wishes filter UI
function updateWishesFilterUI(activeStatus) {
  const filterCards = document.querySelectorAll('.wishes-filter-card')
  filterCards.forEach(card => {
    const status = card.getAttribute('data-status')
    if (status === activeStatus) {
      card.classList.add('ring-2', 'ring-white/50', 'scale-105')
    } else {
      card.classList.remove('ring-2', 'ring-white/50', 'scale-105')
    }
  })
}

// Moderate wish
window.moderateWish = async function (wishId, status) {
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

    showToast(status === 'approved' ? 'Wish approved!' : 'Wish rejected!', 'success')
    window.loadWishes(currentWishesFilter)
  } catch (error) {
    console.error('Error moderating wish:', error)
    showToast('Failed to update: ' + error.message, 'error')
  }
}

// Wishes filter click handlers
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.wishes-filter-card').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.getAttribute('data-status')
      window.loadWishes(status)
    })
  })
})

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
      const targetDate = new Date(data.target_date)

      // Format date as YYYY-MM-DD
      const year = targetDate.getFullYear()
      const month = String(targetDate.getMonth() + 1).padStart(2, '0')
      const day = String(targetDate.getDate()).padStart(2, '0')
      document.getElementById('return-date').value = `${year}-${month}-${day}`

      // Format time as HH:MM
      const hours = String(targetDate.getHours()).padStart(2, '0')
      const minutes = String(targetDate.getMinutes()).padStart(2, '0')
      document.getElementById('return-time').value = `${hours}:${minutes}`

      document.getElementById('countdown-title').value = data.title || ''
      document.getElementById('countdown-description').value = data.description || ''
    }
  } catch (error) {
    console.error('Error loading settings:', error)
    showToast('Failed to load countdown settings', 'error')
  }
}

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

    // Combine date and time into ISO string (local timezone)
    const dateTimeStr = `${returnDate}T${returnTime}:00`
    const targetDateTime = new Date(dateTimeStr)

    if (isNaN(targetDateTime.getTime())) {
      showToast('Invalid date or time format', 'error')
      return
    }

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

    showToast('Countdown settings saved successfully!', 'success')
    loadSettings() // Reload to confirm
  } catch (error) {
    console.error('Error saving settings:', error)
    showToast('Failed to save settings: ' + error.message, 'error')
  }
})

// ============= EVENTS MANAGEMENT =============

let currentEventFilter = 'all'
let currentEventTypeFilter = 'all'

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

    if (currentEventTypeFilter !== 'all') {
      query = query.eq('event_type', currentEventTypeFilter)
    }

    const { data: events, error } = await query

    if (error) throw error

    renderEventsList(events || [])
  } catch (error) {
    console.error('Error loading events:', error)
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
      published: 'bg-green-500/20 text-green-400',
      draft: 'bg-yellow-500/20 text-yellow-400',
      archived: 'bg-gray-500/20 text-gray-400'
    }

    return `
      <div class="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-primary/30 transition-all">
        <div class="flex gap-4">
          ${event.image_url ? `
            <img src="${event.image_url}" alt="${event.title}" class="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
          ` : `
            <div class="w-24 h-24 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-4xl text-slate-400">event_note</span>
            </div>
          `}
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h4 class="text-lg font-bold text-white truncate">${event.title}</h4>
              <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status]} whitespace-nowrap">${event.status}</span>
            </div>
            <p class="text-sm text-slate-400 mb-2 line-clamp-2">${event.excerpt || event.content.substring(0, 100) + '...'}</p>
            <div class="flex items-center gap-4 text-xs text-slate-500">
              <span>${event.author?.username || 'Admin'}</span>
              <span>•</span>
              <span>${createdDate}</span>
              ${event.view_count ? `<span>• ${event.view_count} views</span>` : ''}
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <button onclick="viewEventDetail('${event.id}')" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
              <span class="material-symbols-outlined text-blue-400">visibility</span>
            </button>
            <button onclick="editEvent('${event.id}')" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
              <span class="material-symbols-outlined text-primary">edit</span>
            </button>
            <button onclick="deleteEvent('${event.id}')" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Delete">
              <span class="material-symbols-outlined text-red-400">delete</span>
            </button>
          </div>
        </div>
      </div>
    `
  }).join('')
}

// Show event modal
let currentEventImage = null

function showEventModal(event = null) {
  const modal = document.getElementById('event-modal')
  const modalTitle = document.getElementById('event-modal-title')
  const form = document.getElementById('event-form')
  const imagePreview = document.getElementById('event-image-preview')

  if (!modal) return

  // Reset image state
  currentEventImage = null
  if (imagePreview) imagePreview.classList.add('hidden')

  if (event) {
    modalTitle.textContent = 'Edit Event'
    document.getElementById('event-id').value = event.id
    document.getElementById('event-title').value = event.title
    document.getElementById('event-excerpt').value = event.excerpt || ''
    document.getElementById('event-content').value = event.content
    document.getElementById('event-image-url').value = event.image_url || ''
    document.getElementById('event-status').value = event.status

    // Show existing image if available
    if (event.image_url) {
      currentEventImage = event.image_url
      showImagePreview(event.image_url)
    }
  } else {
    modalTitle.textContent = 'New Event'
    form.reset()
    document.getElementById('event-id').value = ''
  }

  modal.classList.remove('hidden')
}

// Show image preview
function showImagePreview(url) {
  const preview = document.getElementById('event-image-preview')
  const img = preview?.querySelector('img')
  if (preview && img) {
    img.src = url
    preview.classList.remove('hidden')
  }
}

// Close event modal
function closeEventModal() {
  const modal = document.getElementById('event-modal')
  if (modal) modal.classList.add('hidden')
}

// Edit event
window.editEvent = async function (eventId) {
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
window.deleteEvent = async function (eventId) {
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
  const imageUrl = document.getElementById('event-image-url').value
  const status = document.getElementById('event-status').value

  try {
    const eventData = {
      title,
      excerpt: excerpt || null,
      content: sanitizeHTML(content),
      image_url: imageUrl || null,
      status,
      updated_at: new Date().toISOString(),
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
      eventData.event_type = 'official'
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

// Event type filter buttons
document.querySelectorAll('.event-type-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentEventTypeFilter = btn.dataset.type

    // Update active button
    document.querySelectorAll('.event-type-filter-btn').forEach(b => {
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

// Image upload handler
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

// Image URL input handler
document.getElementById('event-image-url')?.addEventListener('input', (e) => {
  const url = e.target.value.trim()
  if (url) {
    currentEventImage = url
    showImagePreview(url)
  }
})

// Remove image handler
document.getElementById('remove-event-image')?.addEventListener('click', () => {
  currentEventImage = null
  document.getElementById('event-image-url').value = ''
  document.getElementById('event-image-file').value = ''
  const preview = document.getElementById('event-image-preview')
  if (preview) preview.classList.add('hidden')
})

// View event detail
window.viewEventDetail = async function (eventId) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        author:users(username)
      `)
      .eq('id', eventId)
      .single()

    if (error) throw error

    // Populate detail modal
    const modal = document.getElementById('event-detail-modal')
    if (!modal) return

    document.getElementById('detail-event-title').textContent = event.title
    document.getElementById('detail-event-date').textContent = new Date(event.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    document.getElementById('detail-event-author').textContent = event.author?.username || 'Admin'

    const contentDiv = document.getElementById('detail-event-content')
    contentDiv.innerHTML = event.content

    const imageDiv = document.getElementById('detail-event-image')
    if (event.image_url) {
      imageDiv.innerHTML = `<img src="${event.image_url}" alt="${event.title}" class="w-full h-auto rounded-lg">`
      imageDiv.classList.remove('hidden')
    } else {
      imageDiv.classList.add('hidden')
    }

    modal.classList.remove('hidden')
  } catch (error) {
    console.error('Error loading event detail:', error)
    showToast('Failed to load event details', 'error')
  }
}

// Close event detail modal
document.getElementById('close-event-detail-modal')?.addEventListener('click', () => {
  const modal = document.getElementById('event-detail-modal')
  if (modal) modal.classList.add('hidden')
})

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
    showToast('Failed to load site settings', 'error')
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

// ============= FEEDBACK MANAGEMENT =============

let currentFeedbackFilter = 'all'
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
// Load feedback with optional filter
async function loadFeedback(statusFilter = 'all') {
  try {
    currentFeedbackFilter = statusFilter

    let query = supabase
      .from('feedback')
      .select(`
        *,
        user:users!feedback_user_id_fkey(username, email)
      `)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: feedbackItems, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    renderFeedbackList(feedbackItems || [])
    updateFeedbackCounts(feedbackItems || [])
  } catch (error) {
    console.error('Error loading feedback:', error)
    showToast('Failed to load feedback: ' + error.message, 'error')
  }
}

// Render feedback list
function renderFeedbackList(feedbackItems) {
  const container = document.getElementById('feedback-list')
  if (!container) return

  if (feedbackItems.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">mail</span>
        <p class="text-slate-500 dark:text-slate-400">No feedback found</p>
      </div>
    `
    return
  }

  container.innerHTML = feedbackItems.map(item => {
    const date = new Date(item.created_at)
    const dateStr = date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const isUnread = item.status === 'unread'
    const statusBadge = isUnread
      ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Unread</span>'
      : '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Read</span>'

    const messagePreview = item.message.length > 100
      ? item.message.substring(0, 100) + '...'
      : item.message

    return `
      <div class="p-4 rounded-lg border ${isUnread ? 'border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-pink-100 dark:border-white/5 bg-white/50 dark:bg-white/5'}">
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-slate-800 dark:text-slate-200">${item.user?.username || 'Unknown User'}</span>
              ${statusBadge}
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">${item.user?.email || ''}</p>
          </div>
          <span class="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">${dateStr}</span>
        </div>
        
        <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-2">${escapeHtml(item.subject)}</h4>
        
        <div class="mb-3">
          <p class="text-sm text-slate-600 dark:text-slate-300 feedback-preview-${item.id}">${escapeHtml(messagePreview)}</p>
          ${item.message.length > 100 ? `
            <button onclick="toggleFeedbackMessage('${item.id}')" class="text-xs text-primary hover:underline mt-1">
              Show more
            </button>
          ` : ''}
        </div>
        
        <div class="flex items-center gap-2 pt-3 border-t border-pink-100 dark:border-white/5">
          ${isUnread ? `
            <button onclick="markFeedbackAsRead('${item.id}')" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-base">done</span>
              Mark as Read
            </button>
          ` : ''}
        </div>
      </div>
    `
  }).join('')
}

// Toggle feedback message expand/collapse
window.toggleFeedbackMessage = function (feedbackId) {
  const preview = document.querySelector(`.feedback-preview-${feedbackId}`)
  if (!preview) return

  const button = preview.nextElementSibling
  if (!button) return

  const feedback = document.querySelector(`[data-feedback-id="${feedbackId}"]`)
  const isExpanded = preview.dataset.expanded === 'true'

  if (isExpanded) {
    // Collapse
    const fullMessage = preview.dataset.fullMessage
    const messagePreview = fullMessage.length > 100
      ? fullMessage.substring(0, 100) + '...'
      : fullMessage
    preview.textContent = messagePreview
    button.textContent = 'Show more'
    preview.dataset.expanded = 'false'
  } else {
    // Expand
    if (!preview.dataset.fullMessage) {
      preview.dataset.fullMessage = preview.textContent
    }

    // Get full message from data
    const container = preview.closest('.p-4')
    const allFeedback = Array.from(document.querySelectorAll('.p-4'))
    const index = allFeedback.indexOf(container)

    // Re-fetch to get full message
    supabase
      .from('feedback')
      .select('message')
      .eq('id', feedbackId)
      .single()
      .then(({ data }) => {
        if (data) {
          preview.textContent = data.message
          preview.dataset.fullMessage = data.message
          button.textContent = 'Show less'
          preview.dataset.expanded = 'true'
        }
      })
  }
}

// Mark feedback as read
window.markFeedbackAsRead = async function (feedbackId) {
  try {
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
  } catch (error) {
    console.error('Error marking feedback as read:', error)
    showToast('Failed to mark as read: ' + error.message, 'error')
  }
}

// Update feedback counts
function updateFeedbackCounts(feedbackItems) {
  const totalCount = document.getElementById('total-feedback-count')
  if (totalCount) {
    totalCount.textContent = feedbackItems.length
  }
}

// Update unread counter badge in sidebar
async function updateUnreadCount() {
  try {
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
  } catch (error) {
    console.error('Error updating unread count:', error)
  }
}

// Feedback filter buttons
document.querySelectorAll('.feedback-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
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
updateUnreadCount() // Update unread badge on load

