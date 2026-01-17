/**
 * Login Page Logic
 * Xử lý form đăng nhập và OAuth
 */

import { authService } from '../../src/services/auth.service.js'
import { isValidEmail, validatePassword, showError, clearError, showToast } from '../../src/utils/validation.js'

// Kiểm tra nếu đã đăng nhập thì redirect
async function checkAuthStatus() {
  const isAuth = await authService.isAuthenticated()
  if (isAuth) {
    window.location.href = '/countdown.html'
  }
}

// Xử lý hiển thị/ẩn mật khẩu
function setupPasswordToggle() {
  const toggleBtn = document.querySelector('button[type="button"]')
  const passwordInput = document.getElementById('password')
  const toggleIcon = toggleBtn.querySelector('.material-symbols-outlined')

  if (toggleBtn && passwordInput && toggleIcon) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type')
      if (type === 'password') {
        passwordInput.setAttribute('type', 'text')
        toggleIcon.textContent = 'visibility_off'
      } else {
        passwordInput.setAttribute('type', 'password')
        toggleIcon.textContent = 'visibility'
      }
    })
  }
}

// Xử lý submit form đăng nhập
function setupLoginForm() {
  const form = document.querySelector('form')
  const emailInput = document.getElementById('email')
  const passwordInput = document.getElementById('password')
  const submitBtn = form.querySelector('button[type="submit"], button:not([type="button"])')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Clear previous errors
    clearError('email')
    clearError('password')

    // Get values
    const email = emailInput.value.trim()
    const password = passwordInput.value

    // Validate
    let hasError = false

    if (!email) {
      showError('email', 'Vui lòng nhập email')
      hasError = true
    } else if (!isValidEmail(email)) {
      showError('email', 'Email không hợp lệ')
      hasError = true
    }

    if (!password) {
      showError('password', 'Vui lòng nhập mật khẩu')
      hasError = true
    } else {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        showError('password', passwordValidation.message)
        hasError = true
      }
    }

    if (hasError) return

    // Show loading state
    const originalText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `

    try {
      // Call login API
      const { user, session, error } = await authService.signIn(email, password)

      if (error) {
        showToast(error, 'error')
        submitBtn.disabled = false
        submitBtn.innerHTML = originalText
        return
      }

      if (user) {
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(user))
        if (session) {
          localStorage.setItem('session', JSON.stringify(session))
        }

        // Show success message
        showToast('Login successful! Redirecting...', 'success')

        // Redirect after 1 second
        setTimeout(() => {
          window.location.href = '/template/Countdown.html'
        }, 1000)
      }
    } catch (error) {
      console.error('Login error:', error)
      showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error')
      submitBtn.disabled = false
      submitBtn.innerHTML = originalText
    }
  })

  // Real-time validation
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim()
    if (email && !isValidEmail(email)) {
      showError('email', 'Email không hợp lệ')
    } else {
      clearError('email')
    }
  })

  passwordInput.addEventListener('input', () => {
    clearError('password')
  })
}

// Xử lý OAuth login
function setupOAuthButtons() {
  const oauthButtons = document.querySelectorAll('.size-12.rounded-full')

  oauthButtons.forEach((button, index) => {
    button.addEventListener('click', async (e) => {
      e.preventDefault()

      let provider
      if (index === 0) provider = 'google'
      else if (index === 1) provider = 'twitter'
      else if (index === 2) provider = 'discord'

      if (provider) {
        showToast(`Đang kết nối với ${provider}...`, 'info')
        const { error } = await authService.signInWithOAuth(provider)

        if (error) {
          showToast(`Lỗi kết nối: ${error}`, 'error')
        }
      }
    })
  })
}

// Xử lý countdown timer
function setupCountdownTimer() {
  function updateCountdown() {
    // Target date: khoảng 180 ngày từ bây giờ (có thể thay đổi)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 180)

    const now = new Date()
    const diff = targetDate - now

    if (diff <= 0) {
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    // Update DOM
    const timeElements = document.querySelectorAll('.h-12.flex.items-center.justify-center span')
    if (timeElements.length >= 4) {
      timeElements[0].textContent = days
      timeElements[1].textContent = hours
      timeElements[2].textContent = minutes
      timeElements[3].textContent = seconds
    }
  }

  // Update immediately and then every second
  updateCountdown()
  setInterval(updateCountdown, 1000)
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Login page initialized')

  await checkAuthStatus()
  setupPasswordToggle()
  setupLoginForm()
  setupOAuthButtons()
  setupCountdownTimer()
})
