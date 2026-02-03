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
            .select('id, content, image_url, users!wishes_user_id_fkey(username)')
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
    const delay = Math.random() * 1000 // 0-2 seconds delay

    bubble.className = `bubble ${sizeClass}`
    bubble.style.left = `${leftPosition}px`
    bubble.style.animationDelay = `${delay}ms`

    // Store wish data in bubble element
    bubble.dataset.wishId = randomWish.id
    bubble.dataset.username = randomWish.users?.username || 'Anonymous'
    bubble.dataset.content = randomWish.content
    bubble.dataset.imageUrl = randomWish.image_url || ''
    bubble.dataset.sticker = randomWish.sticker || '🎉'

    // Add click handler
    bubble.addEventListener('click', () => {
        const wishData = {
            id: bubble.dataset.wishId,
            content: bubble.dataset.content,
            image_url: bubble.dataset.imageUrl,
            sticker: bubble.dataset.sticker,
            users: { username: bubble.dataset.username }
        }
        showWishModal(wishData, bubble.dataset.username)
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

function hasKorean(text) {
    // Regex này cover hết Hangul syllables + jamo cơ bản + compatibility jamo
    const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
    return koreanRegex.test(text);
}

// Show wish modal
function showWishModal(wish, username) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('wish-modal')
    if (!modal) {
        modal = document.createElement('div')
        modal.id = 'wish-modal'
        modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm hidden'
        modal.innerHTML = `
            <div class="frame-popup-container max-w-2xl w-full" style="min-height: 48rem;">
                <div class="max-h-[70vh] p-8 relative w-full z-[1] child-of-container" style="padding: 16rem 3rem 3rem; max-height: 70vh;width: 37.7rem;position: absolute; z-index: 11;top: -2rem; right: 2rem;">
                            <!-- Close button -->
                            <button id="close-wish-modal" class="absolute top-2 right-2 p-2 hover:bg-white/20 rounded-full transition-colors z-20 bg-black/30 backdrop-blur-sm" style="display: none;">
                                <span class="material-symbols-outlined text-white text-2xl">close</span>
                            </button>
                            <!-- Frame overlay -->
                            <div class="frame-overlay" style="display: flex;justify-content: center;">
                                <!-- Modal content -->
                                
                            </div>
                            <!-- Content -->
                            <div id="wish-content-display" class="max-w-none overflow-y-auto text-white thin-scroll" style="text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5);max-height: 23rem;padding-bottom: 6rem;overflow-y: auto;scrollbar-width: none;" bis_skin_checked="1">
                                <div class="flex items-center justify-center gap-2 mb-4 hidden">
                                    <span id="modal-sticker" class="text-5xl"></span>
                                </div>
                                <div class="text-center mb-4">
                                    <div class="text-red-500 text-xl font-semibold mb-2 my-candy-cake" style="text-align: left;color: #e7dcff;">From:<span id="modal-username" class="text-red font-bold text-xl"></span></div>
                                </div>
                                <div class="text-center" style="text-align: justify;">
                                    <div id="modal-content" class="text-white leading-relaxed text-lg" style="white-space: pre-wrap;font-size: 1.625rem;color: #e7dcff;"></div>
                                </div>
                                <div id="modal-image-container" class="mb-4 hidden">
                                    <img id="modal-image" src="" alt="Wish image" class="w-full max-w-md mx-auto rounded-lg border border-white/20" />
                                </div>
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
    }

    // Populate modal content
    document.getElementById('modal-username').textContent = username
    document.getElementById('modal-content').textContent = wish.content.split(":").slice(1).join(":")
    document.getElementById('modal-sticker').textContent = wish.sticker || '🎉'
    if (hasKorean(wish.content)) {
        // Có tiếng Hàn → đổi font sang font hỗ trợ Hàn ngon lành
        document.querySelector('#modal-content').classList.remove("my-candy-cake")
        document.querySelector('#modal-content').classList.add("my-korea-font") 
    } else {
        // Không có tiếng Hàn → dùng font mặc định hoặc font Việt/Anh
        document.querySelector('#modal-content').classList.add("my-candy-cake")
        document.querySelector('#modal-content').classList.remove("my-korea-font") 
    }

    // Show image if available
    const imageContainer = document.getElementById('modal-image-container')
    const imageElement = document.getElementById('modal-image')
    if (wish.image_url) {
        imageElement.src = wish.image_url
        imageContainer.classList.remove('hidden')
    } else {
        imageContainer.classList.add('hidden')
    }

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