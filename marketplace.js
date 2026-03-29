// ==================== MARKETPLACE LOGIC ====================
let currentFilter = 'all'; // 'all' or 'my'
let unsubscribe = null;

// Helper: show notification
function showNotification(type, message) {
    const oldNotif = document.querySelector('.notification-toast');
    if (oldNotif) oldNotif.remove();
    const notif = document.createElement('div');
    notif.className = `notification-toast ${type}`;
    notif.innerHTML = `<div class="notification-content"><span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span><span class="notification-message">${message}</span></div>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 5000);
}

// Helper: escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Load listings based on current filter
function loadListings() {
    if (unsubscribe) unsubscribe();

    const user = auth.currentUser;
    if (!user) return;

    let query;
    if (currentFilter === 'my') {
        query = db.collection('marketplace')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc');
    } else {
        query = db.collection('marketplace')
            .orderBy('createdAt', 'desc');
    }

    unsubscribe = query.onSnapshot(snapshot => {
        const container = document.getElementById('listingsGrid');
        if (!container) return;
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:var(--slate-500);">No products found.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'listing-card';
            card.innerHTML = `
                <div class="content">
                    <h3>${escapeHtml(data.productName)}</h3>
                    <div class="price">KES ${data.price}</div>
                    <p>${escapeHtml(data.description)}</p>
                    <div class="contact"><strong>Contact:</strong> ${escapeHtml(data.contact)}</div>
                    <div><small>Posted by ${escapeHtml(data.userName)}</small></div>
                    ${data.userId === user.uid ? `<button class="delete-btn" data-id="${doc.id}">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });

        // Attach delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.getAttribute('data-id');
                if (confirm('Delete this listing?')) {
                    await db.collection('marketplace').doc(id).delete();
                    showNotification('success', 'Listing deleted');
                }
            });
        });
    });
}

// Form submission
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const productName = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const description = document.getElementById('description').value.trim();
        const contact = document.getElementById('contact').value.trim();

        if (!productName || !price || !description || !contact) {
            showNotification('error', 'Please fill in all fields.');
            return;
        }

        try {
            await db.collection('marketplace').add({
                userId: user.uid,
                userName: user.displayName,
                productName: productName,
                price: price,
                description: description,
                contact: contact,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            productForm.reset();
            showNotification('success', 'Product listed!');
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to post listing.');
        }
    });
}

// Authentication state change
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    loadListings();
});

// Filter buttons
const showAllBtn = document.getElementById('showAllBtn');
const showMyBtn = document.getElementById('showMyBtn');

if (showAllBtn && showMyBtn) {
    showAllBtn.addEventListener('click', () => {
        if (currentFilter === 'all') return;
        currentFilter = 'all';
        showAllBtn.classList.add('active');
        showMyBtn.classList.remove('active');
        loadListings();
    });

    showMyBtn.addEventListener('click', () => {
        if (currentFilter === 'my') return;
        currentFilter = 'my';
        showMyBtn.classList.add('active');
        showAllBtn.classList.remove('active');
        loadListings();
    });
}
