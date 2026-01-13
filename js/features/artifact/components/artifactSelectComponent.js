export function buildSelectOptions(lists) {
  const usr = document.getElementById('userId').value || null;
  lists.forEach(item=>{
    const key = Object.keys(item)[0];
    const selectEl = document.getElementById(key);
    if(selectEl){
      item[key].forEach(optionData=>{
        const option = document.createElement("option");
        option.value = optionData.id || optionData.gid;
        option.textContent = optionData.value || optionData.name || optionData.definition || `${optionData.acronym} - ${optionData.license}`;
        if(key==='author' && usr){
          if(optionData.id == Number(usr)){ option.selected = true; } 
        }
        selectEl.appendChild(option);
      });
    }
  });
  return true;
}