// =============================================
//  TRAVEL DASHBOARD — script.js
//  APIs: Open-Meteo (temps) + Frankfurter (divises)
// =============================================

// ─── 1. DADES DE CIUTATS ─────────────────────
const CITIES = {
  barcelona:  { name:"Barcelona",   country:"Espanya",       flag:"🇪🇸", lat:41.3888, lon:2.159,     currency:"EUR", timezone:"Europe/Madrid"    },
  madrid:     { name:"Madrid",      country:"Espanya",       flag:"🇪🇸", lat:40.4168, lon:-3.7038,   currency:"EUR", timezone:"Europe/Madrid"    },
  london:     { name:"London",      country:"Regne Unit",    flag:"🇬🇧", lat:51.5074, lon:-0.1278,   currency:"GBP", timezone:"Europe/London"    },
  paris:      { name:"Paris",       country:"França",        flag:"🇫🇷", lat:48.8566, lon:2.3522,    currency:"EUR", timezone:"Europe/Paris"     },
  new_york:   { name:"New York",    country:"Estats Units",  flag:"🇺🇸", lat:40.7128, lon:-74.006,   currency:"USD", timezone:"America/New_York" },
  los_angeles:{ name:"Los Angeles", country:"Estats Units",  flag:"🇺🇸", lat:34.0522, lon:-118.2437, currency:"USD", timezone:"America/Los_Angeles"},
  tokyo:      { name:"Tokyo",       country:"Japó",          flag:"🇯🇵", lat:35.6762, lon:139.6503,  currency:"JPY", timezone:"Asia/Tokyo"       },
  osaka:      { name:"Osaka",       country:"Japó",          flag:"🇯🇵", lat:34.6937, lon:135.5023,  currency:"JPY", timezone:"Asia/Tokyo"       },
  berlin:     { name:"Berlin",      country:"Alemanya",      flag:"🇩🇪", lat:52.52,   lon:13.405,    currency:"EUR", timezone:"Europe/Berlin"    },
  amsterdam:  { name:"Amsterdam",   country:"Països Baixos", flag:"🇳🇱", lat:52.3676, lon:4.9041,    currency:"EUR", timezone:"Europe/Amsterdam" },
  rome:       { name:"Roma",        country:"Itàlia",        flag:"🇮🇹", lat:41.9028, lon:12.4964,   currency:"EUR", timezone:"Europe/Rome"      },
  sydney:     { name:"Sydney",      country:"Austràlia",     flag:"🇦🇺", lat:-33.8688,lon:151.2093,  currency:"AUD", timezone:"Australia/Sydney" },
  toronto:    { name:"Toronto",     country:"Canadà",        flag:"🇨🇦", lat:43.6532, lon:-79.3832,  currency:"CAD", timezone:"America/Toronto"  },
  seoul:      { name:"Seül",        country:"Corea del Sud", flag:"🇰🇷", lat:37.5665, lon:126.978,   currency:"KRW", timezone:"Asia/Seoul"       },
  bangkok:    { name:"Bangkok",     country:"Tailàndia",     flag:"🇹🇭", lat:13.7563, lon:100.5018,  currency:"THB", timezone:"Asia/Bangkok"     },
  mexico:     { name:"Mèxic DF",    country:"Mèxic",         flag:"🇲🇽", lat:19.4326, lon:-99.1332,  currency:"MXN", timezone:"America/Mexico_City"},
  istanbul:   { name:"Istanbul",    country:"Turquia",       flag:"🇹🇷", lat:41.0082, lon:28.9784,   currency:"TRY", timezone:"Europe/Istanbul"  },
};

// ─── 2. SELECTORS DOM ─────────────────────────
const cityInput      = document.getElementById("cityInput");
const clearBtn       = document.getElementById("clearBtn");
const cityDropdown   = document.getElementById("cityDropdown");
const searchWrap     = document.getElementById("searchWrap");

const statePlaceholder = document.getElementById("statePlaceholder");
const stateLoading     = document.getElementById("stateLoading");
const stateError       = document.getElementById("stateError");
const content          = document.getElementById("content");
const errorText        = document.getElementById("errorText");
const retryBtn         = document.getElementById("retryBtn");

const destFlag     = document.getElementById("destFlag");
const destCity     = document.getElementById("destCity");
const destCountry  = document.getElementById("destCountry");
const destTemp     = document.getElementById("destTemp");
const destCurrency = document.getElementById("destCurrency");
const destTime     = document.getElementById("destTime");
const destGlow     = document.getElementById("destGlow");

const wEmoji     = document.getElementById("wEmoji");
const wCond      = document.getElementById("wCond");
const wTemp      = document.getElementById("wTemp");
const wWind      = document.getElementById("wWind");
const wHumidity  = document.getElementById("wHumidity");
const wApparent  = document.getElementById("wApparent");
const rainFill   = document.getElementById("rainFill");
const rainPct    = document.getElementById("rainPct");
const rainLabel  = document.getElementById("rainLabel");

const eurInput     = document.getElementById("eurInput");
const convertBtn   = document.getElementById("convertBtn");
const currResult   = document.getElementById("currResult");
const resEur       = document.getElementById("resEur");
const resLocal     = document.getElementById("resLocal");
const resCode      = document.getElementById("resCode");
const currRate     = document.getElementById("currRate");

const tipText    = document.getElementById("tipText");
const headerDate = document.getElementById("headerDate");

// ─── 3. ESTAT GLOBAL ──────────────────────────
let currentCity    = null;
let lastWeather    = null;
let dropdownFocus  = -1;
let localTimeInterval = null;

// ─── 4. UI STATE ──────────────────────────────
function setUIState(state) {
  statePlaceholder.classList.add("hidden");
  stateLoading.classList.add("hidden");
  stateError.classList.add("hidden");
  content.classList.add("hidden");

  if (state === "placeholder") statePlaceholder.classList.remove("hidden");
  if (state === "loading")     stateLoading.classList.remove("hidden");
  if (state === "error")       stateError.classList.remove("hidden");
  if (state === "content")     content.classList.remove("hidden");
}

// ─── 5. DATA / HORA ───────────────────────────
function updateHeaderDate() {
  const now = new Date();
  headerDate.innerHTML =
    now.toLocaleDateString("ca-ES", { weekday:"long", day:"numeric", month:"long" }) +
    "<br/>" + now.toLocaleTimeString("ca-ES", { hour:"2-digit", minute:"2-digit" });
}
updateHeaderDate();
setInterval(updateHeaderDate, 60000);

function getLocalTime(timezone) {
  return new Date().toLocaleTimeString("ca-ES", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startLocalTimeTick(timezone) {
  clearInterval(localTimeInterval);
  destTime.textContent = getLocalTime(timezone);
  localTimeInterval = setInterval(() => {
    destTime.textContent = getLocalTime(timezone);
  }, 10000);
}

// ─── 6. WEATHER UTILS ─────────────────────────
function getCondition(code) {
  if (code === 0)      return { emoji:"☀️",  label:"Cel clar"               };
  if (code <= 2)       return { emoji:"⛅",  label:"Parcialment ennuvolat"  };
  if (code === 3)      return { emoji:"☁️",  label:"Ennuvolat"              };
  if (code <= 49)      return { emoji:"🌫️",  label:"Boira"                  };
  if (code <= 57)      return { emoji:"🌦️",  label:"Pluja lleugera"         };
  if (code <= 65)      return { emoji:"🌧️",  label:"Pluja moderada"         };
  if (code <= 77)      return { emoji:"🌨️",  label:"Nevada"                 };
  if (code <= 82)      return { emoji:"🌦️",  label:"Xàfecs"                 };
  if (code <= 99)      return { emoji:"⛈️",  label:"Tempesta"               };
  return { emoji:"🌡️", label:"Variable" };
}

function getRainStatus(prob) {
  if (prob <= 20) return "☀️ Sense probabilitat de pluja";
  if (prob <= 50) return "🌦️ Possible pluja";
  return "🌧️ Alta probabilitat de pluja";
}

// ─── 7. TIP GENERATOR ─────────────────────────
function generateTip(city, weather, converted, eurAmt) {
  const parts = [];
  if      (weather.temp <= 5)  parts.push(`🧥 Fa molt fred a ${city.name} (${weather.temp}°C) — porta roba d'abric.`);
  else if (weather.temp <= 15) parts.push(`🧣 La temperatura és fresca (${weather.temp}°C) — porta una jaqueta.`);
  else if (weather.temp <= 25) parts.push(`🌤️ El temps a ${city.name} és agradable (${weather.temp}°C) — perfecte per passejar!`);
  else                          parts.push(`🌞 Fa calor a ${city.name} (${weather.temp}°C) — recorda protegir-te del sol.`);

  if (weather.rain > 50)       parts.push(`☂️ Alta probabilitat de pluja (${weather.rain}%) — no oblidis el paraigua.`);
  else if (weather.rain > 20)  parts.push(`🌂 Possible pluja (${weather.rain}%) — és recomanable portar paraigua.`);

  if (converted !== null)
    parts.push(`💱 ${eurAmt} EUR equivalen a ${converted} ${city.currency}.`);

  tipText.textContent = parts.join("  ·  ");
}

// ─── 8. FETCH METEOROLOGIA ────────────────────
async function fetchWeather(lat, lon, timezone) {
  const url = `https://api.open-meteo.com/v1/forecast`
    + `?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,apparent_temperature,precipitation_probability,`
    + `windspeed_10m,relativehumidity_2m,weathercode`
    + `&timezone=${encodeURIComponent(timezone)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Meteorologia: ${res.status}`);
  const data = await res.json();
  const c = data.current;
  return {
    temp:     Math.round(c.temperature_2m),
    apparent: Math.round(c.apparent_temperature),
    rain:     c.precipitation_probability ?? 0,
    wind:     Math.round(c.windspeed_10m),
    humidity: c.relativehumidity_2m ?? 0,
    code:     c.weathercode,
  };
}

// ─── 9. FETCH CANVI DE MONEDA ─────────────────
async function fetchRate(currency) {
  if (currency === "EUR") return 1;

  const res = await fetch(`/api/rate?from=EUR&to=${currency}`);
  if (!res.ok) throw new Error(`Divises: ${res.status}`);

  const data = await res.json();
  return data.rates[currency];
}

// ─── 10. ACTUALITZAR UI ───────────────────────
function updateUI(city, weather, rate) {
  const cond = getCondition(weather.code);

  // Destination card
  destFlag.textContent    = city.flag;
  destCity.textContent    = city.name;
  destCountry.textContent = city.country;
  destTemp.textContent    = `${weather.temp}°C`;
  destCurrency.textContent = city.currency;
  startLocalTimeTick(city.timezone);

  // Weather card
  wEmoji.textContent    = cond.emoji;
  wCond.textContent     = cond.label;
  wTemp.textContent     = weather.temp;
  wWind.textContent     = weather.wind;
  wHumidity.textContent = `${weather.humidity}%`;
  wApparent.textContent = `${weather.apparent}°`;

  // Rain bar (animate after paint)
  setTimeout(() => {
    rainFill.style.width = `${weather.rain}%`;
  }, 100);
  rainPct.textContent  = `${weather.rain}%`;
  rainLabel.textContent = getRainStatus(weather.rain);

  // Currency
  currResult.classList.add("hidden");
  resCode.textContent = city.currency;
  currRate.textContent = rate !== null && rate !== 1
    ? `1 EUR = ${rate.toFixed(4)} ${city.currency}`
    : "";

  // Tip
  generateTip(city, weather, null, null);
}

// ─── 11. LOAD CITY ────────────────────────────
async function loadCity(key) {
  const city = CITIES[key];
  if (!city) return;
  currentCity = city;

  setUIState("loading");

  try {
    const [weather, rate] = await Promise.all([
      fetchWeather(city.lat, city.lon, city.timezone),
      fetchRate(city.currency),
    ]);
    lastWeather = weather;
    currentCity._rate = rate;

    updateUI(city, weather, rate);
    setUIState("content");
  } catch (err) {
    console.error(err);
    errorText.textContent = `Error carregant dades: ${err.message}`;
    setUIState("error");
  }
}

// ─── 12. CONVERSIÓ ────────────────────────────
function handleConvert() {
  if (!currentCity || !currentCity._rate) return;
  const amount = parseFloat(eurInput.value);
  if (isNaN(amount) || amount < 0) { eurInput.focus(); return; }

  const converted = (amount * currentCity._rate).toFixed(2);

  resEur.textContent   = amount.toLocaleString("ca-ES");
  resLocal.textContent = parseFloat(converted).toLocaleString("ca-ES");
  resCode.textContent  = currentCity.currency;
  currRate.textContent = `1 EUR = ${currentCity._rate.toFixed(4)} ${currentCity.currency}`;
  currResult.classList.remove("hidden");

  generateTip(currentCity, lastWeather, parseFloat(converted).toFixed(2), amount);
}

// ─── 13. AUTOCOMPLETE SEARCH ──────────────────
const allCities = Object.entries(CITIES); // [[key, {name,...}], ...]

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi");
  return text.replace(re, "<mark>$1</mark>");
}

function filterCities(query) {
  const q = query.trim().toLowerCase();
  if (!q) return allCities;
  return allCities.filter(([, c]) =>
    c.name.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q) ||
    c.currency.toLowerCase().includes(q)
  );
}

function renderDropdown(query) {
  const results = filterCities(query);
  cityDropdown.innerHTML = "";
  dropdownFocus = -1;

  if (results.length === 0) {
    cityDropdown.innerHTML = `<li class="search-dropdown__empty">No s'ha trobat cap destinació</li>`;
    cityDropdown.classList.remove("hidden");
    cityInput.setAttribute("aria-expanded","true");
    return;
  }

  results.forEach(([key, city], i) => {
    const li = document.createElement("li");
    li.className = "search-dropdown__item";
    li.setAttribute("role","option");
    li.setAttribute("data-key", key);
    li.innerHTML = `
      <span class="search-dropdown__flag">${city.flag}</span>
      <span class="search-dropdown__text">
        <span class="search-dropdown__name">${highlight(city.name, query)}</span>
        <span class="search-dropdown__country">${highlight(city.country, query)}</span>
      </span>
      <span class="search-dropdown__currency">${city.currency}</span>
    `;
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      selectCity(key, city.name);
    });
    cityDropdown.appendChild(li);
  });

  cityDropdown.classList.remove("hidden");
  cityInput.setAttribute("aria-expanded","true");
}

function closeDropdown() {
  cityDropdown.classList.add("hidden");
  cityInput.setAttribute("aria-expanded","false");
  dropdownFocus = -1;
}

function selectCity(key, name) {
  cityInput.value = name;
  clearBtn.classList.remove("hidden");
  closeDropdown();
  loadCity(key);
}

function moveFocus(dir) {
  const items = cityDropdown.querySelectorAll(".search-dropdown__item");
  if (!items.length) return;
  items[dropdownFocus]?.classList.remove("search-dropdown__item--focused");
  dropdownFocus = Math.max(0, Math.min(items.length - 1, dropdownFocus + dir));
  items[dropdownFocus].classList.add("search-dropdown__item--focused");
  items[dropdownFocus].scrollIntoView({ block:"nearest" });
}

cityInput.addEventListener("input", () => {
  const q = cityInput.value;
  clearBtn.classList.toggle("hidden", !q);
  renderDropdown(q);
});

cityInput.addEventListener("focus", () => {
  renderDropdown(cityInput.value);
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); moveFocus(1); return; }
  if (e.key === "ArrowUp")   { e.preventDefault(); moveFocus(-1); return; }
  if (e.key === "Enter") {
    const focused = cityDropdown.querySelector(".search-dropdown__item--focused");
    if (focused) {
      const key = focused.getAttribute("data-key");
      selectCity(key, CITIES[key].name);
    }
    return;
  }
  if (e.key === "Escape") { closeDropdown(); cityInput.blur(); }
});

document.addEventListener("click", (e) => {
  if (!searchWrap.contains(e.target)) closeDropdown();
});

clearBtn.addEventListener("click", () => {
  cityInput.value = "";
  clearBtn.classList.add("hidden");
  cityInput.focus();
  renderDropdown("");
});

// Quick chips
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const key = chip.getAttribute("data-city");
    cityInput.value = CITIES[key].name;
    clearBtn.classList.remove("hidden");
    loadCity(key);
  });
});

// Retry
retryBtn.addEventListener("click", () => {
  if (currentCity) {
    const key = Object.keys(CITIES).find(k => CITIES[k] === currentCity);
    if (key) loadCity(key);
  }
});

// Convert
convertBtn.addEventListener("click", handleConvert);
eurInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleConvert(); });

// ─── 14. CANVAS PARTICLES ─────────────────────
(function initParticles() {
  const canvas = document.getElementById("bgCanvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles;

  const COLORS = ["rgba(232,185,106,", "rgba(78,205,196,", "rgba(91,156,246,", "rgba(255,255,255,"];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25 - 0.08,
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function initParticlesArr() {
    particles = Array.from({ length: 120 }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ")";
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -5 || p.x < -5 || p.x > W + 5) {
        p.x = Math.random() * W;
        p.y = H + 5;
      }
    });
    requestAnimationFrame(draw);
  }

  resize();
  initParticlesArr();
  draw();
  window.addEventListener("resize", () => { resize(); initParticlesArr(); });
})();
