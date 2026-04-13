// ============================================
// OpenWeatherMap API Key
// ============================================
const WEATHER_API_KEY = '3718844e76e32727eb66f5a14fa67841';

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

// Format date and hour
function formatDay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

function formatHour(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Change video background based on weather condition
function setWeatherVideo(condition) {
    const video = document.getElementById('bg-video');
    if (!video) return;
    const cond = condition.toLowerCase();
    let videoUrl = '';
    if (cond.includes('clear') || cond.includes('sun')) {
        videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-sunny-day-in-a-wheat-field-41017-large.mp4';
    } else if (cond.includes('rain') || cond.includes('drizzle')) {
        videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-falling-on-wet-surface-39655-large.mp4';
    } else if (cond.includes('cloud')) {
        videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-across-the-sky-41456-large.mp4';
    } else if (cond.includes('thunder') || cond.includes('storm')) {
        videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-storm-clouds-and-lightning-27001-large.mp4';
    } else {
        videoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-sunny-day-in-a-wheat-field-41017-large.mp4';
    }
    // Only change if different to avoid reload loops
    if (video.src !== videoUrl) {
        video.src = videoUrl;
        video.load();
        video.play().catch(e => console.log('Video autoplay prevented:', e));
    }
}

// Fetch and display weather
async function fetchWeather(county) {
    const container = document.getElementById('weatherContainer');
    if (!container) return;

    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
        container.innerHTML = '<div class="error-message">⚠️ Weather API key missing.</div>';
        return;
    }

    const city = county.trim();
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`;
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        const data = await response.json();

        const current = data.list[0];
        const condition = current.weather[0].description;
        setWeatherVideo(condition);

        const currentTemp = Math.round(current.main.temp);
        const icon = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
        const humidity = current.main.humidity;
        const windSpeed = current.wind.speed;
        const feelsLike = Math.round(current.main.feels_like);

        // Hourly (next 8 intervals)
        const hourlyData = data.list.slice(0, 8);
        let hourlyHtml = '<div class="hourly-forecast"><h3>Hourly Forecast</h3><div class="hourly-list">';
        hourlyData.forEach(item => {
            const time = formatHour(item.dt);
            const temp = Math.round(item.main.temp);
            const iconCode = item.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
            hourlyHtml += `
                <div class="hourly-card">
                    <div class="hourly-time">${time}</div>
                    <div class="hourly-icon"><img src="${iconUrl}" alt=""></div>
                    <div class="hourly-temp">${temp}°</div>
                </div>
            `;
        });
        hourlyHtml += '</div></div>';

        // Daily (7 days)
        const dailyMap = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyMap[date]) dailyMap[date] = item;
        });
        const dailyArray = Object.values(dailyMap).slice(0, 7);
        let dailyHtml = '<div class="daily-forecast"><h3>7-Day Forecast</h3><div class="forecast-grid">';
        dailyArray.forEach(day => {
            const dayName = formatDay(day.dt_txt.split(' ')[0]);
            const tempHigh = Math.round(day.main.temp_max);
            const tempLow = Math.round(day.main.temp_min);
            const iconCode = day.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            dailyHtml += `
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
        dailyHtml += '</div></div>';

        container.innerHTML = `
            <div class="current-weather-compact">
                <div class="current-temp-section">
                    <div class="current-temp">${currentTemp}°C</div>
                    <div class="current-condition">${condition}</div>
                    <div class="current-details">
                        <span>💧 ${humidity}%</span>
                        <span>💨 ${windSpeed} m/s</span>
                        <span>🌡️ ${feelsLike}°</span>
                    </div>
                </div>
                <div class="current-icon">
                    <img src="${icon}" alt="${condition}">
                </div>
            </div>
            ${hourlyHtml}
            ${dailyHtml}
        `;
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="error-message">⚠️ Could not fetch weather for "${city}". Please check your county in profile.</div>`;
    }
}

// Firebase Auth
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    document.getElementById('userName').textContent = user.displayName || 'Farmer';
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    let savedCounty = null;
    if (doc.exists) {
        savedCounty = doc.data().county;
    } else {
        await userRef.set({
            name: user.displayName,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            county: null
        });
    }
    const countyDisplaySpan = document.getElementById('currentCountyDisplay');
    if (savedCounty) {
        countyDisplaySpan.textContent = savedCounty;
        fetchWeather(savedCounty);
    } else {
        countyDisplaySpan.textContent = 'Not set';
        document.getElementById('weatherContainer').innerHTML = '<div class="error-message">Please <a href="profile.html">set your county</a> to see weather.</div>';
    }
});
