function reverseGeoLocation(ll){
  if (marker) { map.removeLayer(marker)};
  marker = L.marker(ll).addTo(map);
  document.getElementById('latitude').value = ll.lat.toFixed(4);
  document.getElementById('longitude').value = ll.lng.toFixed(4);
  ajaxSettings.url = API + "geom.php";
  ajaxSettings.data = {trigger:'reverseGeoLocation', ll:[ll.lng,ll.lat]};
  $.ajax(ajaxSettings).done(function (data) {
    if(data.res == 0){
      let toast = new bootstrap.Toast(document.getElementById('errorToast'));
      toast.show();
      return false;
    }
    let gid = Object.entries(data.data)
      .filter(([key, value]) => key.includes("gid_") && value !== undefined && value !== null)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
      console.log(gid);
      
    Object.keys(gid).forEach(key => {
      const level = document.getElementById(`${key}_container`)
      const id = key.split('_')[1];
      setTimeout(()=>{levelOptions(id,gid[key],gid[key])},500);
    })

    let maxGid = getMaxGid(gid)
    administrativeBoundaries(parseInt(maxGid.split('_')[1]), gid[maxGid], 'marker');
    
  });
}

function getMaxGid(obj) {
  let maxNumber = -Infinity;
  let maxKey = null;
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let gid = key.split('_')[1];
      if (gid) {
        let number = parseInt(gid, 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
          maxKey = key;
        }
      }
    }
  }
  return maxKey;
}

function administrativeBoundaries(level, filter, type, clear){
  ajaxSettings.url = API + "geom.php";
  ajaxSettings.data = { trigger: 'administrativeBoundaries', level:level, filter:filter, type:type };
  $.ajax(ajaxSettings).done(function (data) {
    if(data.items.length > 0){
      if(!clear){boundaries.clearLayers();}
      data.items.forEach((item, i) => {
        let geojsonFeature = {
          "type": "Feature",
          "properties": {gid:item.gid, name:item.name},
          "geometry": JSON.parse(item.geom)
        };
        L.geoJson(geojsonFeature, {style:countyStyle}).addTo(boundaries);
      });
      if(type !== 'marker'){map.fitBounds(boundaries.getBounds());}
    }
  });
}

function mapInit(page){
  map = L.map('map').fitWorld().setZoom(2)
  osm = L.tileLayer(osmTile, { maxZoom: 20, attribution: osmAttrib}).addTo(map);
  gStreets = L.tileLayer(gStreetTile,{maxZoom: 20, subdomains:gSubDomains });
  gSat = L.tileLayer(gSatTile,{maxZoom: 20, subdomains:gSubDomains});
  gTerrain = L.tileLayer(gTerrainTile,{maxZoom: 20, subdomains:gSubDomains});
  baseLayers = {
    "OpenStreetMap": osm,
    "Google Terrain":gTerrain,
    "Google Satellite": gSat,
    "Google Street": gStreets
  };
  layerControl = L.control.layers(baseLayers, null,{collapsed:false}).addTo(map);
  boundaries = L.featureGroup().addTo(map);
    
  map.on({
    zoomend: handleAlert,
    click:function(e){
      if(page == 'dashboard'){return false;}
      mapClick = true;
      let zoom = map.getZoom()
      if (zoom<14) { return false;}
      let ll = map.mouseEventToLatLng(e.originalEvent);
      reverseGeoLocation(ll)
    },
    baselayerchange:function (eventLayer) {
      if (eventLayer.layer) {
        eventLayer.layer.on({
          loading: function () {$("#loadingDiv").show()},
          load: function () {$("#loadingDiv").fadeOut('fast')}
        });
      }
    }
  })

  osm.on({
    loading: function () {$("#loadingDiv").show()},
    load: function () {$("#loadingDiv").fadeOut('fast')}
  });

  function handleAlert(){
    let alertClass, alertText;
    let zoom = map.getZoom();
    if (zoom>=14) {
      alertClass = 'alert alert-success';
      alertText = 'Ok, you can click on map to create a marker';
      map.removeLayer(boundaries);
    }else {
      alertClass = 'alert alert-warning'
      alertText = 'To put a marker on map you have to zoom in';
      map.addLayer(boundaries);
    }
    $("#mapAlert").removeClass().addClass(alertClass).text(alertText)
  }

  let myToolbar = L.Control.extend({
    options: { position: 'topleft'},
    onAdd: function (map) {
      let container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      btnHome = $("<a/>",{href:'#', title:'max zoom', id:'maxZoomBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-home'}).appendTo(btnHome)
      btnFullscreen = $("<a/>",{href:'#', title:'toggle fullscreen mode', id:'toggleFullscreenBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-fullscreen'}).appendTo(btnFullscreen)

      btnHome.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        map.fitWorld().setZoom(2);
      });

      btnFullscreen.on('click', function(e){
        e.preventDefault()
        e.stopPropagation()
        toggleFullScreen('map')
      })
      
      return container;
    }
  })
  map.addControl(new myToolbar());
}

function artifactMap(){
  if (map !== undefined) { map.remove(); }
  map = L.map('map')
  osm = L.tileLayer(osmTile, { maxZoom: 18, attribution: osmAttrib}).addTo(map);
  gStreets = L.tileLayer(gStreetTile,{maxZoom: 18, subdomains:gSubDomains });
  gSat = L.tileLayer(gSatTile,{maxZoom: 18, subdomains:gSubDomains});
  gTerrain = L.tileLayer(gTerrainTile,{maxZoom: 18, subdomains:gSubDomains});
  baseLayers = {
    "OpenStreetMap": osm,
    "Google Terrain":gTerrain,
    "Google Satellite": gSat,
    "Google Street": gStreets
  };

  layerControl = L.control.layers(baseLayers, overlayMaps).addTo(map);
  boundaries = L.featureGroup().addTo(map);
  storagePlaceMarker = L.marker(markerArr['storage'],{icon:storagePlaceIco}).addTo(boundaries);
  layerControl.addOverlay(storagePlaceMarker, "storage place");
  if(markerArr['findplace']){
    findPlaceMarker = L.marker(markerArr['findplace'],{icon:findplaceIco}).addTo(boundaries);
    layerControl.addOverlay(findPlaceMarker, "findplace");
  }
  if(polyArr.length > 0){ administrativeBoundaries(polyArr[0], polyArr[1], 'single', 'true') }

  map.fitBounds(boundaries.getBounds());
  let myToolbar = L.Control.extend({
    options: { position: 'topleft'},
    onAdd: function (map) {
      let container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      btnHome = $("<a/>",{href:'#', title:'max zoom', id:'maxZoomBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-home'}).appendTo(btnHome)
      let btnFullscreen = $("<a/>",{href:'#', title:'toggle fullscreen mode', id:'toggleFullscreenBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-fullscreen'}).appendTo(btnFullscreen)
      btnHome.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        map.fitBounds(boundaries.getBounds());
      });
      btnFullscreen.on('click', function(e){
        e.preventDefault()
        e.stopPropagation()
        toggleFullScreen('map')
      })
      return container;
    }
  })
  map.addControl(new myToolbar());
}



function mapStat(countyData){
  map2 = L.map('mapChart').fitBounds(mapExt)
  L.maptilerLayer({apiKey: mapTilerKey, style: "dataviz-light"}).addTo(map2)
  countyGroup = L.featureGroup().addTo(map2);
  let countyJson = {"type":"FeatureCollection", "features": []}
  countyData.forEach(el => {
    countyJson.features.push({
      "type": "Feature",
      "properties": {area:'county',id:el.gid_1,name:el.name_1, tot:el.tot},
      "geometry": JSON.parse(el.geometry)
    })
  });
  
  county = L.geoJson(countyJson, {
    style: styleByGroup,
    onEachFeature: onEachFeature
  }).addTo(countyGroup);
  
  
  let myToolbar = L.Control.extend({
    options: { position: 'topleft'},
    onAdd: function (map) {
      let container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      btnHome = $("<a/>",{href:'#', title:'max zoom', id:'maxZoomBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-home'}).appendTo(btnHome)
      
      btnHome.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        if(window.location.pathname.includes('artifact_view')){
          map.fitBounds(countyGroup.getBounds())
        }else{
          map2.fitBounds(countyGroup.getBounds())
        }
      });
      return container;
    }
  })
  map2.addControl(new myToolbar());
  
  let legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map2) {
    let div = L.DomUtil.create('div', 'info legend border rounded')
    let grades = [0, 10, 20, 50, 100, 200, 500, 1000]
    let labels = [];
    for (var i = 0; i < grades.length; i++) {
      let row = $("<div/>").appendTo(div)
      let img = $("<img/>",{class:'arrowGroup arrow'+grades[i], src:'img/ico/play.png'}).appendTo(row)
      $("<i/>").css("background-color",getColorByGroup(grades[i] + 1)).appendTo(row)
      $("<small/>").text(grades[i] + (grades[i + 1] ? '-' + grades[i + 1] : '+')).appendTo(row)
    }
    return div;
  };
  legend.addTo(map2);
  $(".arrowGroup").css('visibility','hidden')
  map2.fitBounds(countyGroup.getBounds())
}

function getGroup(d) {
  return d > 1000 ? 1000 :
  d > 500  ? 500 :
  d > 200  ? 200 :
  d > 100  ? 100 :
  d > 50   ? 50 :
  d > 20   ? 20 :
  d > 10   ? 10 :
  0;
}

function getColorByGroup(d) {
  return d > 1000 ? '#188977' :
  d > 500  ? '#1D9A6C' :
  d > 200  ? '#39A96B' :
  d > 100  ? '#56B870' :
  d > 50   ? '#74C67A' :
  d > 20   ? '#99D492' :
  d > 10   ? '#BFE1B0' :
  '#DEEDCF';
}
function styleByGroup(feature) {
  let color = getColorByGroup(feature.properties.tot)
  return {
    fillColor: color
    ,fillOpacity: 0.5
    ,weight: 2
    ,opacity: 1
    ,color: color
  };
}

function highlightFeature(e) {
  var layer = e.target;
  layer.setStyle({fillOpacity: 0.9});
  layer.bringToFront();
  mapInfo(layer.feature.properties);
}
function resetHighlight(e) {
  county.resetStyle(e.target);
  mapInfo();
  $(".arrowGroup").css('visibility','hidden')
}
function zoomToFeature(e) {map.fitBounds(e.target.getBounds());}
function filterElement(e){
  console.log(e.target.feature.properties);
  document.getElementsByName('byCounty')[0].value = e.target.feature.properties.id
  map2.fitBounds(e.target.getBounds());
  resetPagination();
  getFilter();
};

function onEachFeature(feature, layer) {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    let touchTimeout;
    let isHighlighted = false;
    layer.on({
      touchstart: function(e) {
        e.originalEvent.preventDefault();
        
        // Simula hover dopo un breve delay
        touchTimeout = setTimeout(() => {
          if (!isHighlighted) {
            isHighlighted = true;
            highlightFeature(e);
          }
        }, 200);
      },
      
      touchend: function(e) {
        clearTimeout(touchTimeout);
        
        if (isHighlighted) {
          setTimeout(() => {
            resetHighlight(e);
            isHighlighted = false;
            
            // Esegui l'azione click
            if(window.location.pathname.includes('artifact_view')){
              zoomToFeature(e);
            } else {
              filterElement(e);
            }
          }, 300);
        }
      },
      
      touchcancel: function(e) {
        clearTimeout(touchTimeout);
        if (isHighlighted) {
          resetHighlight(e);
          isHighlighted = false;
        }
      }
    });
    
  } else {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: (e) => {
        if(window.location.pathname.includes('artifact_view')){
          zoomToFeature(e);
        } else {
          filterElement(e);
        }
      }
    });
  }
}

function mapInfo(props){
  if(props){
    let group = getGroup(props.tot)
    $(".arrow"+group).css("visibility",'visible')
  }
  $("#mapInfoTitle").text(props ? '' : 'Map info')
  $("#nameProp").text(props ? props.name : '')
  $("#totProp").text(props ? 'Number of artifacts: '+props.tot : '')
}

function layername(){
  var mapLayers = map._layers;
  var layerNames = [];
  for (var layerId in mapLayers) {
    var layer = mapLayers[layerId];
    if (layer.options && layer.options.name) {
      var layerName = layer.options.name;
      if (!layerNames.includes(layerName)) { layerNames.push(layerName); }
    }
  }
  console.log(layerNames);
}


//ok questa funziona
async function reverseGeocodeNominatim(lat,lon, detail) {
  const url = `${nominatimReverse}lat=${lat}&lon=${lon}&addressdetails=1`;

  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Errore nella richiesta a Nominatim");

      const data = await response.json();

      console.log("Risultati Nominatim:", data);

      let placeInfo = {
          country: data.address.country,
          region: data.address.state || data.address.region,
          province: data.address.county || data.address.district,
          city: data.address.city || data.address.town || data.address.village || data.address.municipality,
      };

      console.log("Località trovata:", placeInfo);
      return placeInfo;

  } catch (error) {
      console.error("Errore Nominatim:", error);
  }
}

// da rivedere, per ora non funziona
// async function fetchGeoJsonAndNames() {
//   const overpassUrl = 'https://overpass-api.de/api/interpreter';
//   const overpassQuery = `
// [out:json][maxsize:1073741824][timeout:9000];
// nwr["boundary"="administrative"]["admin_level"="2"]["name"="Italy"]; 
// (._;>;);
// out geom;
//   `;

//   try {
//     const response = await fetch(overpassUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       body: `data=${encodeURIComponent(overpassQuery)}`
//     });

//     if (!response.ok) {
//       throw new Error('Errore nella richiesta Overpass: ' + response.statusText);
//     }

//     const data = await response.json();

//     // Esempio di gestione dei dati
//     console.log('Dati ricevuti:', data);

//     // Ora puoi lavorare con i dati GeoJSON e i nomi dei luoghi ottenuti

//   } catch (error) {
//     console.error('Errore durante il fetch da Overpass:', error);
//   }
// }

// Chiamata alla funzione per eseguire la query
// fetchGeoJsonAndNames();