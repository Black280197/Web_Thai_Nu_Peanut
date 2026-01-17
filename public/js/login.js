// Login page initialization
import { handleLogin, initPasswordToggle, handleOAuthLogin } from './auth.js'
import { requireGuest, supabase } from './supabase-client.js'

// Check if user is already logged in
await requireGuest()

// Load site settings for login page
async function loadLoginSettings() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['login_welcome_title', 'login_welcome_message', 'login_slogan'])

    if (error) throw error

    if (data && data.length > 0) {
      data.forEach(setting => {
        if (setting.setting_key === 'login_welcome_title') {
          const titleEl = document.getElementById('login-title')
          if (titleEl) titleEl.textContent = setting.setting_value
        } else if (setting.setting_key === 'login_welcome_message') {
          const messageEl = document.getElementById('login-message')
          if (messageEl) messageEl.textContent = setting.setting_value
        } else if (setting.setting_key === 'login_slogan') {
          const sloganEl = document.getElementById('login-slogan')
          if (sloganEl) sloganEl.innerHTML = setting.setting_value
        }
      })
    }
  } catch (error) {
    console.error('Error loading login settings:', error)
    // Keep default values if error
  }
}

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
  submitButton.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> <span>Logging ins...</span>'

  // Login
  const success = await handleLogin(email, password)

  if (!success) {
    // Re-enable button
    submitButton.disabled = false
    submitButton.innerHTML = '<span>Login</span><span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>'
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

// Load login settings from database
loadLoginSettings()
