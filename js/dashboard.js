(function () {
  'use strict';

  /* ---- Coordinates: 120 Varna Drive, North York ---- */
  var LAT = 43.722;
  var LON = -79.444;

  /* ---- WMO weather code descriptions ---- */
  var WMO_CODES = {
    0: { label: 'Clear sky', icon: '☀️' },
    1: { label: 'Mainly clear', icon: '🌤️' },
    2: { label: 'Partly cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Foggy', icon: '🌫️' },
    48: { label: 'Icy fog', icon: '🌫️' },
    51: { label: 'Light drizzle', icon: '🌦️' },
    53: { label: 'Drizzle', icon: '🌦️' },
    55: { label: 'Heavy drizzle', icon: '🌧️' },
    61: { label: 'Light rain', icon: '🌧️' },
    63: { label: 'Rain', icon: '🌧️' },
    65: { label: 'Heavy rain', icon: '🌧️' },
    66: { label: 'Freezing rain', icon: '🌨️' },
    67: { label: 'Heavy freezing rain', icon: '🌨️' },
    71: { label: 'Light snow', icon: '🌨️' },
    73: { label: 'Snow', icon: '❄️' },
    75: { label: 'Heavy snow', icon: '❄️' },
    77: { label: 'Snow grains', icon: '🌨️' },
    80: { label: 'Light showers', icon: '🌦️' },
    81: { label: 'Showers', icon: '🌧️' },
    82: { label: 'Heavy showers', icon: '🌧️' },
    85: { label: 'Snow showers', icon: '🌨️' },
    86: { label: 'Heavy snow showers', icon: '🌨️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
    96: { label: 'Thunderstorm + hail', icon: '⛈️' },
    99: { label: 'Thunderstorm + heavy hail', icon: '⛈️' }
  };

  function wmo(code) {
    return WMO_CODES[code] || { label: 'Unknown', icon: '🌡️' };
  }

  function windDir(deg) {
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function shortDate(isoStr) {
    var d = new Date(isoStr);
    return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatTime(isoStr) {
    var d = new Date(isoStr + ':00');
    return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function setStatus(id, msg, isError) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<span class="dash-status' + (isError ? ' dash-status-err' : '') + '">' + msg + '</span>';
  }

  /* ================================================================
     WEATHER  (Open-Meteo — free, no API key, CORS-enabled)
     ================================================================ */
  function loadWeather() {
    var url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + LAT + '&longitude=' + LON
      + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation,visibility,uv_index'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset,uv_index_max'
      + '&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm'
      + '&timezone=America%2FToronto&forecast_days=4';

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(renderWeather)
      .catch(function () {
        setStatus('weather-body', 'Unable to load weather. Check network connection.', true);
      });
  }

  function renderWeather(d) {
    var c = d.current;
    var daily = d.daily;
    var cond = wmo(c.weather_code);

    var bodyEl = document.getElementById('weather-body');
    if (!bodyEl) return;

    /* Current conditions */
    var html = '<div class="weather-now">'
      + '<div class="weather-big-icon">' + cond.icon + '</div>'
      + '<div class="weather-main">'
      + '<div class="weather-temp">' + Math.round(c.temperature_2m) + '°C</div>'
      + '<div class="weather-cond">' + cond.label + '</div>'
      + '<div class="weather-feels">Feels like ' + Math.round(c.apparent_temperature) + '°C</div>'
      + '</div>'
      + '<div class="weather-details">'
      + '<div class="weather-stat"><span>💧</span><span>' + c.relative_humidity_2m + '% humidity</span></div>'
      + '<div class="weather-stat"><span>💨</span><span>' + Math.round(c.wind_speed_10m) + ' km/h ' + windDir(c.wind_direction_10m) + '</span></div>'
      + '<div class="weather-stat"><span>🌧️</span><span>' + c.precipitation + ' mm precip</span></div>'
      + '<div class="weather-stat"><span>☀️</span><span>UV index ' + c.uv_index + '</span></div>'
      + '<div class="weather-stat"><span>🌅</span><span>Rise ' + formatTime(daily.sunrise[0]) + '</span></div>'
      + '<div class="weather-stat"><span>🌇</span><span>Set ' + formatTime(daily.sunset[0]) + '</span></div>'
      + '</div>'
      + '</div>';

    /* 4-day forecast strip */
    html += '<div class="weather-forecast">';
    for (var i = 0; i < 4; i++) {
      var fc = wmo(daily.weather_code[i]);
      html += '<div class="forecast-day' + (i === 0 ? ' forecast-today' : '') + '">'
        + '<div class="forecast-label">' + (i === 0 ? 'Today' : shortDate(daily.time[i])) + '</div>'
        + '<div class="forecast-icon">' + fc.icon + '</div>'
        + '<div class="forecast-hi">' + Math.round(daily.temperature_2m_max[i]) + '°</div>'
        + '<div class="forecast-lo">' + Math.round(daily.temperature_2m_min[i]) + '°</div>'
        + '<div class="forecast-rain">' + (daily.precipitation_sum[i] > 0 ? daily.precipitation_sum[i].toFixed(1) + ' mm' : '—') + '</div>'
        + '</div>';
    }
    html += '</div>';

    bodyEl.innerHTML = html;
  }

  /* ================================================================
     TTC SUBWAY STATUS  (TTC Alerts API)
     ================================================================ */
  function loadSubwayStatus() {
    /* TTC live alerts endpoint */
    var url = 'https://alerts.ttc.ca/api/alerts/live-alerts';

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(renderSubwayStatus)
      .catch(function () {
        /* Graceful fallback: show service-status links */
        var el = document.getElementById('subway-body');
        if (!el) return;
        el.innerHTML = '<div class="alert-fallback">'
          + '<p class="alert-ok-msg">Real-time status unavailable — check TTC directly:</p>'
          + '<a href="https://www.ttc.ca/service-advisories" target="_blank" rel="noopener" class="dash-ext-link">TTC Service Advisories ↗</a>'
          + '</div>';
      });
  }

  function renderSubwayStatus(data) {
    var el = document.getElementById('subway-body');
    if (!el) return;

    /* Filter for Line 1 (Yonge-University) and Line 4 alerts */
    var alerts = Array.isArray(data.alerts) ? data.alerts : (Array.isArray(data) ? data : []);
    var line1Alerts = alerts.filter(function (a) {
      var title = (a.title || a.header || '').toLowerCase();
      var desc  = (a.description || a.text || '').toLowerCase();
      return title.indexOf('line 1') !== -1 || title.indexOf('yonge') !== -1
          || title.indexOf('university') !== -1 || desc.indexOf('line 1') !== -1
          || title.indexOf('subway') !== -1;
    });

    if (line1Alerts.length === 0) {
      el.innerHTML = '<div class="service-ok">'
        + '<span class="service-dot dot-ok"></span>'
        + '<span>Line 1 — No current alerts</span>'
        + '</div>'
        + '<div class="service-ok" style="margin-top:0.5rem">'
        + '<span class="service-dot dot-ok"></span>'
        + '<span>Line 2 — No current alerts</span>'
        + '</div>'
        + '<p class="dash-sub">Yorkdale Station &amp; Wilson Station on Line 1</p>'
        + '<a href="https://www.ttc.ca/service-advisories" target="_blank" rel="noopener" class="dash-ext-link">View all advisories ↗</a>';
      return;
    }

    var html = '';
    line1Alerts.slice(0, 3).forEach(function (a) {
      var title = a.title || a.header || 'Service Alert';
      var desc  = a.description || a.text || '';
      html += '<div class="alert-item">'
        + '<span class="service-dot dot-alert"></span>'
        + '<div><strong>' + escHtml(title) + '</strong>'
        + (desc ? '<p class="alert-desc">' + escHtml(desc.slice(0, 140)) + (desc.length > 140 ? '…' : '') + '</p>' : '')
        + '</div></div>';
    });
    html += '<a href="https://www.ttc.ca/service-advisories" target="_blank" rel="noopener" class="dash-ext-link">All advisories ↗</a>';
    el.innerHTML = html;
  }

  /* ================================================================
     TTC BUS  (UMO / NextBus XML feed — TTC agency)
     Routes near 120 Varna Dr:
       29  = Dufferin
       128 = Stanley Greene
       161 = Rogers Rd / Yorkdale GO
       196 = York University Rocket (express from Yorkdale Stn)
     We dynamically find nearest stops via routeConfig then fetch predictions.
     ================================================================ */
  var TTC_ROUTES = [
    { tag: '29',  label: '29 Dufferin' },
    { tag: '128', label: '128 Stanley Greene' },
    { tag: '161', label: '161 Rogers Rd' },
    { tag: '196', label: '196 York U Rocket' }
  ];

  var UMO_BASE = 'https://retro.umoiq.com/service/publicXMLFeed?a=ttc';

  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2)
          + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180)
          * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function parseXml(text) {
    return new DOMParser().parseFromString(text, 'text/xml');
  }

  function loadTtcBus() {
    var el = document.getElementById('ttcbus-body');
    if (!el) return;
    el.innerHTML = '<span class="dash-status">Loading bus predictions…</span>';

    /* Fetch routeConfig for each route in parallel, find nearest stop, then get predictions */
    var configPromises = TTC_ROUTES.map(function (route) {
      return fetch(UMO_BASE + '&command=routeConfig&r=' + route.tag + '&verbose')
        .then(function (r) { return r.text(); })
        .then(function (text) {
          var xml = parseXml(text);
          var stops = xml.querySelectorAll('stop[lat]');
          var best = null;
          var bestDist = Infinity;
          stops.forEach(function (s) {
            var dist = haversine(LAT, LON,
              parseFloat(s.getAttribute('lat')),
              parseFloat(s.getAttribute('lon')));
            if (dist < bestDist) {
              bestDist = dist;
              best = s;
            }
          });
          return best ? { route: route, stopTag: best.getAttribute('tag'), stopTitle: best.getAttribute('title'), dist: Math.round(bestDist) } : null;
        })
        .catch(function () { return null; });
    });

    Promise.all(configPromises).then(function (results) {
      var valid = results.filter(Boolean);
      if (valid.length === 0) {
        showTtcFallback(el);
        return;
      }

      /* Build multi-stop prediction query */
      var stopsParam = valid.map(function (v) {
        return '&stops=' + v.route.tag + '|' + v.stopTag;
      }).join('');

      return fetch(UMO_BASE + '&command=predictionsForMultiStops' + stopsParam)
        .then(function (r) { return r.text(); })
        .then(function (text) {
          renderTtcBus(el, parseXml(text), valid);
        });
    }).catch(function () {
      showTtcFallback(el);
    });
  }

  function renderTtcBus(el, xml, routeInfo) {
    var predGroups = xml.querySelectorAll('predictions');
    if (!predGroups || predGroups.length === 0) {
      showTtcFallback(el);
      return;
    }

    var html = '';
    predGroups.forEach(function (pg) {
      var routeTag = pg.getAttribute('routeTag') || '';
      var stopTitle = pg.getAttribute('stopTitle') || '';
      var routeTitle = pg.getAttribute('routeTitle') || routeTag;
      var dirEls = pg.querySelectorAll('direction');
      var info = routeInfo.find(function (r) { return r.route.tag === routeTag; });
      var distNote = info ? info.dist + ' m away' : '';

      html += '<div class="bus-route-block">'
        + '<div class="bus-route-header">'
        + '<span class="bus-badge">' + escHtml(routeTag) + '</span>'
        + '<span class="bus-route-name">' + escHtml(routeTitle) + '</span>'
        + (distNote ? '<span class="bus-dist">' + distNote + '</span>' : '')
        + '</div>'
        + '<div class="bus-stop-name">' + escHtml(stopTitle) + '</div>';

      if (dirEls.length === 0) {
        html += '<div class="bus-no-pred">No predictions available</div>';
      } else {
        dirEls.forEach(function (dir) {
          var dirTitle = dir.getAttribute('title') || '';
          var preds = dir.querySelectorAll('prediction');
          var times = [];
          preds.forEach(function (p, i) {
            if (i < 3) times.push(p.getAttribute('minutes') + ' min');
          });
          if (times.length === 0) times.push('No service');
          html += '<div class="bus-direction">'
            + '<span class="bus-dir-label">' + escHtml(dirTitle) + '</span>'
            + '<span class="bus-times">' + times.join(' · ') + '</span>'
            + '</div>';
        });
      }

      html += '</div>';
    });

    if (!html) { showTtcFallback(el); return; }
    html += '<a href="https://www.ttc.ca/trip-planner" target="_blank" rel="noopener" class="dash-ext-link" style="margin-top:0.75rem;display:inline-block">TTC Trip Planner ↗</a>';
    el.innerHTML = html;
  }

  function showTtcFallback(el) {
    el.innerHTML = '<p class="alert-ok-msg">Live predictions unavailable. Track buses at:</p>'
      + '<div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem">'
      + '<a href="https://www.ttc.ca/route-schedules-and-maps/routes/029" target="_blank" rel="noopener" class="dash-ext-link">29 Dufferin Schedule ↗</a>'
      + '<a href="https://www.ttc.ca/route-schedules-and-maps/routes/128" target="_blank" rel="noopener" class="dash-ext-link">128 Stanley Greene ↗</a>'
      + '<a href="https://www.ttc.ca/route-schedules-and-maps/routes/161" target="_blank" rel="noopener" class="dash-ext-link">161 Rogers Rd / Yorkdale ↗</a>'
      + '<a href="https://www.ttc.ca/route-schedules-and-maps/routes/196" target="_blank" rel="noopener" class="dash-ext-link">196 York U Rocket ↗</a>'
      + '</div>';
  }

  /* ================================================================
     GO TRANSIT  (Yorkdale GO Bus Terminal)
     Routes stopping at Yorkdale: 40/40A-G/40T (Barrie corridor),
     plus York Region Transit connections.
     Real-time via Metrolinx departure board.
     ================================================================ */
  var GO_ROUTES = [
    { num: '40',  dest: 'Barrie GO Station', freq: 'Peak: every 30 min', type: 'bus' },
    { num: '40A', dest: 'Barrie (express)', freq: 'Peak service', type: 'bus' },
    { num: '40C', dest: 'Cookstown / Barrie', freq: 'Select trips', type: 'bus' },
    { num: '68',  dest: 'Bradford / Barrie', freq: 'Peak service', type: 'bus' },
    { num: '64',  dest: 'Newmarket GO', freq: 'Peak service', type: 'bus' }
  ];

  function loadGoTransit() {
    var el = document.getElementById('go-body');
    if (!el) return;

    var html = '<div class="go-header-note">'
      + '<span class="go-terminal-badge">Yorkdale GO Bus Terminal</span>'
      + '<span class="go-walk-note">~8 min walk from 120 Varna Dr</span>'
      + '</div>'
      + '<div class="go-routes">';

    GO_ROUTES.forEach(function (r) {
      html += '<div class="go-route-row">'
        + '<span class="go-route-num">' + escHtml(r.num) + '</span>'
        + '<div class="go-route-info">'
        + '<span class="go-dest">' + escHtml(r.dest) + '</span>'
        + '<span class="go-freq">' + escHtml(r.freq) + '</span>'
        + '</div>'
        + '</div>';
    });

    html += '</div>'
      + '<div class="go-links">'
      + '<a href="https://www.gotransit.com/en/trip-planning/plan-your-trip" target="_blank" rel="noopener" class="dash-ext-link">GO Trip Planner ↗</a>'
      + '<a href="https://www.gotransit.com/en/service-updates" target="_blank" rel="noopener" class="dash-ext-link">GO Service Updates ↗</a>'
      + '</div>';

    el.innerHTML = html;
  }

  /* ================================================================
     LAST UPDATED TIMESTAMP
     ================================================================ */
  function updateTimestamp() {
    var el = document.getElementById('dash-updated');
    if (!el) return;
    el.textContent = 'Last updated: '
      + new Date().toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  }

  /* ================================================================
     REFRESH
     ================================================================ */
  function refreshAll() {
    setStatus('weather-body', 'Loading weather…');
    setStatus('subway-body', 'Loading subway status…');
    setStatus('ttcbus-body', 'Loading bus predictions…');
    loadWeather();
    loadSubwayStatus();
    loadTtcBus();
    loadGoTransit();
    updateTimestamp();
  }

  /* ================================================================
     INIT
     ================================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    var refreshBtn = document.getElementById('dash-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        refreshBtn.classList.add('spinning');
        refreshAll();
        setTimeout(function () { refreshBtn.classList.remove('spinning'); }, 1200);
      });
    }

    refreshAll();

    /* Auto-refresh every 60 seconds */
    setInterval(function () {
      loadWeather();
      loadSubwayStatus();
      loadTtcBus();
      updateTimestamp();
    }, 60000);
  });

  /* ---- XSS-safe escape ---- */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
