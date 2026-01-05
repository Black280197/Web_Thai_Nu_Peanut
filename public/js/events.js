// Events page initialization
import { getCurrentUser, isAdmin, supabase } from './supabase-client.js'
import { handleLogout } from './auth.js'

// Load and display events
async function loadEvents() {
  const container = document.getElementById('events-container')
  const loadingState = document.getElementById('loading-state')
  const emptyState = document.getElementById('empty-state')
  
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        author:author_id (username)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    
    if (error) throw error
    
    loadingState.classList.add('hidden')
    
    if (!events || events.length === 0) {
      emptyState.classList.remove('hidden')
      return
    }
    
    container.innerHTML = events.map(event => {
      const publishedDate = new Date(event.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const excerpt = event.excerpt || event.content.substring(0, 150) + '...'
      
      return `
        <article class="group bg-white/5 backdrop-blur-md border border-pink-300/20 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(236,72,153,0.3)]">
          ${event.image_url ? `
            <div class="relative h-48 overflow-hidden">
              <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          ` : ''}
          <div class="p-6">
            <div class="flex items-center gap-2 text-xs text-pink-100/50 mb-3">
              <span class="material-symbols-outlined text-sm">calendar_today</span>
              <time datetime="${event.published_at}">${publishedDate}</time>
              <span class="mx-2">•</span>
              <span class="material-symbols-outlined text-sm">person</span>
              <span>${event.author?.username || 'Admin'}</span>
            </div>
            <h2 class="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
              ${event.title}
            </h2>
            <p class="text-pink-100/70 text-sm mb-4 line-clamp-3">
              ${excerpt}
            </p>
            <button onclick="window.viewEvent('${event.id}')" class="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-semibold text-sm group/btn">
              <span>Read more</span>
              <span class="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </article>
      `
    }).join('')
    
  } catch (error) {
    console.error('Error loading events:', error)
    loadingState.classList.add('hidden')
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
        <p class="text-xl text-pink-100/70">Failed to load events</p>
      </div>
    `
  }
}

// View event detail in modal
window.viewEvent = async function(eventId) {
  const modal = document.getElementById('event-modal')
  const modalTitle = document.getElementById('modal-title')
  const modalMeta = document.getElementById('modal-meta')
  const modalContent = document.getElementById('modal-content')
  const modalImageDiv = document.getElementById('modal-image')
  const modalImg = document.getElementById('modal-img')
  
  try {
    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        author:author_id (username)
      `)
      .eq('id', eventId)
      .single()
    
    if (error) throw error
    
    // Populate modal
    modalTitle.textContent = event.title
    
    const publishedDate = new Date(event.published_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    modalMeta.innerHTML = `
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">calendar_today</span>
        <time datetime="${event.published_at}">${publishedDate}</time>
      </span>
      <span>•</span>
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">person</span>
        <span>${event.author?.username || 'Admin'}</span>
      </span>
    `
    
    // Show image if exists
    if (event.image_url) {
      modalImg.src = event.image_url
      modalImg.alt = event.title
      modalImageDiv.classList.remove('hidden')
    } else {
      modalImageDiv.classList.add('hidden')
    }
    
    // Convert content to HTML (handle line breaks)
    const contentHtml = event.content
      .split('\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p class="mb-4 text-pink-100/80 leading-relaxed">${para}</p>`)
      .join('')
    
    modalContent.innerHTML = contentHtml
    
    // Show modal
    modal.classList.remove('hidden')
    
  } catch (error) {
    console.error('Error loading event:', error)
    alert('Failed to load event details')
  }
}

// Close modal handler
function setupModal() {
  const modal = document.getElementById('event-modal')
  const closeBtn = document.getElementById('close-modal')
  
  closeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden')
  })
  
  // Close on backdrop click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden')
    }
  })
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden')
    }
  })
}

// Initialize page
async function init() {
  const user = await getCurrentUser()
  const loginButton = document.getElementById('login-button')
  const userSection = document.getElementById('user-section')
  const logoutButton = document.getElementById('logout-button')
  const adminNavLink = document.getElementById('admin-nav-link')
  
  if (user) {
    // Show user section
    userSection?.classList.remove('hidden')
    const usernameStrong = userSection?.querySelector('strong')
    if (usernameStrong) usernameStrong.textContent = user.user_metadata?.username || user.email
    
    // Check if admin
    if (await isAdmin()) {
      adminNavLink?.classList.remove('hidden')
    }
  } else {
    // Show login button
    loginButton?.classList.remove('hidden')
  }
  
  // Handle login button
  loginButton?.addEventListener('click', () => {
    window.location.href = '/login.html'
  })
  
  // Handle logout
  logoutButton?.addEventListener('click', async () => {
    await handleLogout()
    window.location.href = '/'
  })
  
  // Load events
  await loadEvents()
  
  // Setup modal
  setupModal()
}

init()
