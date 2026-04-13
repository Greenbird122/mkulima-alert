const WEATHER_API_KEY = '3718844e76e32727eb66f5a14fa67841';

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

function formatDay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

function formatHour(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Dynamic background based on weather condition
function setWeatherBackground(condition) {
    const body = document.body;
    const main = document.querySelector('.main-content');
    const container = document.querySelector('.weather-container');
    let gradient = '';
    if (condition.includes('clear') || condition.includes('sun')) {
        gradient = 'linear-gradient(145deg, #fff5e6 0%, #ffe6cc 100%)';
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
        gradient = 'linear-gradient(145deg, #d4e0f0 0%, #b8cce6 100%)';
    } else if (condition.includes('cloud')) {
        gradient = 'linear-gradient(145deg, #e0e8f0 0%, #ccd8e6 100%)';
    } else if (condition.includes('thunder')) {
        gradient = 'linear-gradient(145deg, #2d2a4a 0%, #1e1a3a 100%)';
    } else {
        gradient = 'linear-gradient(145deg, #e6f0fa 0%, #f0f9ff 100%)';
    }
    body.style.background = gradient;
    if (container) container.style.background = 'transparent';
}

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
        setWeatherBackground(condition);

        const currentTemp = Math.round(current.main.temp);
        const icon = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
        const humidity = current.main.humidity;
        const windSpeed = current.wind.speed;
        const feelsLike = Math.round(current.main.feels_like);

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
