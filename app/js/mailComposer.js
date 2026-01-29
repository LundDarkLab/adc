const user = document.getElementById("created_by").value;
const mailId = document.getElementById("mailId");
const object = document.getElementById('object');
const objectError = document.getElementById('objectError');
const editor = document.getElementById('editor');
const editorError = document.getElementById('editorError');
const recipientError = document.getElementById('recipientError');
const recipientList = document.getElementById('sendToList');
const emailTemplate = document.getElementById('mailTemplate');
const filterElements = document.querySelectorAll('.filter');
const selectAllBtn = document.getElementById('selectAll');
const unselectAllBtn = document.getElementById('unselectAll');
const clearFilterBtn = document.getElementById('clearFilter');
const clearEditorBtn = document.getElementById("clearEditor");
const filters = {}
const saveAsTemplate = document.getElementById('saveAsTemplate');
const sendEmailBtn = document.getElementById('sendEmail');
const quill = new Quill(editor, {
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['image', 'code-block'],
      ['clean']  
    ],
  },
  placeholder: 'Compose an epic email...',
  theme: 'snow',
});

const cardTemplate = document.createElement('template');
cardTemplate.innerHTML = `
  <div class="card">
    <div class="card-header"></div>
    <div class="card-body overflow-y-auto">
      <div class="mailText"></div>
    </div>
    <div class="card-footer text-end">
      <button type="button" class="btn btn-sm btn-adc-blue btnTemplate templateUse">use</button>
      <button type="button" class="btn btn-sm btn-danger btnTemplate templateDelete" data-bs-toggle="modal" data-bs-target="#deleteModal">delete</button>
    </div>
  </div>
`;

let cachedData = [];
let recipientArray = [];
let itemToDelete;

document.addEventListener('DOMContentLoaded',()=>{
  getTemplate('Drafts','draft')
  getList(listInstitution.settings,listInstitution.htmlEl,listInstitution.label)
  getList(listRole.settings,listRole.htmlEl,listRole.label)
  fillRecipientList()

  filterElements.forEach(element => {
    if (element.tagName === 'SELECT') {
      element.addEventListener('change', ()=>{
        if (element.value) {
          filters[element.id] = parseInt(element.value);
        } else {
          delete(filters[element.id]);
        }
        filterRecipientList();
      })
    } else if (element.tagName === 'INPUT' && element.type === 'text') {
      element.addEventListener('input', ()=>{
        if (element.value.length > 2) {
          filters[element.id] = element.value;
        } else {
          delete(filters[element.id]);
        }
        filterRecipientList();
      })
    }
  });

  selectAllBtn.addEventListener('click', (event)=>{
    event.currentTarget.style.display = 'none'
    unselectAllBtn.style.display = 'inline-block'
    recipientList.innerHTML = '';
    recipientArray = [];
    document.querySelectorAll('.recipient').forEach(el=>{
      el.checked = true;
      addEmailToList(el.value)
      recipientArray.push(el.value)
    })
  })

  unselectAllBtn.addEventListener('click', (event)=>{
    event.currentTarget.style.display = 'none'
    selectAllBtn.style.display = 'inline-block'
    recipientList.innerHTML = "";
    recipientArray = [];
    document.querySelectorAll('.recipient').forEach(el=>{ el.checked = false; })
  })

  document.querySelectorAll("[name='template']").forEach(el=>{
    el.addEventListener("click", (event)=>{
      const id = el.getAttribute("id");
      const val = el.value;
      const label = document.getElementById(id+"Label");
      getTemplate(label.innerText,val)
    })
  })

  document.querySelectorAll('.saveEmailBtn').forEach(el=>{
    el.addEventListener('click', ev => {
      if(checkError(ev.currentTarget.id)){
        saveEmail(ev.currentTarget.value)
      }
      
    })
  })

  clearFilterBtn.addEventListener('click',()=>{
    filterElements.forEach(element => {
      element.value = ''
      delete(filters[element.id]);
      filterRecipientList()
    });
  })

  document.getElementById('deleteModal').addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget;
    itemToDelete = button.value;
  });

  document.getElementById('deleteConfirmButton').addEventListener('click', function () {
    deleteRecord('user.php', 'deleteRecord', 'mail_template', itemToDelete, () => location.reload())
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
  });

  clearEditorBtn.addEventListener("click", ()=>{
    mailId.value = "";
    object.value = "";
    quill.setContents([]);
  })

  sendEmailBtn.addEventListener("click", (ev)=>{
    if(checkError(ev.currentTarget.id)){
      sendEmail()
    }
  })
})

function sendEmail(){
  let dati={
    trigger:'sendCustomMail',
    object:object.value,
    body:quill.root.innerHTML,
    recipients:recipientArray,
  }
  ajaxSettings.url=API+"user.php";
  ajaxSettings.data = dati
  $.ajax(ajaxSettings)
  .done(function(response){
    console.log(response);
    
    let toastClass = response.error === 0 ? "success" : "danger";
    showToast(response.message, toastClass);
  })
  .fail(function (jqXHR) {
    const errorMessage = jqXHR.responseJSON?.message || "An unexpected error occurred.";
    showToast(errorMessage, "danger");
  })
}

function getTemplate(label, type){
  const templateTitle = document.getElementById("templateTitle");
  templateTitle.textContent = label;
  const data = {type:type}
  if(type !== "shared"){data.created_by = user;}
  readRecord("user.php", "readRecord", "mail_template", data, mailTemplateSwitch)
}

function mailTemplateSwitch(data){
  const mailWrapper = document.getElementById("mailWrapper");
  const msg = document.createElement("h3");
  mailWrapper.innerHTML = "";
  if(data.error == 1){
    msg.textContent = data.message;
    mailWrapper.appendChild(msg);
    return false
  }
  if(data.error == 0 && data.items.length == 0){
    msg.textContent = 'No templates found';
    mailWrapper.appendChild(msg);
    return false
  }
  data.items.forEach(function(item){
    const template = cardTemplate.content.cloneNode(true);
    const header = template.querySelector(".card-header");
    const text = template.querySelector(".mailText");
    const btnUse = template.querySelector(".templateUse");
    const btnDelete = template.querySelector(".templateDelete");
    

    btnDelete.value = item.id;

    header.textContent = item.object;
    text.innerHTML = processHtml(item.body);

    mailWrapper.appendChild(template);

    btnUse.addEventListener("click", event => {
      mailId.value = item.id;
      object.value = item.object;
      quill.root.innerHTML = item.body;
    })    
  })
}

function filterRecipientList() {
  let filteredData = cachedData.filter(user => {
    let matches = true;
    if (filters.string) {
      matches = matches && (
        user.user.toLowerCase().includes(filters.string.toLowerCase()) || 
        user.email.toLowerCase().includes(filters.string.toLowerCase())
      );
    }
    if (filters.institution) { matches = matches && user.institution === filters.institution; }
    if (filters.role) { matches = matches && user.role === filters.role; }
    return matches;
  });
  renderRecipientList(filteredData);
}

function fillRecipientList(){
  let dati={trigger:'activeUsers'}
  ajaxSettings.url=API+"user.php";
  ajaxSettings.data = dati
  $.ajax(ajaxSettings)
  .done(function(data) {
    cachedData = data;
    renderRecipientList(data);    
  })
  .fail(function(data){form.find(".outputMsg").html(data);});
}

function renderRecipientList(data){
  unselectAllBtn.style.display = 'none'
  selectAllBtn.style.display = 'inline-block'
  const recipient = document.getElementById('recipient');
  recipient.innerHTML = ''; 
  data.forEach((user,idx) => {
    let li = document.createElement("li")
    li.classList.add('list-group-item');
    
    let checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.value = user.email;
    checkBox.id = 'check'+idx;
    checkBox.classList='form-check-input me-1 recipient';
    
    let label = document.createElement('label');
    label.setAttribute("for","check"+idx);
    label.classList = 'form-check-label'
    label.innerText = user.user + " - "+user.email;
    
    li.append(checkBox,label);
    recipient.appendChild(li);

    checkBox.addEventListener('change', function() {
      if (checkBox.checked) {
        addEmailToList(user.email);
        recipientArray.push(user.email);
      } else {
        removeEmailFromList(user.email);
        let index = recipientArray.indexOf(user.email);
        if (index !== -1) {recipientArray.splice(index, 1);}
      }
    });
  });
}

function addEmailToList(email) {
  const listItem = document.createElement('li');
  listItem.className = 'list-group-item';
  listItem.textContent = email;
  recipientList.appendChild(listItem);
}

function removeEmailFromList(email) {
  let items = recipientList.getElementsByTagName('li');
  for (let i = 0; i < items.length; i++) {
    if (items[i].textContent.trim() === email) {
      recipientList.removeChild(items[i]);
      break;
    }
  }
}

function checkError(el) {
  let count = 0;  
  if (!object.value) {
    objectError.style.display = 'block';
    count++;
  } else {
    objectError.style.display = 'none';
  }
  const mailHTML = quill.root.innerHTML;
  const mailDelta = quill.getContents().ops;
  const hasContent = mailDelta.some(op => (op.insert && op.insert.trim && op.insert.trim() !== '') || typeof op.insert === 'object');
  if (!hasContent) {
    editorError.style.display = 'block';
    count++;
  } else {
    editorError.style.display = 'none';
  }
  if (el === 'sendEmail') {
    if (recipientArray.length === 0) {
      recipientError.style.display = 'block';
      count++;
    } else {
      recipientError.style.display = 'none';
    }
  }
  if (count > 0) {
    showToast("Correct the errors before continue!", "danger");
    return false;
  }
  return true;
}


function saveEmail(type){
  const values = {object:object.value,body:quill.root.innerHTML,type:type}
  const mailId = document.getElementById("mailId");
  if(!mailId.value){
    createRecord("user.php", "createRecord", "mail_template", values, () => location.reload());
  }else{
    updateRecord("user.php", "updateRecord", "mail_template", values, {id:mailId.value}, () => location.reload())
  }
}

function processHtml(input) {
  // Delete all tags that do not have a closing and their contents
  input = input.replace(/<[^>]+\/>/g, '');
  // Remove all opening tags
  input = input.replace(/<[^\/][^>]*>/g, '');
  // Replace closing tags with a line break
  input = input.replace(/<\/[^>]+>/g, '<br>');
  // delete multiple br and leave only 1
  input = input.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
  input = limitWords(input, 20);
  return input.trim();
}

function limitWords(input, maxWords) {
 // Splits text into "lines" using <br> tags as delimiters
 const lines = input.split(/<br\s*\/?>/i);
  
 let wordCount = 0;
 let resultLines = [];

 for (let line of lines) {
   // Splits the current line into words
   const words = line.trim().split(/\s+/);
   
   if (wordCount + words.length > maxWords) {
     // If this line exceeds the limit, just add the remaining words
     const remainingWords = maxWords - wordCount;
     resultLines.push(words.slice(0, remainingWords).join(' '));
     wordCount = maxWords;
     break; // Stop the cycle because we have reached the limit
   } else {
     resultLines.push(words.join(' '));
     wordCount += words.length;
   }
 }
 // Reconstructs HTML text with <br> tags
 return resultLines.join('<br>') + (wordCount >= maxWords ? '...' : '');
}
