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
    if (avatarElement) {
      if (data.avatar_url && data.avatar_url.trim() !== '') {
        avatarElement.style.backgroundImage = `url('${data.avatar_url}')`
      } else {
        // Show default avatar with first letter of username
        const initial = (data.username || 'U')[0].toUpperCase()
        avatarElement.style.backgroundImage = 'none'
        avatarElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-pink-600 text-white font-bold text-lg">${initial}</div>`
      }
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
      alert('Please log in to send greetings!')
      window.location.href = '/login.html'
    }
  })
}

// Handle About modal
const aboutLink = document.getElementById('about-link')
const aboutModal = document.getElementById('about-modal')
const closeAboutModal = document.getElementById('close-about-modal')
const aboutContentDisplay = document.getElementById('about-content-display')

// Load about content from site_settings
async function loadAboutContent() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'about_content')
      .single()

    if (error) throw error

    if (data && aboutContentDisplay) {
      aboutContentDisplay.innerHTML = data.setting_value
    }
  } catch (error) {
    console.error('Error loading about content:', error)
    if (aboutContentDisplay) {
      aboutContentDisplay.innerHTML = '<p>Welcome to Wangho\'s Flower Garden - A special place for Peanut\'s fans to connect and celebrate together.</p>'
    }
  }
}

// Show about modal on click
if (aboutLink && aboutModal) {
  aboutLink.addEventListener('click', (e) => {
    e.preventDefault()
    aboutModal.classList.remove('hidden')
    loadAboutContent()
  })
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const icon = mobileMenuBtn.querySelector('.material-symbols-outlined');
    icon.textContent = mobileMenu.classList.contains('open') ? 'close' : 'menu';
  });
}

// Mobile about link
const aboutLinkMobile = document.getElementById('about-link-mobile');
if (aboutLinkMobile) {
  aboutLinkMobile.addEventListener('click', () => {
    document.getElementById('about-modal')?.classList.remove('hidden');
    mobileMenu?.classList.remove('open');
    loadAboutContent();
  });
}

// Close modal
if (closeAboutModal && aboutModal) {
  closeAboutModal.addEventListener('click', () => {
    aboutModal.classList.add('hidden')
  })

  // Close on backdrop click
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
      aboutModal.classList.add('hidden')
    }
  })
}

// Check if should show popup on load
async function checkAboutPopup() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'about_popup_enabled')
      .single()

    if (error) throw error
    const showedAboutModal = sessionStorage.getItem('showedAboutModal');
    if (data && data.setting_value === 'true' && aboutModal && !showedAboutModal) {
      // Show popup after a short delay
      setTimeout(() => {
        aboutModal.classList.remove('hidden')
        loadAboutContent()
        sessionStorage.setItem('showedAboutModal', 'true');
      }, 2000)
    }
  } catch (error) {
    console.error('Error checking about popup setting:', error)
  }
}

// ============= FEEDBACK MANAGEMENT =============

const feedbackButton = document.getElementById('feedback-button')
const feedbackModal = document.getElementById('feedback-modal')
const closeFeedbackModal = document.getElementById('close-feedback-modal')
const cancelFeedback = document.getElementById('cancel-feedback')
const feedbackForm = document.getElementById('feedback-form')
const feedbackSubject = document.getElementById('feedback-subject')
const feedbackMessage = document.getElementById('feedback-message')
const charCount = document.getElementById('char-count')

// Show feedback button only for logged in users
if (user && feedbackButton) {
  feedbackButton.classList.remove('hidden')
}

// Character counter
if (feedbackMessage && charCount) {
  feedbackMessage.addEventListener('input', () => {
    charCount.textContent = feedbackMessage.value.length
  })
}

// Open feedback modal
if (feedbackButton && feedbackModal) {
  feedbackButton.addEventListener('click', () => {
    feedbackModal.classList.remove('hidden')
    // Clear previous messages
    document.getElementById('feedback-error')?.classList.add('hidden')
    document.getElementById('feedback-success')?.classList.add('hidden')
  })
}

// Close feedback modal
function closeFeedbackModalHandler() {
  if (feedbackModal) {
    feedbackModal.classList.add('hidden')
    feedbackForm?.reset()
    charCount.textContent = '0'
  }
}

if (closeFeedbackModal) {
  closeFeedbackModal.addEventListener('click', closeFeedbackModalHandler)
}

if (cancelFeedback) {
  cancelFeedback.addEventListener('click', closeFeedbackModalHandler)
}

if (feedbackModal) {
  feedbackModal.addEventListener('click', (e) => {
    if (e.target === feedbackModal) {
      closeFeedbackModalHandler()
    }
  })
}

// Submit feedback
if (feedbackForm) {
  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    if (!user) {
      showFeedbackError('Please log in to send feedback')
      return
    }

    const subject = feedbackSubject.value.trim()
    const message = feedbackMessage.value.trim()

    if (!subject || !message) {
      showFeedbackError('Please fill in all fields')
      return
    }

    const submitButton = document.getElementById('submit-feedback')
    submitButton.disabled = true
    submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Sending...'

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([{
          user_id: user.id,
          subject: subject,
          message: message,
          status: 'unread'
        }])

      if (error) throw error

      showFeedbackSuccess('Thank you! Your feedback has been sent successfully.')

      // Clear form and close after 2 seconds
      setTimeout(() => {
        closeFeedbackModalHandler()
      }, 2000)

    } catch (error) {
      console.error('Error submitting feedback:', error)
      showFeedbackError('Failed to send feedback. Please try again.')
    } finally {
      submitButton.disabled = false
      submitButton.innerHTML = 'Send Feedback'
    }
  })
}

function showFeedbackError(message) {
  const errorDiv = document.getElementById('feedback-error')
  if (errorDiv) {
    errorDiv.textContent = message
    errorDiv.classList.remove('hidden')
    document.getElementById('feedback-success')?.classList.add('hidden')
  }
}

function showFeedbackSuccess(message) {
  const successDiv = document.getElementById('feedback-success')
  if (successDiv) {
    successDiv.textContent = message
    successDiv.classList.remove('hidden')
    document.getElementById('feedback-error')?.classList.add('hidden')
  }
}

// Initialize
startCountdown()
checkAboutPopup()
