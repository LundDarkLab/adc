function isValidValue(value) {
  if (value === null || value === undefined) return false;
  const strValue = value.toString().toLowerCase().trim();
  return strValue !== '' && strValue !== 'not defined';
}

const fieldMap = {};

function addField(key, value, transform = v => v) {
  if (isValidValue(value)) {
    fieldMap[key] = transform(value);
  }
}

function setArtifactField(artifact) {
  addField('name', artifact.name);
  addField('category_class', artifact.category_class);
  addField('category_specs', artifact.category_specs);
  addField('type', artifact.type);
  addField('description', artifact.description);
  addField('notes', artifact.notes);
  addField('start', artifact.start, parseInt);
  addField('end', artifact.end, parseInt);
  addField('inventory', artifact.inventory);
  addField('object_condition', artifact.object_condition);
  addField('conservation_state', artifact.conservation_state);
  addField('is_museum_copy', artifact.is_museum_copy, v => v == 0 ? 'false' : 'true');
  addField('created_at', artifact.created_at, v => v.split(' ')[0]);
  addField('last_update', artifact.last_update, v => v.split(' ')[0]);
}

function setMaterialTechnique(materialTech) {
  const fragment = document.createDocumentFragment();
  materialTech.forEach(({ material, technique }) => {
    const li = document.createElement('li');
    li.className = 'list-group-item ps-0 pt-0';
    li.textContent = technique ? `${material} / ${technique}` : material;
    fragment.appendChild(li);
  });
  document.getElementById('materialTechList')?.appendChild(fragment);
}

function setChronology(crono) {
  addField('fromPeriodMacro', crono.start?.macro);
  addField('fromPeriodGeneric', crono.start?.generic);
  addField('fromPeriodSpecific', crono.start?.specific);
  addField('toPeriodMacro', crono.end?.macro);
  addField('toPeriodGeneric', crono.end?.generic);
  addField('toPeriodSpecific', crono.end?.specific);
  addField('timeline_serie', crono.timeline, v => `Reference timeline: ${v}`);
}

function setStoragePlace(storagePlace) {
    if (storagePlace?.id) {
    document.getElementById('btInstitutionFilter')?.setAttribute('data-institution-id', storagePlace.id);
  }

  if (storagePlace?.name) {
    addField('storage_name', storagePlace.name);
    const gMapLink = `http://maps.google.com/maps?q=${storagePlace.name.replaceAll(' ', "+")}`;
    const gMap = document.getElementById('gMapLink');
    if (gMap) gMap.href = gMapLink;
  }

  if (storagePlace?.city && storagePlace?.address) {
    fieldMap.storage_address = `${storagePlace.city}, ${storagePlace.address}`;
  }

  if (storagePlace?.url) {
    addField('storage_link', storagePlace?.url);
  }else {
    const institutionLink = document.getElementById('institutionLink');
    if (institutionLink) institutionLink.remove();
  }
  
  if (storagePlace?.logo) {
    const img = document.getElementById('institutionImg');
    if (img) img.src = `img/logo/${storagePlace.logo}`;
  }
}

function setFindPlace(findplace) {
  addField('fpparish', findplace?.parish);
  addField('fptoponym', findplace?.toponym);
  addField('fpnotes', findplace?.notes);

  for (let i = 0; i <= 5; i++) {
    const el = document.getElementById(`fpgid${i}`);
    if (el && findplace?.[`gid${i}`] !== undefined) {
      el.textContent = findplace[`gid${i}`];
    }
  }

  const fpCoordinates = document.getElementById('fpcoordinates');
  if (fpCoordinates) {
    fpCoordinates.textContent = (isValidValue(findplace?.latitude) && isValidValue(findplace?.longitude))
      ? `${parseFloat(findplace.latitude).toFixed(4)} / ${parseFloat(findplace.longitude).toFixed(4)}`
      : 'not defined';
  }
}

function setMetadata(metadata) {
  if (metadata?.author?.first_name && metadata?.author?.last_name) {
    fieldMap.artifact_author = `${metadata.author.first_name} ${metadata.author.last_name}`;
  }
  addField('artifact_owner', metadata?.owner?.name);
  if (metadata?.license) {
    const link = document.getElementById('artifactLicenseLink');
    if (link) {
      link.href = metadata.license.link;
      link.textContent = `${metadata.license.license} (${metadata.license.acronym})`;
    }
  }
}

export function artifactViewAccordion(data){
  
  const { 
    artifact, 
    artifact_findplace: findplace,
    artifact_material_technique: materialTech,
    crono, 
    storage_place: storagePlace, 
    artifact_metadata: metadata,
  } = data;
  
  console.log("artifactViewAccordion",artifact);
  // Artifact fields
  setArtifactField(artifact);

  // Material & Technique
  if (materialTech?.length > 0) { setMaterialTechnique(materialTech); }
  // Chronology
  if (crono) { setChronology(crono); }
  // Storage Place
  if (storagePlace) { setStoragePlace(storagePlace); }
  // Findplace
  if (findplace) { setFindPlace(findplace); }
  // Metadata
  if (metadata) { setMetadata(metadata); } else { console.log('no metadata provided');}
  

  // Update DOM
  Object.entries(fieldMap).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if (el) { el.textContent = value ?? 'Not defined'; }
  });
  return Promise.resolve();
}