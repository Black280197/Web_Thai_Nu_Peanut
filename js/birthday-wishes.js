// Birthday wishes page initialization
import { requireAuth } from './supabase-client.js'
import { supabase } from './supabase-client.js'

// Check if user is logged in
const user = await requireAuth()

// Birthday date (January 4th)
const BIRTHDAY_DATE = new Date(new Date().getFullYear(), 0, 4)

// Calculate countdown to birthday
function calculateBirthdayCountdown() {
  const now = new Date().getTime()
  let target = BIRTHDAY_DATE.getTime()
  
  // If birthday passed, use next year
  if (target < now) {
    target = new Date(new Date().getFullYear() + 1, 0, 4).getTime()
  }
  
  const distance = target - now
  
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
const charCount = document.getElementById('char-count')
const submitButton = document.getElementById('submit-button')

// Character counter
if (contentInput && charCount) {
  contentInput.addEventListener('input', () => {
    const length = contentInput.value.length
    charCount.textContent = `${length}/500 ký tự`
    
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
      alert('Lời chúc không được vượt quá 500 ký tự')
      return
    }
    
    // Disable button
    submitButton.disabled = true
    submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Đang gửi...'
    
    try {
      // Insert wish
      const { error } = await supabase
        .from('wishes')
        .insert([{
          user_id: user.id,
          type: 'birthday',
          content: `${nickname}: ${content}`,
          sticker: sticker,
          status: 'pending'
        }])
      
      if (error) throw error
      
      // Success
      alert('Gửi lời chúc thành công! Lời chúc của bạn đang chờ duyệt.')
      
      // Reset form
      form.reset()
      charCount.textContent = '0/500 ký tự'
      
      // Reload stats
      await updateProgressBar()
      
    } catch (error) {
      console.error('Error submitting wish:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      submitButton.disabled = false
      submitButton.innerHTML = '<span>Gửi Lời chúc Sinh nhật</span><span class="material-symbols-outlined transition-transform group-hover:translate-x-1">send</span>'
    }
  })
}

// Initialize
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
