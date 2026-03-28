// ============================================
// OpenWeatherMap API Key – REPLACE WITH YOUR KEY
// ============================================
const WEATHER_API_KEY = '448db4ca858db5dddfefff8bf17c8030'; // <-- Paste your key here

// ============================================
// Helper: Show notification (reuse from earlier)
// ============================================
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

// ============================================
// Fetch weather for a given county (city name)
// ============================================
async function fetchWeather(county) {
    const weatherDiv = document.getElementById('weatherWidget');
    if (!weatherDiv) return;

    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
        weatherDiv.innerHTML = '<p class="error">⚠️ Weather API key missing. Please add your OpenWeatherMap API key in dashboard.js.</p>';
        return;
    }

    // Map county name to a city name that OpenWeatherMap recognises.
    // For most counties, the county name works, but some might need adjustments.
    // You can expand this mapping if needed.
    const city = county.trim();

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Weather API error');
        }
        const data = await response.json();

        // Group by day (one forecast per day, using noon data)
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = item;
            }
        });

        const forecastArray = Object.values(dailyForecasts).slice(0, 7); // next 7 days

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
        weatherDiv.innerHTML = html;
    } catch (error) {
        console.error(error);
        weatherDiv.innerHTML = `<p class="error">⚠️ Could not fetch weather for "${city}". Please check the county name or your API key.</p>`;
    }
}

// ============================================
// Firebase Auth & Firestore integration
// ============================================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // Display user name
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = user.displayName || 'Farmer';

    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
        // New user: create profile
        await userRef.set({
            name: user.displayName,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            county: null
        });
        // Show a hint to select county
        const weatherDiv = document.getElementById('weatherWidget');
        if (weatherDiv) weatherDiv.innerHTML = '<p>Please select your county above to see the forecast.</p>';
    } else {
        // Existing user: load saved county
        const savedCounty = doc.data().county;
        const countySelect = document.getElementById('countySelect');
        if (savedCounty && countySelect) {
            countySelect.value = savedCounty;
            fetchWeather(savedCounty);
        } else if (countySelect) {
            // No saved county, prompt user
            const weatherDiv = document.getElementById('weatherWidget');
            if (weatherDiv) weatherDiv.innerHTML = '<p>Select your county above to see the forecast.</p>';
        }
    }

    // Listen for county selection changes
    const countySelect = document.getElementById('countySelect');
    if (countySelect) {
        countySelect.addEventListener('change', async (e) => {
            const county = e.target.value;
            if (!county) return;
            await userRef.update({ county: county });
            fetchWeather(county);
        });
    }
});
