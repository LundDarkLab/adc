import { showLoading } from "./helpers/helper.js";
import { getArtifactSelectOptions, getCategorySpecs, handleMaterialTechnique } from "./modules/artifact.js";

document.addEventListener("DOMContentLoaded", async function() {
  showLoading(true);
  await getArtifactSelectOptions();
  await initListener();
  showLoading(false);
});

async function initListener(){
  const catClass = document.getElementById('category_class');
  catClass.addEventListener('change', async()=>{ await getCategorySpecs(catClass.value); })

  const confirmMaterialBtn = document.getElementById('confirmMaterial');
  confirmMaterialBtn.addEventListener('click', handleMaterialTechnique);
}

// const listTrigger='getSelectOptions';
// const form = $("[name='newArtifactForm']");
// const toastToolBar = $('#toastBtn');
// let dati={}
// let tab=[]
// let field=[]
// let val=[]
// let autocompleted = false;
// let materialTechniqueArray = []
// let listArray = [];
// let listCatClass = {
//   settings:{trigger:listTrigger,list:'list_category_class'},
//   htmlEl: 'category_class',
//   label: 'value'
// }
// let listMaterial = {
//   settings: {trigger:listTrigger,list:'material'},
//   htmlEl: 'material',
//   label: 'value'
// }
// let listStoragePlace = {
//   settings: {trigger:listTrigger, list:'institution', orderBy:'name'},
//   htmlEl: 'storage_place',
//   label: 'value'
// }
// let listConservationState = {
//   settings: {trigger:listTrigger, list:'list_conservation_state', orderBy:'id'},
//   htmlEl: 'conservation_state',
//   label: 'value'
// }
// let listObjectCondition = {
//   settings: {trigger:listTrigger, list:'list_object_condition', orderBy:'value'},
//   htmlEl: 'object_condition',
//   label: 'value'
// }
// let listAuthor = {
//   settings: {trigger:listTrigger, list:'user', orderBy:'name'},
//   htmlEl: 'author',
//   label: 'name'
// }
// let listOwner = {
//   settings: {trigger:listTrigger, list:'institution', orderBy:'name'},
//   htmlEl: 'owner',
//   label: 'value'
// }
// let listLicense = {
//   settings: {trigger:listTrigger, list:'license', orderBy:'name'},
//   htmlEl: 'license',
//   label: 'name'
// }

// let listTimeline = {
//   settings: {trigger:listTrigger, list:'time_series', orderBy:'definition'},
//   htmlEl: 'timeline',
//   label: 'definition'
// }

// levelOptions(0)

// $("#resetMapDiv").hide();
// mapInit()
// map.fitWorld()

// listArray.push(listCatClass,listMaterial,listStoragePlace,listConservationState,listObjectCondition,listAuthor,listOwner,listLicense, listTimeline)
// listArray.forEach((item, i) => {getList(item.settings,item.htmlEl,item.label)});

// $("[name=checkNameBtn]").on('click', function(){
//   let name = $("#name").val()
//   if(!name){
//     alert('The field is empty, enter a value and retry')
//     return false;
//   }
//   if(name.length < 5){
//     alert('The name must be 5 characters at least')
//     return false;
//   }
//   checkName({name:name,element:'artifact'})
// })

// $('#catSpecsMsg,#cityMsg').hide();
// $(document).on('change', '#category_class', handleCategoryChange);
// $('[name=resetMap]').on('click',function(e){
//   e.preventDefault()
//   e.stopPropagation()
//   resetMapValue()
// });
// $("[name=confirmMaterial]").on('click', handleMaterialTechnique)

// $("#is_museum_copy").on('click',function(){
//   let label = $(this).is(':checked') ? 'yes' : 'no';
//   $("label[for='is_museum_copy").text(label)
// });

// $("[name='newArtifact']").on('click', function(el){ newArtifact(el) })

// document.querySelectorAll('.gadm').forEach((item, i) => {
//   item.addEventListener('change', function(){
//     const gid = parseInt(this.id.split('_')[1])
//     handleBoundariesChange(gid+1)
//     let value = this.value
//     if(value == ''){
//       handleBoundariesChange(gid)
//     }else{
//       levelOptions(gid, value)
//       administrativeBoundaries(gid, value, 'collection')
//     }
//     if (marker) { map.removeLayer(marker)};
//     document.getElementById('latitude').value = '';
//     document.getElementById('longitude').value = '';
//   })
// });

// function handleBoundariesChange(idx){
//   for (let i = idx+1 ; i <= 7; i++) {
//     const sel = document.getElementById('gid_' + i + '_container');
//     if (sel) { sel.classList.add('hide'); }
//   }
//   const parentID = parseInt(idx) - 1;
//   const parent = document.getElementById('gid_'+parentID).value
//   administrativeBoundaries(parentID,parent,'collection')
// }

// function checkMaterialArray(){
//   const mt = materialTechniqueArray.length
//   const mtEl = document.getElementById('material')
//   if (mt == 0) {
//     alert('You have to add 1 material at least')
//     mtEl.setCustomValidity('You have to add 1 material at least')
//     return false;
//   }else {
//     mtEl.setCustomValidity('')
//     return true;
//   }
// }

// function newArtifact(el){
//   checkMaterialArray()
//   if (form[0].checkValidity()) {
//     el.preventDefault()
//     buildData()
//     dati.trigger = 'addArtifact';
//     dati.artifact_material_technique = materialTechniqueArray;
//     if ($("#city").val()) { dati.artifact_findplace.city = $("#city").data('cityid')}
//     ajaxSettings.url=API+"artifact.php";
//     ajaxSettings.data = dati
//     $.ajax(ajaxSettings)
//     .done(function(data) {
//       console.log(data);
//       if (data.res==0) {
//         $("#toastDivError .errorOutput").text(data.output);
//         $("#toastDivError").removeClass("d-none");
//       }else {
//         $(".toastTitle").text(data.output)
//         gotoIndex.appendTo(toastToolBar);
//         gotoDashBoard.appendTo(toastToolBar);
//         gotoNewItem.attr("href","artifact_view.php?item="+data.id).appendTo(toastToolBar);
//         newRecord.appendTo(toastToolBar);
//         $("#toastDivSuccess").removeClass("d-none")
//       }
//       $("#toastDivContent").removeClass('d-none')
//     });
//   }
// }

// function levelOptions(gid, filter, selected) {
//   ajaxSettings.url = API + "geom.php";
//   ajaxSettings.data = { trigger: 'getAdminList', payload: { gid: gid } };
//   if (filter && filter != null) { ajaxSettings.data.payload.filter = filter; }

//   $.ajax(ajaxSettings).done(function (data) {
//     console.log(data.query);
    
//     const parent = document.getElementById('gid_' + gid);
//     if(selected){ parent.value = selected; }
//     if (data.items.length === 0) { return false; }
//     let current = parseInt(gid);
//     if (current <= 6 && filter) { current = (current + 1); }
//     const selContainer = document.getElementById('gid_' + current + '_container');
//     const sel = document.getElementById('gid_' + current);
//     if(sel){
//       sel.innerHTML = '';
//       const opt = document.createElement('option');
//       opt.value = '';
//       opt.text = '-- select value --';
//       if (current === 0) {
//         if (!selected) { opt.selected = true; }
//         opt.disabled = true;
//       }
//       sel.appendChild(opt);
//       data.items.forEach((item, i) => {
//         const opt = document.createElement('option');
//         opt.value = item.gid;
//         opt.text = item.name;
//         sel.appendChild(opt);
//       });
//       if (current > 0) { selContainer.classList.remove('hide'); }
//     }
//   });
// }