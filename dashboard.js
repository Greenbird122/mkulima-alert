// OpenWeatherMap API key (get from https://openweathermap.org/api)
const WEATHER_API_KEY = '448db4ca858db5dddfefff8bf17c8030';

// Helper function to show a simple notification (you can reuse your existing showNotification)
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

// Wait for Firebase Auth to be ready
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        // Not logged in → redirect to home
        window.location.href = "index.html";
        return;
    }

    // Display user name
    document.getElementById('userName').textContent = user.displayName || 'Farmer';

    // Load or create user profile in Firestore
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
        // New user: create profile
        await userRef.set({
            name: user.displayName,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            county: null // will be set later
        });
        // Show county selector (it's already visible, but we can prompt)
        showNotification('info', 'Please select your county to get weather updates.');
    } else {
        // Existing user: load saved county
        const savedCounty = doc.data().county;
        if (savedCounty) {
            document.getElementById('countySelect').value = savedCounty;
            fetchWeather(savedCounty);
        }
    }

    // Listen for county selection changes
    const countySelect = document.getElementById('countySelect');
    countySelect.addEventListener('change', async (e) => {
        const county = e.target.value;
        if (!county) return;
        // Save to Firestore
        await userRef.update({ county: county });
        fetchWeather(county);
    });
});

async function fetchWeather(county) {
    if (!WEATHER_API_KEY || WEATHER_API_KEY === '448db4ca858db5dddfefff8bf17c8030') {
        document.getElementById('weatherWidget').innerHTML = '<p class="error">Weather API key missing. Please add your OpenWeatherMap API key.</p>';
        return;
    }

    // Map county name to city name (OpenWeather uses city names)
    // For simplicity, we'll use the county name as city. You may need to adjust for some counties.
    const city = county;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        const data = await response.json();

        // Group forecast by day (we want one forecast per day)
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = item;
            }
        });

        // Convert to array and limit to 7 days
        const forecastArray = Object.values(dailyForecasts).slice(0, 7);

        let html = '<div class="forecast-grid">';
        forecastArray.forEach(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
            const temp = Math.round(day.main.temp);
            const desc = day.weather[0].description;
            const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
            html += `
                <div class="forecast-card">
                    <div><strong>${date}</strong></div>
                    <img src="${icon}" alt="${desc}">
                    <div>${temp}°C</div>
                    <div>${desc}</div>
                </div>
            `;
        });
        html += '</div>';
        document.getElementById('weatherWidget').innerHTML = html;
    } catch (error) {
        console.error(error);
        document.getElementById('weatherWidget').innerHTML = '<p>Could not fetch weather. Check city name or API key.</p>';
    }
}

// Logout function
window.logout = function() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
};
