const object = document.getElementById('object');
const objectDiv = document.getElementById('objectError');
const editor = document.getElementById('editor');
const errorDiv = document.getElementById('editorError');
const emailTemplate = document.getElementById('mailTemplate');
const filterElements = document.querySelectorAll('.filter');
const submitBtn = document.getElementById('sendEmail');
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
let cachedData = [];
const filters = {}
document.addEventListener('DOMContentLoaded',()=>{
  fillRecipientList()

  filterElements.forEach(element => {
    if (element.tagName === 'SELECT') {
      element.addEventListener('change', ()=>{
        if (element.value) {
          filters[element.id] = element.value;
        } else {
          delete(filters[element.id]);
        }
        filterRecipientList();
      })
    } else if (element.tagName === 'INPUT' && element.type === 'search') {
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

  submitBtn.addEventListener('click', (el)=>{
    el.preventDefault();
    const check = checkError()
    if(check){submitForm()}
  })

})

function filterRecipientList() {
  let filteredData = cachedData.filter(user => {
    let matches = true;
    if (filters.string) {
      matches = matches && (user.user.toLowerCase().includes(filters.string.toLowerCase()) || user.email.toLowerCase().includes(filters.string.toLowerCase()));
    }
    if (filters.institution) {
      matches = matches && user.institution === filters.institution;
    }
    if (filters.role) {
      matches = matches && user.role === filters.role;
    }
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
  const recipient = document.getElementById('recipient');
  recipient.innerHTML = ''; 
  data.forEach((user,idx) => {
    let li = document.createElement("li")
    li.classList.add('list-group-item');
    
    let checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.value = user.email;
    checkBox.id = 'check'+idx;
    checkBox.classList='form-check-input me-1';
    
    let label = document.createElement('label');
    label.setAttribute("for","check"+idx);
    label.classList = 'form-check-label'
    label.innerText = user.user + " - "+user.email;
    
    li.append(checkBox,label);
    recipient.appendChild(li);
  });
}

function checkError(){
  if(!object.value){
    objectDiv.style.display = 'block';
    return false;
  }else{
    objectDiv.style.display = 'none';
  }

  const mailHTML = quill.root.innerHTML;
  const mailDelta = quill.getContents().ops;
  const hasContent = mailDelta.some(op => (op.insert && op.insert.trim && op.insert.trim() !== '') || typeof op.insert === 'object');
  
  if (!hasContent) {
    errorDiv.style.display = 'block';
    return hasContent;
  }else{
    errorDiv.style.display = 'none';
  }
  return true;
}

function submitForm(){
  let data = {
    object:object.value,
    body:quill.root.innerHTML
  }
  if(emailTemplate.checked){ data.template = 'true'}
  console.log(data);
  
}