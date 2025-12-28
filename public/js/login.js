// Login page initialization
import { handleLogin, initPasswordToggle, handleOAuthLogin } from './auth.js'
import { requireGuest } from './supabase-client.js'

// Check if user is already logged in
await requireGuest()

// Initialize password toggle
initPasswordToggle()

// Get form elements
const loginForm = document.getElementById('login-form')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const submitButton = document.getElementById('submit-button')
const googleButton = document.getElementById('google-login')
const twitterButton = document.getElementById('twitter-login')
const discordButton = document.getElementById('discord-login')

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const email = emailInput.value
  const password = passwordInput.value
  
  // Disable button
  submitButton.disabled = true
  submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> <span>Đang đăng nhập...</span>'
  
  // Login
  const success = await handleLogin(email, password)
  
  if (!success) {
    // Re-enable button
    submitButton.disabled = false
    submitButton.innerHTML = '<span>Đăng nhập</span><span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>'
  }
})

// Handle OAuth login
if (googleButton) {
  googleButton.addEventListener('click', () => handleOAuthLogin('google'))
}

if (twitterButton) {
  twitterButton.addEventListener('click', () => handleOAuthLogin('twitter'))
}

if (discordButton) {
  discordButton.addEventListener('click', () => handleOAuthLogin('discord'))
}

// Update password toggle button
const passwordToggle = document.querySelector('button[type="button"]')
if (passwordToggle) {
  passwordToggle.setAttribute('data-password-toggle', 'password')
}
