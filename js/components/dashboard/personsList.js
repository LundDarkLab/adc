import { getPersons } from "../../modules/person.js";

export async function getPersonsList(filters={}) {
  const personDataWrap = document.getElementById('personDataWrap');
  const personStatusCount = document.getElementById('personStatusCount');
  const list = await getPersons(filters);
  console.log(list);
  personDataWrap.innerHTML='';
  personStatusCount.textContent = list.length;

  if(list.length === 0){
    personDataWrap.innerHTML = '<p class="text-center">No persons found with the selected filters.</p>';
    return;
  }

  list.forEach(person => {
    const personCard = document.createElement('div');
    personCard.classList.add('card', 'mb-3');
    personDataWrap.appendChild(personCard);

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    const title = document.createElement('h6');
    title.classList.add('mb-0');
    title.textContent = person.name;
    cardHeader.appendChild(title);
    personCard.appendChild(cardHeader);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    let status = '';
    if(person.active === 1){
      status = 'Active user';
    } else if(person.active === 2){
      status = 'Disabled user';
    } else {
      status = 'External user';
    }
    const fields = [
      { label: 'Status', value: status },
      { label: 'Email', value: person.email },
      { label: 'Institution', value: person.institution },
      { label: 'Position', value: person.position },
      { label: 'User class', value: person.user_class },
    ];
    fields.forEach(field => {
      if(field.label === 'Status'){
        const div = document.createElement('div');
        div.classList.add('alert', 'p-1', 'text-center');
        if(person.active === 1){
          div.classList.add('alert-success');
        } else if(person.active === 2){
          div.classList.add('alert-danger');
        } else {
          div.classList.add('alert-warning');
        }
        div.textContent = field.value;
        cardBody.appendChild(div);
      }else{
        const div = document.createElement('div');
        div.classList.add('d-flex', 'justify-content-start', 'gap-2', 'mb-2');
        const label = document.createElement('strong');
        label.style.flexBasis = '80px';
        label.style.flexShrink = '0';
        label.textContent = `${field.label}:`;
        div.appendChild(label);
        
        const valueElement = document.createElement('span');
        valueElement.textContent = field.value || `No ${field.label.toLowerCase()}`;
        div.appendChild(valueElement);
        cardBody.appendChild(div);
      }

    });

    personCard.appendChild(cardBody);

    const cardFooter = document.createElement('div');
    cardFooter.classList.add('card-footer', 'text-muted');
    
    const viewBtn = document.createElement('a');
    viewBtn.classList.add('btn', 'btn-sm', 'btn-adc-blue');
    viewBtn.textContent = 'View';
    viewBtn.href = `person_view.php?item=${person.id}`;
    cardFooter.appendChild(viewBtn);

    personCard.appendChild(cardFooter);
  });
  return list;
}