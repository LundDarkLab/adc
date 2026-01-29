export default {
  mapTilerKey: 'CMQ8bWOfjncCKWV3MfHg',
  osmMap:{
    tile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attrib: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    nominatim: "https://nominatim.openstreetmap.org/search?city=Milano&country=Italia&format=jsonv2&polygon_geojson=1&extratags=1&addressdetails=1",
    nominatimReverse: 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&extratags=1&'
  },
  googleMap: {
    streetTile: 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    gSatTile: 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    gHybridTile: 'http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    gTerrainTile: 'http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    gSubDomains: ['mt0','mt1','mt2','mt3']
  },
  mapExt: [[72,63],[51,-11]],
  defaultZoom: 2,
  maxZoom: 22,
  boundaryStyles: {
    0: {
      weight: 1,
      color: 'rgb(100, 100, 100)',
      opacity: 0.5,
      fillColor: 'rgb(100, 100, 100)',
      fillOpacity: 0.2
    },
    1: {
      weight: 1.5,
      color: 'rgb(51, 136, 255)',
      opacity: 0.6,
      fillColor: 'rgb(51, 136, 255)',
      fillOpacity: 0.1
    },
    2: {
      weight: 2,
      color: 'rgb(220, 53, 69)',
      opacity: 0.8,
      fillColor: 'rgb(220, 53, 69)',
      fillOpacity: 0.15
    },
    3: {
      weight: 2,
      color: 'rgb(255, 193, 7)',
      opacity: 0.9,
      fillColor: 'rgb(255, 193, 7)',
      fillOpacity: 0.2
    },
    4: {
      weight: 2.5,
      color: 'rgb(40, 167, 69)',
      opacity: 1,
      fillColor: 'rgb(40, 167, 69)',
      fillOpacity: 0.25
    }
  },
  countyStyle: {
    weight: 2,
    color: 'rgb(51,136,255)',
    opacity: 0.8,
    fillColor: 'rgb(51,136,255)',
    fillOpacity: 0.1
  },
  cityStyle: {
    weight: 2,
    color: 'rgb(220,53,69)',
    opacity: 1,
    fillColor: 'rgb(220,53,69)',
    fillOpacity: 0.2
  },
  storagePlaceIco: L.icon({
    iconUrl: 'img/ico/storagePlace.png',
    iconSize:     [30, 30],
    iconAnchor:   [15, 15],
    popupAnchor:  [0,-15]
  }),
  findplaceIco: L.icon({
    iconUrl: 'img/ico/findPlace.png',
    iconSize:     [40, 40],
    iconAnchor:   [15, 15],
    popupAnchor:  [0, -15]
  }),
  countyJson: { type: "FeatureCollection", features: [] },
  mapClick: false
};