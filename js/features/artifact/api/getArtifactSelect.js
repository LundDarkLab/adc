import { fetchApi } from "../../../shared/utils/fetch.js";

import { usersList } from "../../../modules/user.js";
import { institutionsList } from "../../../modules/institution.js";
import { bsAlert } from "../../../components/bsComponents.js";

export async function artifactSelect(){
  const output = [];
  const selectList = [
    {id:'category_class', list:'list_category_class' },
    {id:'matClass', list:'list_material_class' },
    {id:'matSpecs', list:'list_material_specs' },
    {id:'conservation_state', list:'list_conservation_state' },
    {id:'object_condition', list:'list_object_condition' },
    {id:'license', list:'license' },
  ]

  for(const item of selectList){
    try {
      const payload = {
        class: 'Artifact',
        action: 'getList',
        table: item.list
      };
      const response = await fetchApi({ body: payload });
      if (response.error === 1) throw new Error(`Error fetching Artifact select list: ${item.list}`);
      output.push({[item.id]:response.data});
    } catch (error) {
      console.error(`artifactSelect error for list ${item.list}:`, error);
      output.push({[item.id]:[]});
      bsAlert(`artifactSelect error for list ${item.list}:`, error, 'danger', 3000)
    }
  }

  
  const author = await usersList();
  const storage_place = await institutionsList();
  
  // output.push({timeline:timeline});
  output.push({author:author});
  output.push({storage_place:storage_place});
  output.push({owner:storage_place});
  return output;

}

export async function handleCategorySpecOptions(cat){
  try {
    const payload = {
      class: 'Artifact',
      action: 'getList',
      table: 'list_category_specs',
      filters: {category_class: cat}
    };
    const response = await fetchApi({ body: payload });
    if (response.error === 1) throw new Error(`Error fetching Artifact select list: ${item.list}`);
      return response.data;
    } catch (error) {
      bsAlert(`artifactSelect error for list ${item.list}: ${error}`, 'danger', 3000);
      return false;
    }
}