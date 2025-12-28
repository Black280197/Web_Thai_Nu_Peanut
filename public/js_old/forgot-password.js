/**
 * Forgot Password Page Logic
 * Xử lý form quên mật khẩu
 */

import { authService } from '../../src/services/auth.service.js'
import { isValidEmail, showError, clearError, showToast } from '../../src/utils/validation.js'

// Xử lý submit form forgot password
function setupForgotPasswordForm() {
  const form = document.getElementById('forgotPasswordForm')
  const emailInput = document.getElementById('email')
  const submitBtn = form.querySelector('button[type="submit"]')
  const successMessage = document.getElementById('successMessage')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Clear previous errors
    clearError('email')
    successMessage.classList.add('hidden')

    // Get value
    const email = emailInput.value.trim()

    // Validate
    if (!email) {
      showError('email', 'Vui lòng nhập email')
      return
    }

    if (!isValidEmail(email)) {
      showError('email', 'Email không hợp lệ')
      return
    }

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
      // Call reset password API
      const { error } = await authService.resetPassword(email)

      if (error) {
        showToast(error, 'error')
        submitBtn.disabled = false
        submitBtn.innerHTML = originalText
        return
      }

      // Show success message
      successMessage.classList.remove('hidden')
      form.classList.add('hidden')
      showToast('Email đặt lại mật khẩu đã được gửi!', 'success')

      // Reset button
      submitBtn.disabled = false
      submitBtn.innerHTML = originalText
    } catch (error) {
      console.error('Forgot password error:', error)
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Forgot password page initialized')
  
  setupForgotPasswordForm()
})
