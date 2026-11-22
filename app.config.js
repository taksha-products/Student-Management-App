/**
 * Dynamic Expo config.
 * Bus map matches School_Management web: Leaflet + OpenStreetMap (no Google Maps).
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    mapProvider: "openstreetmap"
  }
});
