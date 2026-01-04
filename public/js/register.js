// Register page initialization
import { handleRegister, initPasswordToggle } from './auth.js'
import { requireGuest, supabase } from './supabase-client.js'
import { uploadImage } from './utils.js'

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
const avatarInput = document.getElementById('avatar')
const avatarPreview = document.getElementById('avatar-preview')
const termsCheckbox = document.getElementById('terms')
const submitButton = document.getElementById('submit-button')

let selectedAvatarFile = null

// Handle avatar selection
avatarInput?.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    document.getElementById('form-error').textContent = 'Avatar image must be less than 2MB'
    document.getElementById('form-error').classList.remove('hidden')
    return
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    document.getElementById('form-error').textContent = 'Please select an image file'
    document.getElementById('form-error').classList.remove('hidden')
    return
  }
  
  selectedAvatarFile = file
  
  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar" class="w-full h-full object-cover rounded-full">`
  }
  reader.readAsDataURL(file)
})

// Handle form submission
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  // Check terms
  if (!termsCheckbox.checked) {
    document.getElementById('form-error').textContent = 'Please agree to the terms of service'
    document.getElementById('form-error').classList.remove('hidden')
    return
  }
  
  const username = usernameInput.value
  const email = emailInput.value
  const password = passwordInput.value
  const confirmPassword = confirmPasswordInput.value
  
  // Disable button
  submitButton.disabled = true
  submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> <span>Registering...</span>'
  
  // Register
  const success = await handleRegister(email, password, confirmPassword, username, selectedAvatarFile)
  
  if (!success) {
    // Re-enable button
    submitButton.disabled = false
    submitButton.innerHTML = '<span>Register</span><span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>'
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
