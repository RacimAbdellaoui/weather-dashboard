const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const weatherContainer = document.getElementById("weather-container");
const errorMessage = document.getElementById("error-message");

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    showError("Veuillez saisir un nom de ville.");
    return;
  }

  try {
    const geo = await fetchLocation(city);
    const weather = await fetchWeather(geo.latitude, geo.longitude);

    renderWeather(geo, weather);
    hideError();
  } catch (err) {
    showError(err.message || "Impossible de récupérer les données météo.");
  }
});

async function fetchLocation(city) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`
  );

  if (!response.ok) {
    throw new Error("La recherche de localisation a échoué.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Aucune ville trouvée pour "${city}".`);
  }

  const result = data.results[0];
  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    timezone: "auto",
    forecast_days: 5,
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("La requête météo a échoué.");
  }

  return response.json();
}

function renderWeather(location, data) {
  const current = data.current;
  const daily = data.daily;

  document.getElementById("city-name").textContent = `${location.name}, ${location.country}`;
  document.getElementById("last-updated").textContent = `Mis à jour : ${new Date(current.time).toLocaleString("fr-FR")}`;
  document.getElementById("temperature").textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("condition").textContent = getWeatherLabel(current.weather_code);
  document.getElementById("feels-like").textContent = `Ressentie ${Math.round(current.apparent_temperature)}°C`;
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById("sunrise").textContent = formatTime(daily.sunrise[0]);
  document.getElementById("sunset").textContent = formatTime(daily.sunset[0]);

  const weatherIcon = document.getElementById("weather-icon");
  weatherIcon.textContent = getWeatherEmoji(current.weather_code);

  const forecastList = document.getElementById("forecast-list");
  forecastList.innerHTML = "";

  for (let i = 0; i < daily.time.length; i++) {
    const item = document.createElement("div");
    item.className = "forecast-item";

    const date = new Date(daily.time[i]);
    const weekday = date.toLocaleDateString("fr-FR", { weekday: "short" });

    item.innerHTML = `
      <div class="forecast-date">${weekday}</div>
      <div class="forecast-icon">${getWeatherEmoji(daily.weather_code[i])}</div>
      <div class="forecast-temp">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</div>
      <div class="forecast-summary">${getWeatherLabel(daily.weather_code[i])}</div>
    `;

    forecastList.appendChild(item);
  }

  weatherContainer.classList.remove("hidden");
}

function getWeatherLabel(code) {
  const weatherMap = {
    0: "ciel clair",
    1: "principalement clair",
    2: "partiellement nuageux",
    3: "couvert",
    45: "brouillard",
    48: "brouillard givrant",
    51: "bruine légère",
    53: "bruine modérée",
    55: "bruine dense",
    56: "bruine verglaçante légère",
    57: "bruine verglaçante dense",
    61: "pluie légère",
    63: "pluie modérée",
    65: "fortes pluies",
    66: "pluie verglaçante légère",
    67: "pluie verglaçante forte",
    71: "neige légère",
    73: "neige modérée",
    75: "fortes chutes de neige",
    77: "grains de neige",
    80: "averse de pluie",
    81: "fortes averses de pluie",
    82: "averses de pluie violentes",
    85: "averses de neige",
    86: "fortes averses de neige",
    95: "orage",
    96: "orage avec grêle",
    99: "orage violent",
  };

  return weatherMap[code] || "météo";
}

function getWeatherEmoji(code) {
  const emojiMap = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌧️",
    56: "🌧️",
    57: "🌧️",
    61: "🌦️",
    63: "🌧️",
    65: "🌧️",
    66: "🌧️",
    67: "🌧️",
    71: "🌨️",
    73: "🌨️",
    75: "❄️",
    77: "❄️",
    80: "🌦️",
    81: "🌧️",
    82: "⛈️",
    85: "🌨️",
    86: "❄️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };

  return emojiMap[code] || "🌤️";
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function hideError() {
  errorMessage.classList.add("hidden");
}
