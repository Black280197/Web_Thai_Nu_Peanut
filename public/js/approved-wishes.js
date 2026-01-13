// Approved Wishes Management
import { supabase, getCurrentUser } from './supabase-client.js'

class ApprovedWishesManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.wishesPerPage = 10;
        this.allWishes = [];
        this.filteredWishes = [];
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        try {
            // Check authentication
            this.currentUser = await getCurrentUser();
            
            this.setupEventListeners();
            await this.loadWishes();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Có lỗi xảy ra khi khởi tạo trang.');
        }
    }

    setupEventListeners() {
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', async (e) => {
                const filter = e.target.dataset.filter;
                this.setActiveFilter(filter);
                await this.filterWishes(filter);
            });
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', async () => {
                await this.loadMore();
            });
        }
    }

    setActiveFilter(filter) {
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.currentFilter = filter;
        this.currentPage = 1;
    }

    async loadWishes() {
        try {
            const container = document.getElementById('wishes-container');
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p class="mt-3">Đang tải lời chúc...</p>
                </div>
            `;

            // Build query
            let query = supabase
                .from('wishes')
                .select(`
                    *,
                    users!wishes_user_id_fkey(username, avatar_url)
                `)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            this.allWishes = data || [];
            await this.filterWishes(this.currentFilter);

        } catch (error) {
            console.error('Error loading wishes:', error);
            this.showError('Không thể tải danh sách lời chúc.');
        }
    }

    async filterWishes(filter) {
        if (filter === 'all') {
            this.filteredWishes = this.allWishes;
        } else {
            this.filteredWishes = this.allWishes.filter(wish => wish.type === filter);
        }
        
        this.renderWishes();
    }

    async renderWishes() {
        const container = document.getElementById('wishes-container');
        const loadMoreContainer = document.getElementById('load-more-container');
        
        if (this.filteredWishes.length === 0) {
            container.innerHTML = `
                <div class="no-wishes">
                    <i class="fas fa-heart-broken fa-3x mb-3"></i>
                    <h4>Chưa có lời chúc nào</h4>
                    <p>Hãy quay lại sau để xem những lời chúc mới nhé!</p>
                </div>
            `;
            loadMoreContainer.style.display = 'none';
            return;
        }

        const wishesToShow = this.filteredWishes.slice(0, this.currentPage * this.wishesPerPage);
        
        // Create wish cards asynchronously
        const wishCards = await Promise.all(wishesToShow.map(wish => this.createWishCard(wish)));
        container.innerHTML = wishCards.join('');
        
        // Show/hide load more button
        const hasMore = wishesToShow.length < this.filteredWishes.length;
        loadMoreContainer.style.display = hasMore ? 'block' : 'none';

        // Setup like buttons
        this.setupLikeButtons();
    }

    async createWishCard(wish) {
        const user = wish.users || {};
        const avatar = user.avatar_url || this.getDefaultAvatar(user.username);
        
        // Get like count separately
        let likeCount = 0;
        try {
            const { data: likes, error } = await supabase
                .from('likes')
                .select('*')
                .eq('target_type', 'wish')
                .eq('target_id', wish.id);
            
            if (!error && likes) {
                likeCount = likes.length;
            }
        } catch (error) {
            console.error('Error getting like count:', error);
        }
        
        return `
            <div class="wish-card" data-wish-id="${wish.id}">
                <div class="wish-header">
                    <div class="wish-avatar">
                        ${avatar.startsWith('http') ? 
                            `<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                            avatar
                        }
                    </div>
                    <div class="wish-meta">
                        <p class="wish-username">${user.username || 'Anonymous'}</p>
                        <p class="wish-date">${this.formatDate(wish.created_at)}</p>
                    </div>
                    <span class="wish-type-badge wish-type-${wish.type}">
                        ${this.getTypeLabel(wish.type)}
                    </span>
                </div>
                
                <div class="wish-content">
                    ${wish.content}
                </div>
                
                ${wish.sticker ? `<div class="wish-sticker">${wish.sticker}</div>` : ''}
                
                ${wish.image_url ? `<img src="${wish.image_url}" alt="Wish image" class="wish-image">` : ''}
                
                <div class="wish-actions">
                    <button class="like-button" data-wish-id="${wish.id}" data-liked="false">
                        <i class="fas fa-heart"></i>
                        <span class="like-count">${likeCount}</span>
                    </button>
                    <small class="text-muted">
                        <i class="fas fa-clock"></i>
                        ${this.getTimeAgo(wish.created_at)}
                    </small>
                </div>
            </div>
        `;
    }

    setupLikeButtons() {
        const likeButtons = document.querySelectorAll('.like-button');
        likeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.toggleLike(button);
            });
        });

        // Check which wishes user has liked
        if (this.currentUser) {
            this.checkUserLikes();
        }
    }

    async checkUserLikes() {
        if (!this.currentUser) return;

        try {
            const wishIds = this.filteredWishes.slice(0, this.currentPage * this.wishesPerPage).map(w => w.id);
            
            const { data, error } = await supabase
                .from('likes')
                .select('target_id')
                .eq('user_id', this.currentUser.id)
                .eq('target_type', 'wish')
                .in('target_id', wishIds);

            if (error) throw error;

            const likedWishIds = data.map(like => like.target_id);
            
            likedWishIds.forEach(wishId => {
                const button = document.querySelector(`[data-wish-id="${wishId}"]`);
                if (button) {
                    button.classList.add('liked');
                    button.dataset.liked = 'true';
                }
            });

        } catch (error) {
            console.error('Error checking user likes:', error);
        }
    }

    async toggleLike(button) {
        if (!this.currentUser) {
            alert('Bạn cần đăng nhập để thả tim!');
            return;
        }

        const wishId = button.dataset.wishId;
        const isLiked = button.dataset.liked === 'true';

        try {
            button.disabled = true;
            button.classList.add('like-animation');

            if (isLiked) {
                // Remove like
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', this.currentUser.id)
                    .eq('target_type', 'wish')
                    .eq('target_id', wishId);

                if (error) throw error;

                button.classList.remove('liked');
                button.dataset.liked = 'false';
                this.updateLikeCount(button, -1);

            } else {
                // Add like
                const { error } = await supabase
                    .from('likes')
                    .insert({
                        user_id: this.currentUser.id,
                        target_type: 'wish',
                        target_id: wishId
                    });

                if (error) throw error;

                button.classList.add('liked');
                button.dataset.liked = 'true';
                this.updateLikeCount(button, 1);
            }

        } catch (error) {
            console.error('Error toggling like:', error);
            alert('Có lỗi xảy ra khi thả tim. Vui lòng thử lại!');
        } finally {
            button.disabled = false;
            setTimeout(() => {
                button.classList.remove('like-animation');
            }, 300);
        }
    }

    updateLikeCount(button, change) {
        const countElement = button.querySelector('.like-count');
        const currentCount = parseInt(countElement.textContent) || 0;
        const newCount = Math.max(0, currentCount + change);
        countElement.textContent = newCount;
    }

    async loadMore() {
        this.currentPage++;
        await this.renderWishes();
    }

    getDefaultAvatar(username) {
        const colors = ['#FF69B4', '#9370DB', '#00CED1', '#FF6347', '#32CD32']
        const initial = username ? username.charAt(0).toUpperCase() : '?'
        const color = colors[username ? username.charCodeAt(0) % colors.length : 0]
        
        return `
            <div style="
                width: 100%; 
                height: 100%; 
                background: ${color}; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
            ">${initial}</div>
        `
    }

    getTypeLabel(type) {
        const labels = {
            'daily': 'Hàng Ngày',
            'birthday': 'Sinh Nhật',
            'debut': 'Debut'
        };
        return labels[type] || type;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        
        return this.formatDate(dateString);
    }

    showError(message) {
        const container = document.getElementById('wishes-container');
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-triangle"></i>
                <h5>Oops!</h5>
                <p>${message}</p>
                <button class="btn btn-outline-danger" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Thử Lại
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ApprovedWishesManager();
});