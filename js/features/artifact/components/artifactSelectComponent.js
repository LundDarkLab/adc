export function buildSelectOptions(lists) {
  lists.forEach(item=>{
    const key = Object.keys(item)[0];
    const selectEl = document.getElementById(key);
    if(selectEl){
      item[key].forEach(optionData=>{
        const option = document.createElement("option");
        option.value = optionData.id;
        option.textContent = optionData.value || optionData.name || optionData.definition || optionData.license;
        if(key==='author' && optionData.id == Number(usr)){ option.selected = true; }
        selectEl.appendChild(option);
      });
    }
  });
  return true;
}