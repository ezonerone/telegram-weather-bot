// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#0f172a');
tg.setBackgroundColor('#0f172a');

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherContainer = document.getElementById('weather-container');

// Initialize with user's city from start_param if available
if (tg.initDataUnsafe.start_param) {
    const city = decodeURIComponent(tg.initDataUnsafe.start_param);
    cityInput.value = city;
    getWeather(city);
} else {
    getWeather('Moscow'); // Default city
}

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    } else {
        showError('Please enter a city name');
    }
});

// Get weather by city name
async function getWeather(city) {
    showLoader();
    
    try {
        const response = await fetch(`/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (data.cod && data.cod !== 200) {
            showError(data.message || 'City not found');
        } else {
            renderWeather(data);
        }
    } catch (error) {
        showError('Failed to fetch weather data');
        console.error('Weather fetch error:', error);
    }
}

// Render weather data
function renderWeather(data) {
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    weatherContainer.innerHTML = `
        <div class="current-weather">
            <h2>${data.name}, ${data.sys.country}</h2>
            <div class="temp">${temp}°C</div>
            <div class="description">${capitalizeFirstLetter(data.weather[0].description)}</div>
            <img src="${iconUrl}" alt="${data.weather[0].description}" width="120">
            
            <div class="details">
                <div class="detail-card">
                    <div>Feels like</div>
                    <div><strong>${feelsLike}°C</strong></div>
                </div>
                <div class="detail-card">
                    <div>Humidity</div>
                    <div><strong>${data.main.humidity}%</strong></div>
                </div>
                <div class="detail-card">
                    <div>Wind</div>
                    <div><strong>${data.wind.speed} m/s</strong></div>
                </div>
                <div class="detail-card">
                    <div>Pressure</div>
                    <div><strong>${data.main.pressure} hPa</strong></div>
                </div>
            </div>
        </div>
        
        <h3>5-Day Forecast</h3>
        <div class="forecast" id="forecast-container">
            Loading forecast...
        </div>
    `;
    
    getForecast(data.coord.lat, data.coord.lon);
}

// Get forecast data
async function getForecast(lat, lon) {
    try {
        const response = await fetch(`/forecast?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        renderForecast(data);
    } catch (error) {
        console.error('Forecast error:', error);
        document.getElementById('forecast-container').innerHTML = 'Forecast unavailable';
    }
}

// Render forecast
function renderForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    const forecastsByDay = {};
    
    // Group forecasts by day
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        if (!forecastsByDay[date]) {
            forecastsByDay[date] = item;
        }
    });
    
    // Create forecast cards
    let forecastHTML = '';
    const days = Object.keys(forecastsByDay).slice(0, 5);
    
    days.forEach(day => {
        const forecast = forecastsByDay[day];
        const dayTemp = Math.round(forecast.main.temp);
        const iconUrl = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;
        
        forecastHTML += `
            <div class="forecast-day">
                <div>${day}</div>
                <img src="${iconUrl}" alt="${forecast.weather[0].description}" width="40">
                <div><strong>${dayTemp}°C</strong></div>
                <div>${forecast.weather[0].main}</div>
            </div>
        `;
    });
    
    forecastContainer.innerHTML = forecastHTML;
}

// Helper functions
function showLoader() {
    weatherContainer.innerHTML = '<div class="loader">Loading weather data...</div>';
}

function showError(message) {
    weatherContainer.innerHTML = `<div class="error">${message}</div>`;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Theme detection
function detectTheme() {
    if (tg.colorScheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
    } else {
        document.documentElement.classList.add('light-theme');
    }
}

// Initialize theme
detectTheme();
