import { ENDPOINT } from "../helpers/utils.js";
import { fetchApi } from "../helpers/helper.js";

const wrap = document.getElementById('issuesBody');
export async function artifactIssues() {
  const handlers={
    chronoNotInRange,
    chronoNullValue,
    noDescription,
    missingModel
  }
  let issues = 0;
  const body = {
    class: 'Artifact',
    action: 'artifactIssues'
  }
  const result = await fetchApi({ url: ENDPOINT(), body });
  if(result && result.error === 0){
    Object.keys(result.data).forEach((key)=>{
      issues = issues + result.data[key].length;
      if(result.data[key].length > 0){
        if (typeof handlers[key] === 'function') {
          handlers[key](result.data[key]);
        }
      }
    });
  }
  issuesAlert(issues);
}

function issuesAlert(issues){
  const issuesWrap = document.getElementById('issuesSection');
  const issuesTitle = document.getElementById('issuesTitle');
  if(issues > 0){
    issuesWrap.classList.add('alert-danger');
    issuesTitle.textContent = 'The following issues were detected!';
  }else{
    issuesWrap.classList.add('alert-success', 'text-center');
    issuesTitle.textContent = 'No issues detected!';
  }
}

function chronoNotInRange(items){
  const div = createDiv('chronoNotInRange', 'Chronology not in timeline', items.length);
}
function chronoNullValue(items){
  const div = createDiv('chronoNullValue', 'No chronology value', items.length);
}
function noDescription(items){
  const div = createDiv('noDescription', 'No artifact description', items.length);
}
function missingModel(items){
  const div = createDiv('missingModel', 'Missing 3d file', items.length);
  const tableBody = div.querySelector('tbody');
  items.forEach(item => {
    const row = document.createElement('tr');
    const cell1 = document.createElement('td');
    const cell2 = document.createElement('td');
    Object.keys(item).forEach(key => {
      cell1.innerHTML = `artifact: ${item['name']}<br>expected file: ${item['object']}`;
      cell2.innerHTML = `<a href="artifact_view.php?item=${item['artifact']}" class="text-dark"><span class="mdi mdi-arrow-right-bold"></span></a>`;
    });
    row.append(cell1, cell2);
    tableBody.appendChild(row);
  });
  const footer = div.querySelector('.issuesFooter');
  footer.innerHTML = `<span class='mdi mdi-lightbulb-on text-warning'></span> <span class='text-secondary'>Check in the model folder on the file system if the file name is the same as in the database</span>`;
}

function createDiv(id, title, count){
  const div = document.createElement('div');
  div.id = id;
  div.className = 'dashboardSection issuesElement bg-white';
  const titleElement = document.createElement('h6');
  const titleText = document.createElement('span');
  titleText.textContent = title;
  const badge = document.createElement('span');
  badge.className = 'badge text-bg-dark float-end';
  badge.textContent = count;
  titleElement.append(titleText, badge);
  div.appendChild(titleElement);

  const table = document.createElement('table');
  table.className = 'table table-sm';
  const thead = document.createElement('thead');
  thead.className = 'table-light';
  const headerRow = document.createElement('tr');
  const th1 = document.createElement('th');
  const th2 = document.createElement('th');
  th1.textContent = 'name';
  th2.textContent = '#';
  headerRow.append(th1, th2);
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  const tfooter = document.createElement('div');
  tfooter.className = 'issuesFooter';
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'table-wrapper';
  tableWrapper.appendChild(table);
  div.appendChild(tableWrapper);
  div.appendChild(tfooter);
  wrap.appendChild(div);
  return div;
}