// Countdown page initialization
import { isAdmin, getCurrentUser } from './supabase-client.js'
import { supabase } from './supabase-client.js'
import { handleLogout } from './auth.js'

// Get current user (optional - for guests)
const user = await getCurrentUser()

// Check if user is admin and show admin link
async function checkAdminAccess() {
  const adminNavLink = document.getElementById('admin-nav-link')
  if (adminNavLink) {
    const admin = await isAdmin()
    if (admin) {
      adminNavLink.classList.remove('hidden')
    }
  }
}

// Birthday date (January 4th)
const BIRTHDAY_DATE = new Date(new Date().getFullYear(), 0, 4) // Month 0 = January

// Check if we're in birthday week (7 days before birthday)
function isBirthdayWeek() {
  const today = new Date()
  const daysUntilBirthday = Math.floor((BIRTHDAY_DATE - today) / (1000 * 60 * 60 * 24))
  
  // If birthday has passed this year, check for next year
  if (daysUntilBirthday < 0) {
    const nextYearBirthday = new Date(today.getFullYear() + 1, 0, 4)
    const daysUntilNextBirthday = Math.floor((nextYearBirthday - today) / (1000 * 60 * 60 * 24))
    return daysUntilNextBirthday <= 7 && daysUntilNextBirthday >= 0
  }
  
  return daysUntilBirthday <= 7 && daysUntilBirthday >= 0
}

// Show/hide birthday week badge
function updateBirthdayWeekBadge() {
  const badge = document.getElementById('birthday-week-badge')
  if (badge) {
    if (isBirthdayWeek()) {
      badge.classList.remove('hidden')
    } else {
      badge.classList.add('hidden')
    }
  }
}

// Load user profile
async function loadUserProfile() {
  if (!user) return
  
  const { data, error } = await supabase
    .from('users')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()
  
  if (data) {
    const usernameElement = document.getElementById('username')
    if (usernameElement) {
      usernameElement.textContent = data.username || 'Fan Member'
    }
    
    const avatarElement = document.getElementById('avatar')
    if (avatarElement && data.avatar_url) {
      avatarElement.style.backgroundImage = `url('${data.avatar_url}')`
    }
  }
}

// Load countdown settings from database
async function loadCountdownSettings() {
  const { data, error } = await supabase
    .from('countdown_settings')
    .select('*')
    .eq('event_type', 'return_date')
    .eq('is_active', true)
    .single()
  
  if (error) {
    console.error('Error loading countdown:', error)
    return null
  }
  
  return data
}

// Calculate countdown
function calculateCountdown(targetDate) {
  const now = new Date().getTime()
  const target = new Date(targetDate).getTime()
  const distance = target - now
  
  if (distance < 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: true
    }
  }
  
  // Calculate total days, hours, minutes, seconds
  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)
  
  return {
    days,
    hours,
    minutes,
    seconds,
    finished: false
  }
}

// Update countdown display
function updateCountdownDisplay(countdown) {
  const daysElement = document.getElementById('countdown-days')
  const hoursElement = document.getElementById('countdown-hours')
  const minutesElement = document.getElementById('countdown-minutes')
  const secondsElement = document.getElementById('countdown-seconds')
  
  if (daysElement) daysElement.textContent = String(countdown.days).padStart(2, '0')
  if (hoursElement) hoursElement.textContent = String(countdown.hours).padStart(2, '0')
  if (minutesElement) minutesElement.textContent = String(countdown.minutes).padStart(2, '0')
  if (secondsElement) secondsElement.textContent = String(countdown.seconds).padStart(2, '0')
  
  if (countdown.finished) {
    const titleElement = document.getElementById('countdown-title')
    if (titleElement) {
      titleElement.innerHTML = 'Happy Peanut Day! 🎉'
    }
  }
}
// Initialize
loadUserProfile()
startCountdown()
checkAdminAccess()
async function startCountdown() {
  const settings = await loadCountdownSettings()
  
  if (!settings) {
    console.error('No countdown settings found')
    return
  }
  
  // Update immediately
  const countdown = calculateCountdown(settings.target_date)
  updateCountdownDisplay(countdown)
  
  // Update every second
  setInterval(() => {
    const countdown = calculateCountdown(settings.target_date)
    updateCountdownDisplay(countdown)
  }, 1000)
}

// Handle logout
const logoutButton = document.getElementById('logout-button')
const loginButton = document.getElementById('login-button')
const userSection = document.getElementById('user-section')

if (user) {
  // User is logged in - show user info and logout button
  if (userSection) userSection.classList.remove('hidden')
  if (logoutButton) {
    logoutButton.classList.remove('hidden')
    logoutButton.addEventListener('click', async () => {
      await handleLogout()
    })
  }
  if (loginButton) loginButton.classList.add('hidden')
  
  loadUserProfile()
  checkAdminAccess()
} else {
  // Guest mode - show login button
  if (userSection) userSection.classList.add('hidden')
  if (logoutButton) logoutButton.classList.add('hidden')
  if (loginButton) {
    loginButton.classList.remove('hidden')
    loginButton.addEventListener('click', () => {
      window.location.href = '/login.html'
    })
  }
}

// Handle birthday wishes link - require auth
const birthdayWishesLink = document.getElementById('birthday-wishes-link')
if (birthdayWishesLink) {
  birthdayWishesLink.addEventListener('click', (e) => {
    if (!user) {
      e.preventDefault()
      alert('Vui lòng đăng nhập để gửi lời chúc sinh nhật!')
      window.location.href = '/login.html'
    }
  })
}

// Initialize
startCountdown()
