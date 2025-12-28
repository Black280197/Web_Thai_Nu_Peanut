// Register page initialization
import { handleRegister, initPasswordToggle } from './auth.js'
import { requireGuest } from './supabase-client.js'

// Check if user is already logged in
await requireGuest()

// Initialize password toggle for both password fields
initPasswordToggle()

// Get form elements
const registerForm = document.getElementById('register-form')
const usernameInput = document.getElementById('username')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const confirmPasswordInput = document.getElementById('confirm-password')
const termsCheckbox = document.getElementById('terms')
const submitButton = document.getElementById('submit-button')

// Handle form submission
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  // Check terms
  if (!termsCheckbox.checked) {
    document.getElementById('form-error').textContent = 'Vui lòng đồng ý với điều khoản dịch vụ'
    document.getElementById('form-error').classList.remove('hidden')
    return
  }
  
  const username = usernameInput.value
  const email = emailInput.value
  const password = passwordInput.value
  const confirmPassword = confirmPasswordInput.value
  
  // Disable button
  submitButton.disabled = true
  submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> <span>Đang đăng ký...</span>'
  
  // Register
  const success = await handleRegister(email, password, confirmPassword, username)
  
  if (!success) {
    // Re-enable button
    submitButton.disabled = false
    submitButton.innerHTML = '<span>Đăng ký</span><span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>'
  }
})

// Setup password toggle buttons
const passwordToggle = document.querySelector('[data-password-toggle="password"]')
const confirmPasswordToggle = document.querySelector('[data-password-toggle="confirm-password"]')

if (!passwordToggle) {
  const btn = document.getElementById('toggle-password')
  if (btn) btn.setAttribute('data-password-toggle', 'password')
}

if (!confirmPasswordToggle) {
  const btn = document.getElementById('toggle-confirm-password')
  if (btn) btn.setAttribute('data-password-toggle', 'confirm-password')
}
