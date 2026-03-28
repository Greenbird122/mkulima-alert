auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
    }
});

const form = document.getElementById('consultForm');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const question = document.getElementById('question').value;

    // Save to Firestore (optional)
    const user = auth.currentUser;
    if (user) {
        await db.collection('consultations').add({
            userId: user.uid,
            name: name,
            email: email,
            question: question,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // Send email using EmailJS
    try {
        const templateParams = {
            from_name: name,
            from_email: email,
            message: question,
            to_email: 'austinewandera01@gmail.com' // change to real email
        };
        const response = await emailjs.send('service_4hqxwb6', 'template_t9tz3ke', templateParams);
        showNotification('success', 'Your question has been sent. We will respond soon.');
        form.reset();
    } catch (error) {
        console.error(error);
        showNotification('error', 'Failed to send message. Please try again later.');
    }
});

function showNotification(type, message) {
    // same as before
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