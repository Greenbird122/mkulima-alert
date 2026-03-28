auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    loadListings();
});

const productForm = document.getElementById('productForm');
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const productName = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('price').value);
    const description = document.getElementById('description').value;
    const contact = document.getElementById('contact').value;

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
});

function loadListings() {
    db.collection('marketplace')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const listingsDiv = document.getElementById('listingsList');
            listingsDiv.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const listing = document.createElement('div');
                listing.className = 'listing';
                listing.innerHTML = `
                    <h3>${data.productName}</h3>
                    <div class="price">KES ${data.price}</div>
                    <p>${data.description}</p>
                    <p><strong>Contact:</strong> ${data.contact}</p>
                    <p><em>Posted by ${data.userName}</em></p>
                    ${data.userId === auth.currentUser?.uid ? `<button class="delete-btn" data-id="${doc.id}">Delete</button>` : ''}
                `;
                listingsDiv.appendChild(listing);
            });

            // Attach delete listeners
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('Delete this listing?')) {
                        await db.collection('marketplace').doc(id).delete();
                    }
                });
            });
        });
}

function showNotification(type, message) {
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

window.logout = function() {
    auth.signOut().then(() => window.location.href = "index.html");
};