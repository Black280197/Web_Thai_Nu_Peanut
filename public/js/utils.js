// Utility functions

// Toast notification system
export function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  
  const icon = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }[type] || 'info'
  
  toast.innerHTML = `
    <span class="material-symbols-outlined text-2xl">${icon}</span>
    <div class="flex-1">
      <p class="text-white font-semibold">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white">
      <span class="material-symbols-outlined">close</span>
    </button>
  `
  
  document.body.appendChild(toast)
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10)
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 5000)
}

// XSS Protection - Sanitize HTML
export function sanitizeHTML(html) {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div')
  temp.textContent = html
  let sanitized = temp.innerHTML
  
  // Allow certain safe HTML tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img']
  const allowedAttributes = {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'width', 'height'],
    'span': ['class', 'style'],
    'div': ['class', 'style']
  }
  
  // Parse the HTML
  temp.innerHTML = html
  
  // Remove dangerous elements
  const dangerousElements = temp.querySelectorAll('script, iframe, object, embed, link, style')
  dangerousElements.forEach(el => el.remove())
  
  // Clean attributes
  const allElements = temp.querySelectorAll('*')
  allElements.forEach(el => {
    const tagName = el.tagName.toLowerCase()
    
    // Remove if not in allowed tags
    if (!allowedTags.includes(tagName)) {
      el.replaceWith(...el.childNodes)
      return
    }
    
    // Clean attributes
    const allowed = allowedAttributes[tagName] || []
    Array.from(el.attributes).forEach(attr => {
      if (!allowed.includes(attr.name)) {
        el.removeAttribute(attr.name)
      }
      
      // Clean javascript: and data: URLs
      if (attr.name === 'href' || attr.name === 'src') {
        const value = attr.value.toLowerCase()
        if (value.startsWith('javascript:') || value.startsWith('data:')) {
          el.removeAttribute(attr.name)
        }
      }
      
      // Remove event handlers
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    })
  })
  
  return temp.innerHTML
}

// Show confirmation dialog (prettier than default confirm)
export function showConfirm(message, onConfirm, onCancel) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
  modal.innerHTML = `
    <div class="bg-surface-light dark:bg-surface-dark rounded-2xl border border-pink-100 dark:border-white/5 w-full max-w-md p-6 space-y-4">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-4xl text-primary">help_outline</span>
        <h3 class="text-xl font-bold">Confirm Action</h3>
      </div>
      <p class="text-slate-600 dark:text-slate-300">${message}</p>
      <div class="flex gap-3 justify-end">
        <button class="cancel-btn px-6 py-3 rounded-full font-semibold text-slate-600 dark:text-slate-400 hover:bg-white/5 transition-all">
          Cancel
        </button>
        <button class="confirm-btn bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full font-semibold transition-all">
          Confirm
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    modal.remove()
    if (onCancel) onCancel()
  })
  
  modal.querySelector('.confirm-btn').addEventListener('click', () => {
    modal.remove()
    if (onConfirm) onConfirm()
  })
  
  // Click outside to cancel
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
      if (onCancel) onCancel()
    }
  })
}

// Upload image to Supabase Storage
export async function uploadImage(file, bucket, folder, supabase) {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB')
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    
    return publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Format date for display
export function formatDate(dateString, options = {}) {
  const date = new Date(dateString)
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }
  return date.toLocaleDateString('en-US', defaultOptions)
}

// Debounce function for search inputs
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
