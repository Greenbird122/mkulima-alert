const categories = ['Crops', 'Pests', 'Weather', 'General', 'Livestock'];

let currentCategory = 'Crops';

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    loadCategories();
    loadTopics(currentCategory);
});

function loadCategories() {
    const container = document.getElementById('categoryList');
    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.className = `category-btn ${cat === currentCategory ? 'active' : ''}`;
        btn.onclick = () => {
            currentCategory = cat;
            loadTopics(cat);
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        container.appendChild(btn);
    });
}

function loadTopics(category) {
    db.collection('forum_topics')
        .where('category', '==', category)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const topicsDiv = document.getElementById('topicsList');
            topicsDiv.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const topicDiv = document.createElement('div');
                topicDiv.className = 'topic';
                topicDiv.innerHTML = `
                    <div class="topic-title">${data.title}</div>
                    <div class="topic-meta">By ${data.userName} · ${new Date(data.createdAt?.toDate()).toLocaleDateString()}</div>
                    <div>${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}</div>
                `;
                topicDiv.onclick = () => {
                    // We'll add a reply view later, but for now just alert
                    alert('View topic details and replies will be implemented later.');
                };
                topicsDiv.appendChild(topicDiv);
            });
        });
}

function openNewTopicModal() {
    const modal = document.getElementById('newTopicModal');
    const categorySelect = document.getElementById('topicCategory');
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('newTopicModal').style.display = 'none';
}

document.getElementById('newTopicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const category = document.getElementById('topicCategory').value;
    const title = document.getElementById('topicTitle').value;
    const content = document.getElementById('topicContent').value;

    await db.collection('forum_topics').add({
        userId: user.uid,
        userName: user.displayName,
        category: category,
        title: title,
        content: content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    closeModal();
    document.getElementById('newTopicForm').reset();
    showNotification('success', 'Topic posted!');
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

window.logout = function() {
    auth.signOut().then(() => window.location.href = "index.html");
};