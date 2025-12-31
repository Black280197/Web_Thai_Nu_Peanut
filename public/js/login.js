// Login page initialization
import { handleLogin, initPasswordToggle, handleOAuthLogin } from './auth.js'
import { requireGuest } from './supabase-client.js'

// Check if user is already logged in
await requireGuest()

// Initialize slideshow
function initLoginSlideshow() {
  const images = [
    '/assets/img_peanuts/0fe8f6cbebafe8e545d053dcf3ee9380.jpg',
    '/assets/img_peanuts/2c340752e66f620443a72b46f630ece5.jpg',
    '/assets/img_peanuts/2db4366d6cc53f84237209e982ef7c19.jpg',
    '/assets/img_peanuts/3a51444fe53f876c0d9f39953cb0c7a4.jpg',
    '/assets/img_peanuts/72a24ffdeb8497e51f0b43464e6beb2f.jpg',
    '/assets/img_peanuts/99c6043ff6b60466e0e368654135621f.jpg',
    '/assets/img_peanuts/b1dfe44bb3cbcf0921e6236a53ef6446.jpg',
    '/assets/img_peanuts/caf563a1020e1716156c4585e90d4b42.jpg'
  ]
  
  const container = document.getElementById('login-slideshow')
  if (!container) return
  
  let currentIndex = 0
  
  // Create img element
  const img = document.createElement('img')
  img.src = images[0]
  img.alt = 'Peanut'
  img.className = 'w-full h-full object-cover transition-opacity duration-1000 ease-in-out'
  img.style.opacity = '1'
  container.appendChild(img)
  
  // Rotate images every 4 seconds with smooth fade
  setInterval(() => {
    img.style.opacity = '0'
    
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % images.length
      img.src = images[currentIndex]
      img.style.opacity = '1'
    }, 1000)
  }, 4000)
}

// Initialize slideshow
initLoginSlideshow()

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
