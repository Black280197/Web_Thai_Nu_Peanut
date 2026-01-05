// Birthday wishes page initialization
import { requireAuth } from './supabase-client.js'
import { supabase } from './supabase-client.js'

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
    
    if (content.length > 500) {
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
      alert('Gửi lời chúc thành công! Lời chúc của bạn đang chờ duyệt.')
      
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
  
  // Update countdown every second
  setInterval(updateCountdownDisplay, 1000)
  
  // Refresh wishes every 30 seconds
  setInterval(() => {
    updateProgressBar()
    loadRecentWishes()
  }, 30000)
}

// Start initialization
init()
