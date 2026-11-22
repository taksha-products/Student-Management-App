/**
 * Leaflet + OpenStreetMap HTML — matches School_Management web
 * (`frontend/components/gps/ParentBusMap.tsx` + BusMarker).
 *
 * All dynamic values are injected with JSON.stringify (no raw string paste into JS).
 */

import { BUS_TOP_IMAGE_DATA_URI } from "./busTopImageData";

export type LeafletMapPayload = {
  lat: number;
  lng: number;
  bearing: number;
  statusColor: string;
  stale: boolean;
  label: string;
  trail: Array<{ latitude: number; longitude: number }>;
  follow: boolean;
  /** Sheet overlay height (px) — bus is centred in the visible map above it. */
  bottomInset: number;
};

export const buildLeafletMapHtml = (initial: LeafletMapPayload): string => {
  const boot = {
    lat: initial.lat,
    lng: initial.lng,
    bearing: initial.bearing || 0,
    statusColor: initial.statusColor,
    stale: initial.stale,
    label: initial.label,
    trail: initial.trail.map((point) => [point.latitude, point.longitude]),
    follow: initial.follow,
    bottomInset: Math.max(0, Math.round(initial.bottomInset || 0)),
    busSrc: BUS_TOP_IMAGE_DATA_URI
  };
  const bootJson = JSON.stringify(boot);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #e5e7eb; }
    .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,.15) !important; }
    .leaflet-control-zoom a { width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 18px !important; }
    .bus-marker { background: transparent !important; border: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const BOOT = ${bootJson};
    const TRAIL_LIVE = '#2563eb';
    const TRAIL_STALE = '#9ca3af';
    const BUS_SRC = BOOT.busSrc;
    const BUS_ASPECT = 250 / 96;
    const TURN_MS = 900;
    let follow = !!BOOT.follow;
    let bottomInset = BOOT.bottomInset || 0;
    let displayedBearing = Math.round((BOOT.bearing || 0) / 5) * 5;

    // attributionControl off: OSM links in a React Native WebView navigate the document.
    let map = L.map('map', { zoomControl: false, attributionControl: false }).setView(
      [BOOT.lat, BOOT.lng], 15
    );
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    function busWidthForZoom(zoom) {
      if (zoom <= 11) return 13;
      if (zoom === 12) return 15;
      if (zoom === 13) return 18;
      if (zoom === 14) return 21;
      if (zoom === 15) return 24;
      return 30;
    }

    function nearestAngle(current, target) {
      return current + ((((target - current) % 360) + 540) % 360) - 180;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function createBusDivIcon(tagText, color, bearing, offline) {
      const busWidth = busWidthForZoom(map.getZoom());
      const busHeight = Math.round(busWidth * BUS_ASPECT);
      const boxWidth = Math.max(busHeight + 16, 120);
      const centerX = boxWidth / 2;
      const centerY = Math.round(busHeight / 2) + 8;
      const tagTop = centerY + Math.round(busHeight / 2) + 4;
      const boxHeight = tagTop + 24;
      const glow = 'drop-shadow(0 0 1.5px ' + color + ') drop-shadow(0 0 3px ' + color + ')';
      const imageFilter = offline ? ('grayscale(1) ' + glow) : glow;
      const label = escapeHtml(tagText);
      const safeColor = String(color).replace(/[^#a-zA-Z0-9(),.%\\s-]/g, '');
      const html =
        '<div style="position:relative;width:' + boxWidth + 'px;height:' + boxHeight + 'px;font-family:system-ui,sans-serif;">' +
          '<div class="bus-marker__rot" data-angle="' + bearing + '" style="position:absolute;left:' + (centerX - busWidth / 2) + 'px;top:' + (centerY - busHeight / 2) + 'px;width:' + busWidth + 'px;height:' + busHeight + 'px;transform:rotate(' + bearing + 'deg);transform-origin:center;transition:transform ' + TURN_MS + 'ms linear;opacity:' + (offline ? 0.85 : 1) + ';">' +
            '<img src="' + BUS_SRC + '" alt="" width="' + busWidth + '" height="' + busHeight + '" draggable="false" style="display:block;width:100%;height:100%;filter:' + imageFilter + ';" />' +
          '</div>' +
          '<div style="position:absolute;left:0;right:0;top:' + tagTop + 'px;display:flex;justify-content:center;">' +
            '<span style="background:#fff;color:#0f172a;border:2px solid ' + safeColor + ';border-radius:7px;padding:1px 7px;font-size:12px;font-weight:800;line-height:17px;white-space:nowrap;letter-spacing:.2px;box-shadow:0 1px 4px rgba(0,0,0,.35);">' + label + '</span>' +
          '</div>' +
        '</div>';
      return L.divIcon({
        className: 'bus-marker',
        html: html,
        iconSize: [boxWidth, boxHeight],
        iconAnchor: [centerX, centerY]
      });
    }

    let trailCasing = L.polyline(BOOT.trail, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    let trailLine = L.polyline(BOOT.trail, {
      color: BOOT.stale ? TRAIL_STALE : TRAIL_LIVE,
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    let marker = L.marker([BOOT.lat, BOOT.lng], {
      icon: createBusDivIcon(BOOT.label, BOOT.statusColor, displayedBearing, !!BOOT.stale),
      zIndexOffset: 600
    }).addTo(map);
    marker._eduColor = BOOT.statusColor;
    marker._eduLabel = BOOT.label;
    marker._eduOffline = !!BOOT.stale;

    function centreOn(lat, lng, animate) {
      var zoom = map.getZoom();
      var target = map.project([lat, lng], zoom).add([0, bottomInset / 2]);
      var centre = map.unproject(target, zoom);
      if (animate) {
        map.setView(centre, zoom, { animate: true, duration: 0.6 });
      } else {
        map.setView(centre, zoom, { animate: false });
      }
    }

    map.on('dragstart', function () {
      follow = false;
      post({ type: 'user-move' });
    });

    map.on('zoomend', function () {
      var ll = marker.getLatLng();
      var el = marker.getElement();
      var rot = el && el.querySelector('.bus-marker__rot');
      var angle = rot ? Number(rot.dataset.angle || displayedBearing) : displayedBearing;
      var color = marker._eduColor || BOOT.statusColor;
      var label = marker._eduLabel || BOOT.label;
      var offline = !!marker._eduOffline;
      marker.setIcon(createBusDivIcon(label, color, angle, offline));
      if (follow) centreOn(ll.lat, ll.lng, false);
    });

    function post(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function applyUpdate(data) {
      if (!data) return;
      if (typeof data.follow === 'boolean') follow = data.follow;
      if (typeof data.bottomInset === 'number') bottomInset = data.bottomInset;
      const lat = data.lat;
      const lng = data.lng;
      const color = data.statusColor || '#2563eb';
      const label = data.label || 'Bus';
      const offline = !!data.stale;
      const rounded = Math.round((data.bearing || 0) / 5) * 5;
      marker._eduColor = color;
      marker._eduLabel = label;
      marker._eduOffline = offline;

      if (typeof lat === 'number' && typeof lng === 'number') {
        marker.setLatLng([lat, lng]);
        marker.setIcon(createBusDivIcon(label, color, displayedBearing, offline));
        var el = marker.getElement();
        var rot = el && el.querySelector('.bus-marker__rot');
        if (rot) {
          var next = nearestAngle(Number(rot.dataset.angle || displayedBearing), rounded);
          displayedBearing = next;
          rot.dataset.angle = String(next);
          rot.style.transform = 'rotate(' + next + 'deg)';
        } else {
          displayedBearing = rounded;
        }
        if (follow) {
          centreOn(lat, lng, true);
        }
      }
      if (Array.isArray(data.trail)) {
        var latlngs = data.trail.map(function (p) { return [p.latitude, p.longitude]; });
        trailCasing.setLatLngs(latlngs);
        trailLine.setLatLngs(latlngs);
        trailLine.setStyle({ color: data.stale ? TRAIL_STALE : TRAIL_LIVE });
      }
    }

    function handleMessage(event) {
      try {
        const raw = typeof event.data === 'string' ? event.data : (event.data && event.data.toString());
        applyUpdate(JSON.parse(raw));
      } catch (e) {}
    }

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);
    if (follow) centreOn(BOOT.lat, BOOT.lng, false);
    post({ type: 'ready' });
  </script>
</body>
</html>`;
};

export const leafletUpdateScript = (payload: LeafletMapPayload): string => {
  // JSON.stringify is safe inside a script expression; escape only for template embedding.
  const json = JSON.stringify(payload).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  return `(function(){try{applyUpdate(${json});}catch(e){} true;})();`;
};
