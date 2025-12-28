/**
 * Register Page Logic
 * Xử lý form đăng ký tài khoản
 */

import { authService } from '../../src/services/auth.service.js'
import { isValidEmail, validatePassword, validateUsername, showError, clearError, showToast } from '../../src/utils/validation.js'

// Xử lý hiển thị/ẩn mật khẩu
function setupPasswordToggles() {
  const togglePassword = document.getElementById('togglePassword')
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword')
  const passwordInput = document.getElementById('password')
  const confirmPasswordInput = document.getElementById('confirmPassword')

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type')
      if (type === 'password') {
        passwordInput.setAttribute('type', 'text')
        togglePassword.querySelector('.material-symbols-outlined').textContent = 'visibility_off'
      } else {
        passwordInput.setAttribute('type', 'password')
        togglePassword.querySelector('.material-symbols-outlined').textContent = 'visibility'
      }
    })
  }

  if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener('click', () => {
      const type = confirmPasswordInput.getAttribute('type')
      if (type === 'password') {
        confirmPasswordInput.setAttribute('type', 'text')
        toggleConfirmPassword.querySelector('.material-symbols-outlined').textContent = 'visibility_off'
      } else {
        confirmPasswordInput.setAttribute('type', 'password')
        toggleConfirmPassword.querySelector('.material-symbols-outlined').textContent = 'visibility'
      }
    })
  }
}

// Xử lý submit form đăng ký
function setupRegisterForm() {
  const form = document.getElementById('registerForm')
  const usernameInput = document.getElementById('username')
  const emailInput = document.getElementById('email')
  const passwordInput = document.getElementById('password')
  const confirmPasswordInput = document.getElementById('confirmPassword')
  const termsCheckbox = document.getElementById('terms')
  const submitBtn = form.querySelector('button[type="submit"]')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Clear previous errors
    clearError('username')
    clearError('email')
    clearError('password')
    clearError('confirmPassword')

    // Get values
    const username = usernameInput.value.trim()
    const email = emailInput.value.trim()
    const password = passwordInput.value
    const confirmPassword = confirmPasswordInput.value

    // Validate
    let hasError = false

    // Username validation
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.isValid) {
      showError('username', usernameValidation.message)
      hasError = true
    }

    // Email validation
    if (!email) {
      showError('email', 'Vui lòng nhập email')
      hasError = true
    } else if (!isValidEmail(email)) {
      showError('email', 'Email không hợp lệ')
      hasError = true
    }

    // Password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      showError('password', passwordValidation.message)
      hasError = true
    }

    // Confirm password validation
    if (!confirmPassword) {
      showError('confirmPassword', 'Vui lòng xác nhận mật khẩu')
      hasError = true
    } else if (password !== confirmPassword) {
      showError('confirmPassword', 'Mật khẩu xác nhận không khớp')
      hasError = true
    }

    // Terms validation
    if (!termsCheckbox.checked) {
      showToast('Vui lòng đồng ý với điều khoản sử dụng', 'error')
      hasError = true
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
      // Call signup API
      const { user, error } = await authService.signUp(email, password, username)

      if (error) {
        showToast(error, 'error')
        submitBtn.disabled = false
        submitBtn.innerHTML = originalText
        return
      }

      if (user) {
        // Show success message
        showToast('Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.', 'success')

        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/template/Login.html'
        }, 2000)
      }
    } catch (error) {
      console.error('Register error:', error)
      showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error')
      submitBtn.disabled = false
      submitBtn.innerHTML = originalText
    }
  })

  // Real-time validation
  usernameInput.addEventListener('blur', () => {
    const username = usernameInput.value.trim()
    if (username) {
      const validation = validateUsername(username)
      if (!validation.isValid) {
        showError('username', validation.message)
      } else {
        clearError('username')
      }
    }
  })

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
    // Also check confirm password if it has value
    if (confirmPasswordInput.value) {
      if (passwordInput.value !== confirmPasswordInput.value) {
        showError('confirmPassword', 'Mật khẩu xác nhận không khớp')
      } else {
        clearError('confirmPassword')
      }
    }
  })

  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
      showError('confirmPassword', 'Mật khẩu xác nhận không khớp')
    } else {
      clearError('confirmPassword')
    }
  })
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Register page initialized')
  
  setupPasswordToggles()
  setupRegisterForm()
})
