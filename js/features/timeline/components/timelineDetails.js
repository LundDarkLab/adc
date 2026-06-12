import { fetchTimelineDetails } from "../api/timelineApi.js";
import { bsAlert } from "../../../components/bsComponents.js";
import { timelineUpdate } from "./timelineEditor.js";

const timelineDetailsOutput = document.getElementById('dataWrap');
const userGuide = document.getElementById('userGuide');
const userId = document.getElementById('userId').value;
const userInstitution = document.getElementById('userInstitution').value;
const userRole = document.getElementById('userRole').value;

export async function timelineDetails(timelineId) {
  timelineDetailsOutput.innerHTML = '';
  try {
    const timelineDetails = await fetchTimelineDetails(timelineId);
    if (timelineDetails.error === 1) {
      throw new Error(timelineDetails.message);
    }
    
    const timelineMetadata = timelineDetails.data.timelineMetadata;
    const timelineData = timelineDetails.data.timeline;
    
    if (timelineDetails.error === 0 && timelineData.length > 0) {
      buildTimeMetadataTable(timelineMetadata);
      buildTimeTable(timelineData);
      const canEdit = Number(userRole) < 3 && (
        Number(userId) === timelineMetadata.user_id ||
        Number(userInstitution) === timelineMetadata.institution_id ||
        Number(userRole) === 1
      );
      if (canEdit) {
        buildEditButton(timelineId, timelineMetadata);
      }
    }else{
      timelineDetailsOutput.innerHTML = '<h3>Timeline details not found.</h3>';
    }
    
  } catch (error) {
    bsAlert('Error fetching timeline details:', error);
    timelineDetailsOutput.innerHTML = '<h3>Failed to load timeline details.</h3>';
  }
}

function buildEditButton(timelineId, metadata){
  const timelineMetadata = document.getElementById('timelineMetadata');
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-adc-blue';
  editBtn.innerHTML = '<i class="mdi mdi-pencil"></i> edit this timeline';
  editBtn.addEventListener('click', () => {
    timelineUpdate(timelineId, metadata.time_name, metadata.time_state);
  });
  timelineMetadata.appendChild(editBtn);
}

function buildTimeMetadataTable(data){
  const timelineMetadata = document.getElementById('timelineMetadata');
  timelineMetadata.innerHTML = '';
  const table = document.createElement('table');
  table.classList.add('table','table-sm','caption-top', 'table-light');

  const caption = table.createCaption();
  caption.textContent = 'Timeline Metadata';
  caption.className = 'fs-4 fw-bold bg-light';
  const thead = table.createTHead();
  const theadTr = thead.insertRow();
  ['name', 'state', 'author', 'Institution'].forEach(headerText => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = headerText;
    theadTr.appendChild(th);
  });

  const tbody = table.createTBody();
  tbody.id="timelineMetadataBody";
  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${data.time_name}</td>
    <td>${data.time_state}</td>
    <td>${data.author}</td>
    <td>${data.institution_name}</td>
  `;
  timelineMetadata.appendChild(table);
  timelineMetadata.classList.remove('d-none');
}

function buildTimeTable(data) {
  console.log('Building timeline data table with data:', data);
  if (userGuide) {
    bootstrap.Collapse.getOrCreateInstance(userGuide).hide();
  }
  const table = document.createElement('table');
  table.id = 'timelineDataTablePreview';
  table.classList.add('table', 'table-sm', 'table-striped');

  const thead = table.createTHead();
  thead.className = 'table-primary';
  const theadTr = thead.insertRow();
  ['macro', 'generic', 'specific', 'start', 'end'].forEach(headerText => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = headerText;
    theadTr.appendChild(th);
  });

  const tbody = table.createTBody();
  tbody.id = 'timelinePreviewBody';
  data.forEach(item => {
    const row = tbody.insertRow();
    row.dataset.timeline = item.timeline_id;
    row.dataset.macro = item.macro_id;
    row.dataset.generic = item.generic_id ?? '';
    row.dataset.specific = item.specific_id ?? '';
    row.dataset.start = item.start ?? '';
    row.dataset.end = item.end ?? '';
    row.insertCell().textContent = item.macro    ?? '';
    row.insertCell().textContent = item.generic  ?? '';
    row.insertCell().textContent = item.specific ?? '';
    row.insertCell().textContent = item.start    ?? '';
    row.insertCell().textContent = item.end      ?? '';
  });

  timelineDetailsOutput.appendChild(table);
}