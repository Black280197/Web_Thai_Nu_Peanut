// Landing Page JavaScript
import { supabase, getCurrentUser } from './supabase-client.js'

let wishes = []
let bubbleCount = 0
const maxBubbles = 15 // Maximum bubbles on screen at once
const bubbleInterval = 3000 // 3 seconds between new bubbles

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await initAuth()
    await loadApprovedWishes()
    startBubbleAnimation()
})

// Auth management
async function initAuth() {
    const user = await getCurrentUser()
    
    if (user) {
        document.getElementById('login-button').classList.add('hidden')
        document.getElementById('user-section').classList.remove('hidden')
        document.getElementById('username').textContent = user.email?.split('@')[0] || 'User'
        
        // Show admin link if user is admin
        if (user.role === 'admin') {
            document.getElementById('admin-nav-link')?.classList.remove('hidden')
            document.getElementById('admin-nav-link-mobile')?.classList.remove('hidden')
        }
        
        // Set avatar
        const avatar = document.getElementById('avatar')
        const avatarInner = avatar.querySelector('div')
        if (user.avatar_url) {
            avatar.style.backgroundImage = `url(${user.avatar_url})`
            avatarInner.style.display = 'none'
        } else {
            avatarInner.textContent = (user.email?.[0] || 'U').toUpperCase()
        }
        avatar.removeAttribute('hidden')
    } else {
        document.getElementById('login-button').classList.remove('hidden')
        document.getElementById('user-section').classList.add('hidden')
    }
    
    // Login button
    document.getElementById('login-button')?.addEventListener('click', () => {
        window.location.href = '/login.html'
    })
    
    // Logout button
    document.getElementById('logout-button')?.addEventListener('click', async () => {
        await supabase.auth.signOut()
        window.location.reload()
    })
}

// Load approved wishes from database
async function loadApprovedWishes() {
    try {
        const { data: wishesData, error } = await supabase
            .from('wishes')
            .select('id, content, users!wishes_user_id_fkey(username)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })

        if (error) throw error

        wishes = wishesData || []
        updateWishesCount(wishes.length)
        
        console.log(`Loaded ${wishes.length} approved wishes`)
    } catch (error) {
        console.error('Error loading wishes:', error)
        wishes = []
    }
}

// Update wishes counter
function updateWishesCount(count) {
    document.getElementById('wishes-count').textContent = count
}

// Start bubble animation
function startBubbleAnimation() {
    if (wishes.length === 0) {
        console.log('No wishes available for bubbles')
        return
    }
    
    // Create initial bubbles
    createBubble()
    
    // Set interval to create new bubbles
    setInterval(() => {
        if (bubbleCount < maxBubbles && wishes.length > 0) {
            createBubble()
        }
    }, bubbleInterval)
}

// Create a single bubble
function createBubble() {
    if (wishes.length === 0) return
    
    const container = document.getElementById('bubble-container')
    const bubble = document.createElement('div')
    
    // Random wish
    const randomWish = wishes[Math.floor(Math.random() * wishes.length)]
    
    // Random size
    const sizes = ['bubble-small', 'bubble-medium', 'bubble-large', 'bubble-xlarge']
    const sizeClass = sizes[Math.floor(Math.random() * sizes.length)]
    
    // Random horizontal position
    const leftPosition = Math.random() * (window.innerWidth - 120) // 120px buffer for bubble width
    
    // Random delay for staggered start
    const delay = Math.random() * 2000 // 0-2 seconds delay
    
    bubble.className = `bubble ${sizeClass}`
    bubble.style.left = `${leftPosition}px`
    bubble.style.animationDelay = `${delay}ms`
    
    // Bubble content
    const username = randomWish.users?.username || 'Anonymous'
    const content = truncateText(randomWish.content, 50)
    
    bubble.innerHTML = `
        <div class="bubble-content">
            <div style="font-size: 0.6em; font-weight: bold; margin-bottom: 2px;">${username}</div>
            <div style="font-size: 0.5em; opacity: 0.8;">${content}</div>
        </div>
        <div class="bubble-tooltip">
            <strong>${username}</strong><br>
            ${randomWish.content}
        </div>
    `
    
    // Add click handler
    bubble.addEventListener('click', () => {
        showWishModal(randomWish, username)
    })
    
    container.appendChild(bubble)
    bubbleCount++
    
    // Remove bubble when animation ends
    const animationDuration = getSizeAnimationDuration(sizeClass)
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.parentNode.removeChild(bubble)
            bubbleCount--
        }
    }, animationDuration + delay)
}

// Get animation duration based on bubble size
function getSizeAnimationDuration(sizeClass) {
    switch (sizeClass) {
        case 'bubble-small': return 15000
        case 'bubble-medium': return 18000
        case 'bubble-large': return 22000
        case 'bubble-xlarge': return 25000
        default: return 18000
    }
}

// Truncate text for bubble display
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

// Show wish modal
function showWishModal(wish, username) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('wish-modal')
    if (!modal) {
        modal = document.createElement('div')
        modal.id = 'wish-modal'
        modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm hidden'
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-2xl border border-pink-500/30 p-6 max-w-md w-full mx-4 backdrop-blur-md">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-pink-400">chat_bubble</span>
                        Wish Details
                    </h3>
                    <button id="close-wish-modal" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-white">close</span>
                    </button>
                </div>
                <div class="space-y-4">
                    <div class="bg-black/20 rounded-lg p-4">
                        <div class="text-pink-300 text-sm font-semibold mb-2">From:</div>
                        <div id="modal-username" class="text-white font-medium"></div>
                    </div>
                    <div class="bg-black/20 rounded-lg p-4">
                        <div class="text-pink-300 text-sm font-semibold mb-2">Message:</div>
                        <div id="modal-content" class="text-white leading-relaxed"></div>
                    </div>
                    <div class="flex justify-center">
                        <button id="close-modal-btn" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `
        document.body.appendChild(modal)
        
        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden')
            }
        })
        
        document.getElementById('close-wish-modal').addEventListener('click', () => {
            modal.classList.add('hidden')
        })
        
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            modal.classList.add('hidden')
        })
    }
    
    // Populate modal content
    document.getElementById('modal-username').textContent = username
    document.getElementById('modal-content').textContent = wish.content
    
    // Show modal
    modal.classList.remove('hidden')
}

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust bubble positions if needed
    const bubbles = document.querySelectorAll('.bubble')
    bubbles.forEach(bubble => {
        const currentLeft = parseInt(bubble.style.left)
        const maxLeft = window.innerWidth - 120
        if (currentLeft > maxLeft) {
            bubble.style.left = `${maxLeft}px`
        }
    })
})

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('wish-modal')
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden')
        }
    }
})