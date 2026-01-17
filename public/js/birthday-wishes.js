// Birthday wishes page initialization
import { requireAuth, getCurrentUser, isAdmin } from './supabase-client.js'
import { supabase } from './supabase-client.js'
import { handleLogout } from './auth.js'

// Check if user is logged in
const user = await requireAuth()

// Initialize image slideshow
function initSlideshow() {
  const images = [
    '/assets/img_peanuts/0fe8f6cbebafe8e545d053dcf3ee9380.jpg',
    '/assets/img_peanuts/2c340752e66f620443a72b46f630ece5.jpg',
    '/assets/img_peanuts/2db4366d6cc53f84237209e982ef7c19.jpg',
    '/assets/img_peanuts/3a51444fe53f876c0d9f39953cb0c7a4.jpg',
    '/assets/img_peanuts/72a24ffdeb8497e51f0b43464e6beb2f.jpg',
    '/assets/img_peanuts/99c6043ff6b60466e0e368654135621f.jpg',
    '/assets/img_peanuts/b1dfe44bb3cbcf0921e6236a53ef6446.jpg',
    '/assets/img_peanuts/caf563a1020e1716156c4585e90d4b42.jpg'
  ]

  const container = document.getElementById('slideshow-container')
  if (!container) return

  let currentIndex = 0

  // Create img element
  const img = document.createElement('img')
  img.src = images[0]
  img.alt = 'Peanut'
  img.className = 'w-full h-full object-cover transition-opacity duration-1000'
  container.appendChild(img)

  // Rotate images every 5 seconds
  setInterval(() => {
    img.style.opacity = '0'

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % images.length
      img.src = images[currentIndex]
      img.style.opacity = '1'
    }, 1000)
  }, 5000)
}

// Global target date (will be loaded from database)
let TARGET_DATE = null

// Load countdown settings from database
async function loadCountdownSettings() {
  try {
    const { data, error } = await supabase
      .from('countdown_settings')
      .select('target_date, title, description')
      .eq('event_type', 'return_date')
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error loading countdown settings:', error)
      // Fallback to birthday date (January 4th)
      TARGET_DATE = new Date(new Date().getFullYear(), 0, 4)
      return
    }

    if (data && data.target_date) {
      TARGET_DATE = new Date(data.target_date)
    } else {
      // Fallback to birthday date (January 4th)
      TARGET_DATE = new Date(new Date().getFullYear(), 0, 4)
    }
  } catch (err) {
    console.error('Failed to load countdown:', err)
    // Fallback to birthday date (January 4th)
    TARGET_DATE = new Date(new Date().getFullYear(), 0, 4)
  }
}

// Calculate countdown to target date
function calculateBirthdayCountdown() {
  if (!TARGET_DATE) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  const now = new Date().getTime()
  const target = TARGET_DATE.getTime()

  const distance = target - now

  // If countdown has passed
  if (distance < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

// Update countdown display
function updateCountdownDisplay() {
  const countdown = calculateBirthdayCountdown()

  const daysEl = document.getElementById('birthday-days')
  const hoursEl = document.getElementById('birthday-hours')
  const minutesEl = document.getElementById('birthday-minutes')
  const secondsEl = document.getElementById('birthday-seconds')

  if (daysEl) daysEl.textContent = String(countdown.days).padStart(2, '0')
  if (hoursEl) hoursEl.textContent = String(countdown.hours).padStart(2, '0')
  if (minutesEl) minutesEl.textContent = String(countdown.minutes).padStart(2, '0')
  if (secondsEl) secondsEl.textContent = String(countdown.seconds).padStart(2, '0')
}

// Load wishes statistics
async function loadWishesStats() {
  const { count, error } = await supabase
    .from('wishes')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'birthday')
    .eq('status', 'approved')

  if (error) {
    console.error('Error loading wishes count:', error)
    return { total: 0, percentage: 0 }
  }

  const TARGET = 302
  const percentage = Math.round((count / TARGET) * 100)

  return { total: count || 0, percentage, target: TARGET }
}

// Update progress bar
async function updateProgressBar() {
  const stats = await loadWishesStats()

  const totalEl = document.getElementById('wishes-total')
  const percentageEl = document.getElementById('wishes-percentage')
  const progressBar = document.getElementById('progress-bar')

  if (totalEl) totalEl.textContent = stats.total
  if (percentageEl) percentageEl.textContent = `${stats.percentage}%`
  if (progressBar) progressBar.style.width = `${stats.percentage}%`
}

// Load recent wishes
async function loadRecentWishes() {
  const { data, error } = await supabase
    .from('wishes')
    .select('id, content, created_at, users!wishes_user_id_fkey(username)')
    .eq('type', 'birthday')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error loading wishes:', error)
    return
  }

  const container = document.getElementById('recent-wishes')
  if (!container) return

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-xs text-center py-4">Chưa có lời chúc nào</p>'
    return
  }

  container.innerHTML = data.map(wish => {
    const initial = wish.users.username.charAt(0).toUpperCase()
    const colors = ['from-blue-400 to-pink-500', 'from-orange-400 to-red-500', 'from-green-400 to-teal-500', 'from-purple-400 to-pink-500']
    const color = colors[Math.floor(Math.random() * colors.length)]

    return `
      <div class="flex items-center gap-3 bg-surface-dark/60 p-2 rounded-xl border border-white/5">
        <div class="size-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-xs font-bold text-white">${initial}</div>
        <div class="truncate text-xs text-slate-300">"${wish.content.substring(0, 50)}..."</div>
      </div>
    `
  }).join('')
}

// Handle form submission
const form = document.getElementById('wishes-form')
const nicknameInput = document.getElementById('nickname')
const contentInput = document.getElementById('content')
const imageUpload = document.getElementById('image-upload')
const charCount = document.getElementById('char-count')
const submitButton = document.getElementById('submit-button')

// Character counter
if (contentInput && charCount) {
  contentInput.addEventListener('input', () => {
    const length = contentInput.value.length
    charCount.textContent = `${length}/2500 charactors`

    if (length > 500) {
      charCount.classList.add('text-red-500')
    } else {
      charCount.classList.remove('text-red-500')
    }
  })
}

// Form submission
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const nickname = nicknameInput.value.trim()
    const content = contentInput.value.trim()
    const stickerInputs = document.querySelectorAll('input[name="sticker"]')
    let sticker = '🎂'

    stickerInputs.forEach(input => {
      if (input.checked) {
        sticker = input.closest('label').querySelector('span').textContent
      }
    })

    // Validation
    if (!nickname || !content) {
      alert('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (content.length > 2500) {
      alert('Lời chúc không được vượt quá 2500 charactors')
      return
    }

    // Validate image size if uploaded
    const imageFile = imageUpload?.files?.[0]
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 5MB')
      return
    }

    // Disable button
    submitButton.disabled = true
    submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Đang gửi...'

    try {
      let imageUrl = null

      // Upload image if provided
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop()
          const fileName = `${user.id}-${Date.now()}.${fileExt}`
          const filePath = `birthday-wishes/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('wishes-images')
            .upload(filePath, imageFile)

          if (uploadError) {
            console.warn('Image upload failed:', uploadError)
            // Continue without image if bucket doesn't exist
            if (uploadError.message.includes('Bucket not found')) {
              alert('Chức năng upload ảnh chưa được kích hoạt. Lời chúc sẽ được gửi không kèm ảnh.')
            } else {
              throw uploadError
            }
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('wishes-images')
              .getPublicUrl(filePath)

            imageUrl = publicUrl
          }
        } catch (imgError) {
          console.error('Image upload error:', imgError)
          // Continue without image
        }
      }

      // Insert wish
      const { error } = await supabase
        .from('wishes')
        .insert([{
          user_id: user.id,
          type: 'birthday',
          content: `${nickname}: ${content}`,
          sticker: sticker,
          image_url: imageUrl,
          status: 'pending'
        }])

      if (error) throw error

      // Success
      alert('Sended Successfully! Your wish is pending approval.')

      // Reset form
      form.reset()
      charCount.textContent = '0/2500 charactors'

      // Reload stats
      await updateProgressBar()

    } catch (error) {
      console.error('Error submitting wish:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      submitButton.disabled = false
      submitButton.innerHTML = `
        <div class="relative flex items-center justify-center gap-2 font-bold text-lg tracking-wide">
          <span class="material-symbols-outlined text-2xl">cake</span>
          <span>Birthday Message</span>
        </div>
      `
    }
  })
}

// Initialize
async function init() {
  await loadCountdownSettings() // Load countdown target date first
  initSlideshow()
  updateCountdownDisplay()
  updateProgressBar()
  loadRecentWishes()

  // Handle user authentication state
  const currentUser = await getCurrentUser()
  const loginButton = document.getElementById('login-button')
  const userSection = document.getElementById('user-section')
  const logoutButton = document.getElementById('logout-button')

  if (currentUser) {
    // Show user section
    userSection?.classList.remove('hidden')
    const usernameStrong = userSection?.querySelector('strong')
    if (usernameStrong) usernameStrong.textContent = currentUser.user_metadata?.username || currentUser.email
  } else {
    // Show login button
    loginButton?.classList.remove('hidden')
  }

  // Handle login button
  loginButton?.addEventListener('click', () => {
    window.location.href = '/login.html'
  })

  // Handle logout
  logoutButton?.addEventListener('click', async () => {
    await handleLogout()
    window.location.href = '/'
  })

  // Update countdown every second
  setInterval(updateCountdownDisplay, 1000)

  // Refresh wishes every 30 seconds
  setInterval(() => {
    updateProgressBar()
    loadRecentWishes()
  }, 30000)

  // Load approved wishes preview
  loadWishesPreview()
}

// Load wishes preview for "Eleven Out Of Ten" section
async function loadWishesPreview() {
  try {
    const { data, error } = await supabase
      .from('wishes')
      .select(`
        id,
        content,
        sticker,
        type,
        created_at,
        users!wishes_user_id_fkey(username, avatar_url)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error

    const container = document.getElementById('wishes-preview')
    if (!container) return

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <span class="material-symbols-outlined text-6xl text-slate-600 mb-3">favorite_border</span>
          <p class="text-slate-400">Chưa có lời chúc nào được phê duyệt</p>
          <p class="text-slate-500 text-sm">Hãy gửi lời chúc đầu tiên nhé!</p>
        </div>
      `
      return
    }

    // Get like counts for these wishes
    const wishIds = data.map(w => w.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('target_id')
      .eq('target_type', 'wish')
      .in('target_id', wishIds)

    const likeCounts = {}
    if (likesData) {
      likesData.forEach(like => {
        likeCounts[like.target_id] = (likeCounts[like.target_id] || 0) + 1
      })
    }

    // Check which wishes current user has liked
    const userLikes = new Set()
    if (user) {
      const { data: userLikesData } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'wish')
        .in('target_id', wishIds)

      if (userLikesData) {
        userLikesData.forEach(like => userLikes.add(like.target_id))
      }
    }

    container.innerHTML = data.map(wish => createWishPreviewCard(wish, likeCounts[wish.id] || 0, userLikes.has(wish.id))).join('')

    // Setup like button event listeners
    setupWishLikeButtons()

  } catch (error) {
    console.error('Error loading wishes preview:', error)
    const container = document.getElementById('wishes-preview')
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <span class="material-symbols-outlined text-6xl text-red-400 mb-3">error</span>
          <p class="text-red-400">Không thể tải lời chúc</p>
          <button onclick="loadWishesPreview()" class="text-primary hover:text-primary-glow text-sm mt-2">
            Thử lại
          </button>
        </div>
      `
    }
  }
}

// Create wish preview card
function createWishPreviewCard(wish, likeCount, isLiked) {
  const user = wish.users || {}
  const avatar = user.avatar_url || getDefaultAvatar(user.username)

  return `
    <div class="wish-card">
      <div class="wish-header">
        <div class="wish-avatar">
          ${avatar.startsWith('http') ?
      `<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
      avatar
    }
        </div>
        <div class="flex-grow">
          <p class="text-white font-medium text-sm">${user.username || 'Anonymous'}</p>
          <p class="text-slate-400 text-xs">${getTimeAgo(wish.created_at)}</p>
        </div>
        <span class="wish-type-badge wish-type-${wish.type}">
          ${getTypeLabel(wish.type)}
        </span>
      </div>
      
      <div class="wish-content">
        <p class="text-white">${wish.content}</p>
      </div>
      
      ${wish.sticker ? `<div class="text-center text-2xl mb-3">${wish.sticker}</div>` : ''}
      
      <div class="wish-actions">
        <button class="like-button ${isLiked ? 'liked' : ''}" data-wish-id="${wish.id}" data-liked="${isLiked}">
          <span class="material-symbols-outlined">${isLiked ? 'favorite' : 'favorite_border'}</span>
          <span class="like-count">${likeCount}</span>
        </button>
        <small class="text-slate-500 text-xs">
          <span class="material-symbols-outlined text-sm align-middle">schedule</span>
          ${getTimeAgo(wish.created_at)}
        </small>
      </div>
    </div>
  `
}

// Setup like button event listeners for wishes
function setupWishLikeButtons() {
  const likeButtons = document.querySelectorAll('.like-button')
  likeButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault()
      await toggleWishLike(button)
    })
  })
}

// Toggle like for wish
async function toggleWishLike(button) {
  if (!user) {
    alert('You need to log in to like a wish!')
    return
  }

  const wishId = button.dataset.wishId
  const isLiked = button.dataset.liked === 'true'

  try {
    button.disabled = true
    button.classList.add('like-animation')

    const icon = button.querySelector('.material-symbols-outlined')
    const countElement = button.querySelector('.like-count')
    const currentCount = parseInt(countElement.textContent) || 0

    if (isLiked) {
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', 'wish')
        .eq('target_id', wishId)

      if (error) throw error

      button.classList.remove('liked')
      button.dataset.liked = 'false'
      icon.textContent = 'favorite_border'
      countElement.textContent = Math.max(0, currentCount - 1)

    } else {
      // Add like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          target_type: 'wish',
          target_id: wishId
        })

      if (error) throw error

      button.classList.add('liked')
      button.dataset.liked = 'true'
      icon.textContent = 'favorite'
      countElement.textContent = currentCount + 1
    }

  } catch (error) {
    console.error('Error toggling like:', error)
    alert('Có lỗi xảy ra khi thả tim. Vui lòng thử lại!')
  } finally {
    button.disabled = false
    setTimeout(() => {
      button.classList.remove('like-animation')
    }, 300)
  }
}

// Helper functions
function getDefaultAvatar(username) {
  return username ? username.charAt(0).toUpperCase() : '?'
}

function getTypeLabel(type) {
  const labels = {
    'daily': 'Hàng Ngày',
    'birthday': 'Sinh Nhật',
    'debut': 'Debut'
  }
  return labels[type] || type
}

function getTimeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Vừa xong'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`

  return new Date(dateString).toLocaleDateString('vi-VN')
}

// Make loadWishesPreview available globally
window.loadWishesPreview = loadWishesPreview

// Start initialization
init()
