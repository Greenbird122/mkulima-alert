// ========== HANDLE FORM SUBMISSION ==========
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const modal = document.getElementById('signupModal');
    const getStartedBtns = document.querySelectorAll('.btn-primary, .cta-btn, .hero-buttons .btn-hero-secondary');
    const closeModalBtn = document.querySelector('.modal-close');

    // Function to show notification
    function showNotification(type, message) {
        // Remove existing notification
        const oldNotif = document.querySelector('.notification-toast');
        if (oldNotif) oldNotif.remove();

        const notif = document.createElement('div');
        notif.className = `notification-toast ${type}`;
        notif.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 5000);
    }

    // Save farmer to localStorage
    function saveFarmer(formData) {
        let farmers = JSON.parse(localStorage.getItem('mkulima_farmers') || '[]');
        // Check if phone already exists
        const existing = farmers.find(f => f.phone === formData.phone);
        if (existing) {
            showNotification('error', 'This phone number is already registered!');
            return false;
        }
        farmers.push({
            ...formData,
            registeredAt: new Date().toISOString()
        });
        localStorage.setItem('mkulima_farmers', JSON.stringify(farmers));
        return true;
    }

    // Handle form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Get values
            const name = document.querySelector('input[name="name"]').value.trim();
            const phone = document.querySelector('input[name="phone"]').value.trim();
            const location = document.querySelector('input[name="location"]').value.trim();
            const crops = document.querySelector('input[name="crops"]').value.trim();

            // Basic validation
            if (!name || !phone || !location) {
                showNotification('error', 'Please fill in all required fields.');
                return;
            }
            // Simple Kenyan phone validation (starts with 0 or +254)
            if (!phone.match(/^(\+254|0)[7-9][0-9]{8}$/)) {
                showNotification('error', 'Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678).');
                return;
            }

            const formData = { name, phone, location, crops };
            if (saveFarmer(formData)) {
                showNotification('success', 'Thank you! You will receive SMS alerts when we launch.');
                signupForm.reset();
                // Close modal after 2 seconds
                setTimeout(() => {
                    if (modal) modal.classList.remove('active');
                }, 2000);
            }
        });
    }

    // Modal open/close functions
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId + 'Modal');
        if (modal) modal.classList.add('active');
    };
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId + 'Modal');
        if (modal) modal.classList.remove('active');
    };

    // Attach open modal to buttons
    getStartedBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('signup');
        });
    });

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeModal('signup'));
    }

    // Close modal if clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal('signup');
    });
});

// ========== GOOGLE SIGN-IN ==========
window.loginWithGoogle = function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      // Successful login, redirect to dashboard
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error(error);
      showNotification('error', 'Login failed. Please try again.');
    });
};

// ========== ADD NOTIFICATION STYLES DYNAMICALLY ==========
const notificationStyles = `
    .notification-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    }
    .notification-toast.show {
        transform: translateX(0);
    }
    .notification-content {
        background: white;
        border-radius: 12px;
        padding: 16px 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
        border-left: 4px solid;
    }
    .notification-toast.success .notification-content {
        border-left-color: #10b981;
    }
    .notification-toast.error .notification-content {
        border-left-color: #ef4444;
    }
    .notification-icon {
        font-size: 20px;
        font-weight: bold;
    }
    .notification-toast.success .notification-icon {
        color: #10b981;
    }
    .notification-toast.error .notification-icon {
        color: #ef4444;
    }
    .notification-message {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #1f2937;
    }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ========== SMOOTH SCROLLING ==========
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
};

// ========== MOBILE MENU ==========
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    if (menu && overlay) {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
    }
};
window.closeMobileMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    if (menu && overlay) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    }
};

// ========== CURRENT YEAR IN FOOTER ==========
const yearSpan = document.getElementById('currentYear');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();