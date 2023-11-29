let storagePlaceMarker, findplaceMarker;
let markerArr={}
let polyArr={}

ajaxSettings.url=API+"artifact.php";
ajaxSettings.data={trigger:'getArtifact', id:artifactId};

$.ajax(ajaxSettings)
.done(function(data) {
  console.log(data);
  $("#loadingDiv").remove()
  let artifact = data.artifact;
  Object.keys(artifact).forEach(function(key) {
    if(!artifact[key]){artifact[key] = 'not defined'}
    if(key == 'status'){ artifact[key] = 'The item status is: '+artifact[key] }
    if(key == 'from'){ $("#start_period").text(artifact['from']['definition'])}
    if(key == 'to'){ $("#end_period").text(artifact['to']['definition'])}
    let statusClass = artifact['status_id'] == 1 ? 'alert-danger' : 'alert-success';
    $("#status").addClass(statusClass).text(artifact.status);
    artifact['is_museum_copy'] = artifact['is_museum_copy'] == 0 ? false : true;
    $("#"+key).text(artifact[key])
  })

  let material = data.artifact_material_technique;
  material.forEach((item) => {
    $("<li/>", {class:'list-group-item ps-0'}).text(item.material +" / "+(item.technique ? item.technique : 'not defined') ).appendTo('#material>ol')
  });

  let institution = data.storage_place;
  let gMapLink = 'http://maps.google.com/maps?q='+institution.name.replace(/ /g,"+");
  $("#institutionLogo>img").attr("src", "img/logo/"+institution.logo)
  $("#storage_name").text(institution.name)
  $("#gMapLink").attr("href",gMapLink)
  $("#storage_address").text(institution.address)
  $("#storage_link").attr("href",institution.link).text(institution.link)
  markerArr.storage = [parseFloat(institution.lat), parseFloat(institution.lon)]

  if (data.artifact_measure) {
    let measure = data.artifact_measure;
    measure.forEach((item, i) => {
      Object.keys(item).forEach(function(key) {
        if (key == 'notes') {$("#measures_"+key).text(item[key])}
        if(item[key]){$("#"+key).text(item[key])}
      })
    });
  }
  let metadata = data.artifact_metadata;
  $("#artifact_author>a").attr("href","person_view.php?person="+metadata.author.id).text(metadata.author.last_name+" "+metadata.author.first_name)
  $("#artifact_owner>a").attr("href","institution_view.php?institution="+metadata.owner.id).text(metadata.owner.name)
  $("#artifact_license>a").attr("href",metadata.license.link).text(metadata.license.license+" ("+metadata.license.acronym+")")

  if(data.model){
    let model = data.model.model_object;
    if((role && role < 5) || (activeUser && model.author_id === activeUser)){
      $("[name=saveModelParam]").on('click', function(){
        let dati = buildModelParamArray(model.id, 'updateModelParam')
        saveModelParam(dati)
      })
    }else{
      $("[name=saveModelParam]").remove()
    }
    if (model.object) {
      initModel(data.model)
      $("#model-auth").html("<a href='person_view.php?person="+model.author_id+"'>"+model.author+"</a>");
      $("#model-owner").html("<a href='institution_view.php?inst="+model.owner_id+"' class='disabled'>"+model.owner+"</a>");
      $("#model-license").html("<a href='"+model.license_link+"' target='_blank'>"+model.license+" ("+model.license_acronym+")</a>");
      $("#model-create_at").text(model.create_at)
      $("#model-updated_at").text(model.updated_at)
    
      Object.keys(paradata).forEach(function(key) {
        if(paradata[key]){$("#model-"+key).text(paradata[key])}
      })
    }else{
      $("#3dhop > canvas, .modelTools, .model-accordion").remove()
      let noModelDiv = $("<div/>",{id:'alertModel'}).appendTo("#3dhop");
      $("<div/>",{class:'alert alert-info fs-3'}).text('Model not yet available!!').appendTo(noModelDiv);
    }
  }else {
    $("#3dhop > canvas, .modelTools, .model-accordion").remove()
    let noModelDiv = $("<div/>",{id:'alertModel'}).appendTo("#3dhop");
    $("<div/>",{class:'alert alert-info fs-3'}).text('Model not yet available!!').appendTo(noModelDiv);
  }

  if (data.artifact_findplace) {
    let findplace = data.artifact_findplace;
    if(findplace.city_id){polyArr.county=findplace.county_id}
    if(findplace.city_id){polyArr.city = findplace.city_id}
    if(findplace.latitude){
      markerArr.findplace = [parseFloat(findplace.latitude), parseFloat(findplace.longitude)]
    }
    Object.keys(findplace).forEach(function(key) {
      if(findplace[key]){$("#findplace_"+key).text(findplace[key])}
    })
    
  }
  artifactMap(markerArr, polyArr)
  
});

function artifactMap(markerArr, polyArr){
  console.log(Object.keys(polyArr).length);
  map = L.map('map',{maxBounds:mapExt})
  map.setMinZoom(4);
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
  
  let markerGroup = L.featureGroup().addTo(map);
  let polyStyle;

  storagePlaceMarker = L.marker(markerArr['storage'],{icon:storagePlaceIco}).addTo(markerGroup);
  if(markerArr['findplace']){
    findPlaceMarker = L.marker(markerArr['findplace'],{icon:findplaceIco}).addTo(markerGroup);
  }

  if(Object.keys(polyArr).length>0){
    ajaxSettings.url=API+"get.php";
    if(polyArr.city){
      ajaxSettings.data = {
        trigger:'getSelectOptions', 
        list:'jsonCity', 
        orderBy:'1', 
        filter:'id = '+polyArr.city
      }
      polyStyle=cityStyle;
    }
    if(polyArr.county){
      ajaxSettings.data = {
        trigger:'getSelectOptions', 
        list:'jsonCounty', 
        orderBy:'1', 
        filter:'id = '+polyArr.county
      }
      polyStyle=countyStyle;
    }
    $.ajax(ajaxSettings)
    .done(function(data){
      let geojsonFeature = {
        "type": "Feature",
        "properties": {type:data[0].type, name:data[0].name},
        "geometry": JSON.parse(data[0].geometry)
      };
      let poly = L.geoJson(geojsonFeature, {style:polyStyle}).addTo(markerGroup);
      poly.bindPopup(data[0].type+': '+data[0].name)
      data[0].type == 'city' ? overlayMaps.city = poly : overlayMaps.county = poly
      map.fitBounds(markerGroup.getBounds())
      L.control.layers(baseLayers, overlayMaps).addTo(map);
    })
  }else{
    map.fitBounds(markerGroup.getBounds())
    L.control.layers(baseLayers, overlayMaps).addTo(map);
  }

  // map.setZoom(9);
  let myToolbar = L.Control.extend({
    options: { position: 'topleft'},
    onAdd: function (map) {
      let container = L.DomUtil.create('div', 'extentControl leaflet-bar leaflet-control leaflet-touch');
      let btnHome = $("<a/>",{href:'#', title:'max zoom', id:'maxZoomBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-home'}).appendTo(btnHome)
      let btnFullscreen = $("<a/>",{href:'#', title:'toggle fullscreen mode', id:'toggleFullscreenBtn'}).attr({"data-bs-toggle":"tooltip","data-bs-placement":"right"}).appendTo(container)
      $("<i/>",{class:'mdi mdi-fullscreen'}).appendTo(btnFullscreen)
      btnHome.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        map.fitBounds(markerGroup.getBounds());
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