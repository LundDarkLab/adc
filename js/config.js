const API = 'api/';
const ENDPOINT = API+'endpoint_private.php';
const spinner = "<div><div id='spinnerWrap' class='d-inline-block'><i class='mdi mdi-reload'></i></div> loading...</div>";

const toastEL = document.getElementById('toast')
const toast = new bootstrap.Toast(toastEL)

const gotoIndex = $("<a/>",{href:'index.php', class:'btn btn-secondary btn-sm mx-1'}).text('Go to index page')
const gotoDashBoard = $("<a/>",{href:'dashboard.php', class:'btn btn-secondary btn-sm mx-1'}).text('Go to dashboard')
const newRecord = $("<button/>",{type:'button', name:'newRecordBtn', class:'btn btn-secondary btn-sm mx-1'}).text('new record').on('click', function(){location.reload();});
const gotoNewItem = $("<a/>",{href:'', class:'btn btn-secondary btn-sm mx-1'}).text('Go to new item')
const backToItem = $("<a/>",{href:'', class:'btn btn-secondary btn-sm mx-1'}).text('Back to item')
const closeToast = $("<button/>",{type:'button', name:'closeToastBtn', class:'btn btn-secondary btn-sm mx-1'}).text('close');

let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) { return new bootstrap.Tooltip(tooltipTriggerEl,{trigger:'hover', html: true })})

const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {return new bootstrap.Popover(popoverTriggerEl, {trigger:'focus', html: true })});

let ajaxSettings = {method: "POST", timeout: 0, dataType: 'json',}

// list
const listInstitution = {
  settings:{trigger:'getSelectOptions',list:'institution'},
  htmlEl: 'institution',
  label: 'value'
}
const listPosition = {
  settings:{trigger:'getSelectOptions',list:'list_person_position'},
  htmlEl: 'position',
  label: 'value'
}
const listRole = {
  settings:{trigger:'getSelectOptions',list:'list_user_role'},
  htmlEl: 'role',
  label: 'value'
}

const currentUrl = ()=>{
  const page = window.location.pathname.slice(1).split('.')[0];
  return page || 'index';
}

// Index, chart, statistics
const backdrop = document.getElementById('backdrop')
const toggleMenuBtn = document.getElementById('toggleMenu')
const backToTop = document.getElementById('backToTop');
const backToTopBtn = document.getElementById("scrollToTopBtn");
const itemTool = document.getElementById('itemTool');
const statWrap = document.getElementById('statWrap');
const logged = document.getElementsByName('logged')[0];

let galleryInstance = null;
let collectionInstance = null;
let artifactsTot=0;
let countyDataCache = null;
let cacheTimestamp = null;
let activeFilter = 0;
let cronoData = [];
let institutionData = [];
let sort = "artifact.id DESC";

/////////////// COLLECTION DATA STRUCTURE ///////////////
var DEFAULTCOLLECTION = {
  type: "DC_COLL",
  version: "2.0",
  id: crypto?.randomUUID?.() || generateFallbackUUID(),
  // user: getUserId(),
  time: new Date().toISOString(),
  email: 'john.doe@nowhere.nw',
  author: 'John Doe',
  title: 'My Collection',
  description: 'Brief description of the collection content and motivation...',
  items: [],
};

var COLLECTIONDATA = {};