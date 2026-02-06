const artifact = document.getElementsByName("artifact")[0].value;
const activeUser = document.getElementsByName("usr")[0].value;

getArtifact()

document.getElementsByName('editArtifact')[0].addEventListener('click', (el)=>{updateMeta(el)})

function getArtifact(){
  ajaxSettings.url=API+"artifact.php";
  ajaxSettings.data={trigger:'getArtifact', id:artifact};
  $.ajax(ajaxSettings)
  .done(function(data) {
    // console.log(data);
    const { artifact: art, crono, artifact_material_technique: materials, artifact_findplace: findplace, artifact_metadata: meta } = data;
    const { start, end, name, status_id, description, notes, category_class_id, category_specs_id, type, timeline, storage_place, inventory, conservation_state_id, object_condition_id, is_museum_copy } = art;

    document.getElementById('pageTitle').innerText = name
    
    populateArtifactDetails(art);
    handleCategory(category_class_id, category_specs_id);
    timelineEditPage({timeline, chrono:crono, years:{start, end }})
    populateMaterialTechnique(materials);
    populateMetadata(meta);
    populateFindplace(findplace);
  })
}

function populateArtifactDetails(art) {
  const {name, status_id, description, notes, type, timeline, start, end, storage_place, inventory, conservation_state_id, object_condition_id, is_museum_copy } = art;

  setInputValue('name', name);
  setInputValue('status', status_id);
  setInputValue('description', description);
  setInputValue('notes', notes);
  setInputValue('type', type);
  setInputValue('timeline', timeline);
  setInputValue('start', start);
  setInputValue('end', end);
  setInputValue('storage_place', storage_place);
  setInputValue('inventory', inventory);
  setInputValue('conservation_state', conservation_state_id);
  setInputValue('object_condition', object_condition_id);
  setCheckbox('is_museum_copy', is_museum_copy, 'yes', 'no');
} 

function populateMetadata(meta) {
  if (!meta) return;
  const { author, owner, license } = meta;
  setInputValue('author', author.id);
  setInputValue('owner', owner.id);
  setInputValue('license', license.id);
}

function populateFindplace(findplace) {
  if (!findplace) return;
  console.log(findplace);  
  const { bounds_0, bounds_1, bounds_2, bounds_3, bounds_4, bounds_5, gid0, gid1, gid2, gid3, gid4, gid5, latitude, longitude, notes, parish, toponym } = findplace;
  let boudaries = []
  // setInputValue('gid_0', bounds_0);
  // levelOptions(0,bounds_0);
  if(gid0) { 
    levelOptions(0,bounds_0, bounds_0); 
    boudaries = [0, bounds_0,'collection',true]
  }
  if(gid1) { 
    levelOptions(1,bounds_1, bounds_1); 
    boudaries = [1, bounds_1,'single',true]
  }
  if(gid2) { 
    levelOptions(2,bounds_2, bounds_2); 
    boudaries = [2, bounds_2,'single',true]
  }
  if(gid3) { 
    levelOptions(3,bounds_3, bounds_3);
    boudaries = [3, bounds_3,'single',true]
  }
  if(gid4) { 
    levelOptions(4,bounds_4, bounds_4);
    boudaries = [4, bounds_4,'single',true]
  }
  if(gid5) { 
    levelOptions(5,bounds_5, bounds_5);
    boudaries = [5, bounds_5,'single',true]
  }
  setInputValue('parish', parish);
  setInputValue('toponym', toponym);
  setInputValue('findplace_notes', notes);
  if (latitude && longitude) {
    setInputValue('latitude', latitude);
    setInputValue('longitude', longitude);
    const findplaceLatLng = [parseFloat(latitude), parseFloat(longitude)];
    marker = L.marker(findplaceLatLng).addTo(map);
    map.setView(findplaceLatLng, 15);
  }else{
    administrativeBoundaries(...boudaries)
  }
}

function handleCategory(classId, specsId) {
  const categoryClassElement = document.getElementById("category_class");
  const categorySpecsElement = document.getElementById("category_specs");
  if (categoryClassElement) {
    categoryClassElement.value = classId;
    Promise.resolve().then(() => {
      handleCategoryChange();
      if (specsId && categorySpecsElement) {
        categorySpecsElement.value = specsId;
      }
    });
  }
}

function populateMaterialTechnique(materials) {
  const matTechArray = document.getElementById("matTechArray");
  matTechArray.innerHTML = '';

  materials.forEach(v => {
      const { material_id: m, technique: t, material } = v;
      materialTechniqueArray.push({ m, t });

      const row = createElement('div', 'row wrapfield mb-3', matTechArray);
      const matDiv = createElement('div', 'material', row);
      const techDiv = createElement('div', 'technique', row);

      createInput('text', material, true, 'form-control', matDiv);

      const iptGrp = createElement('div', 'input-group', techDiv);
      const techInput = createInput('text', t, true, 'form-control', iptGrp);

      const deleteButton = createElement('button', 'btn btn-danger', iptGrp);
      deleteButton.type = 'button';
      deleteButton.name = 'delRow';
      deleteButton.title = 'delete row';
      deleteButton.setAttribute('data-bs-toggle', 'tooltip');
      deleteButton.innerHTML = '<span class="mdi mdi-trash-can"></span>';

      deleteButton.addEventListener('click', () => {
          const rows = document.querySelectorAll("#matTechArray .row");
          const idx = Array.prototype.indexOf.call(rows, row);
          materialTechniqueArray.splice(idx, 1);
          const tooltip = bootstrap.Tooltip.getInstance(deleteButton);
          if (tooltip) { tooltip.hide(); }
          row.remove();
      });

      new bootstrap.Tooltip(deleteButton);
  });
}

function updateMeta(btn){  
  checkMaterialArray()
  if (form[0].checkValidity()) {
    btn.preventDefault()
    dati.trigger = 'editArtifact';
    dati.artifact={}
    $("[data-table=artifact]").each(function(){
      let field = $(this).attr('id')
      let val = $(this).val()
      if(val){dati.artifact[field]=val}
    })
    dati.artifact.is_museum_copy = $("#is_museum_copy").is(":checked") ? 1 : 0;
    dati.artifact_material_technique = materialTechniqueArray;
    dati.artifact_findplace ={}
    $("[data-table=artifact_findplace]").each(function(){
      let field = $(this).attr('id')
      let val = $(this).val()
      if(val){dati.artifact_findplace[field]=val}
    })
    if ($("#city").val()) { dati.artifact_findplace.city = $("#city").data('cityid') }
    ajaxSettings.url=API+"artifact.php";
    ajaxSettings.data = dati
    $.ajax(ajaxSettings)
    .done(function(data) {
      if (data.res==0) {
        $("#toastDivError .errorOutput").text(data.output);
        $("#toastDivError").removeClass("d-none");
      }else {
        $(".toastTitle").text(data.output)
        gotoIndex.appendTo(toastToolBar);
        gotoDashBoard.appendTo(toastToolBar);
        backToItem.attr("href","artifact_view.php?item="+artifact).appendTo(toastToolBar);
        $("#toastDivSuccess").removeClass("d-none")
      }
      $("#toastDivContent").removeClass('d-none')
    });
  }

}