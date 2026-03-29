// ============================================
// OpenWeatherMap API Key – REPLACE WITH YOUR KEY
// ============================================
const WEATHER_API_KEY = '448db4ca858db5dddfefff8bf17c8030'; // <-- Put your key here

// Helper: show notification (reuse from earlier)
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

// Helper: format date to "Mon 25"
function formatDay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

// Fetch and display weather
async function fetchWeather(county) {
    const container = document.getElementById('weatherContainer');
    if (!container) return;

    if (!WEATHER_API_KEY || WEATHER_API_KEY === '448db4ca858db5dddfefff8bf17c8030') {
        container.innerHTML = '<div class="error-message">⚠️ Weather API key missing. Please add your OpenWeatherMap API key in dashboard.js.</div>';
        return;
    }

    const city = county.trim();
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`;

    // Show loading spinner
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Weather API error');
        }
        const data = await response.json();

        // Extract current weather (first entry, today at noon)
        const current = data.list[0];
        const currentTemp = Math.round(current.main.temp);
        const feelsLike = Math.round(current.main.feels_like);
        const humidity = current.main.humidity;
        const windSpeed = current.wind.speed;
        const description = current.weather[0].description;
        const icon = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;

        // Group forecast by day
        const daily = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!daily[date]) {
                daily[date] = item;
            }
        });
        const forecastArray = Object.values(daily).slice(1, 8); // next 7 days

        // Build HTML
        let html = `
            <div class="current-weather">
                <div class="location">${city}</div>
                <div class="weather-main">
                    <div class="temp">${currentTemp}°C</div>
                    <div class="weather-icon"><img src="${icon}" alt="${description}"></div>
                </div>
                <div class="description">${description}</div>
                <div class="details">
                    <div class="detail-item"><i data-lucide="thermometer"></i> Feels like ${feelsLike}°C</div>
                    <div class="detail-item"><i data-lucide="droplet"></i> Humidity ${humidity}%</div>
                    <div class="detail-item"><i data-lucide="wind"></i> Wind ${windSpeed} m/s</div>
                </div>
            </div>
            <h3 style="margin: 2rem 0 1rem;">7-Day Forecast</h3>
            <div class="forecast-grid">
        `;

        forecastArray.forEach(day => {
            const dayName = formatDay(day.dt_txt.split(' ')[0]);
            const tempHigh = Math.round(day.main.temp_max);
            const tempLow = Math.round(day.main.temp_min);
            const iconCode = day.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            html += `
                <div class="forecast-card">
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon"><img src="${iconUrl}" alt=""></div>
                    <div class="forecast-temp">
                        <span class="forecast-temp-high">${tempHigh}°</span>
                        <span class="forecast-temp-low">${tempLow}°</span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
        lucide.createIcons(); // re‑render icons
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="error-message">⚠️ Could not fetch weather for "${city}". Please check the county name or your API key.</div>`;
    }
}

// Firebase Auth & Firestore integration
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
        const container = document.getElementById('weatherContainer');
        if (container) container.innerHTML = '<div class="error-message">Please select your county above to see the forecast.</div>';
    } else {
        // Existing user: load saved county
        const savedCounty = doc.data().county;
        const countySelect = document.getElementById('countySelect');
        if (savedCounty && countySelect) {
            countySelect.value = savedCounty;
            fetchWeather(savedCounty);
        } else if (countySelect) {
            const container = document.getElementById('weatherContainer');
            if (container) container.innerHTML = '<div class="error-message">Select your county above to see the forecast.</div>';
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
