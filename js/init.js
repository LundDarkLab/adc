document.addEventListener("DOMContentLoaded", function() {
  initNav();
  backdrop.style.display = 'none';
  if(backdrop){
    backdrop.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNav();
    });
  }
  if(toggleMenuBtn){
    toggleMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNav();
    });
  }
  screen.orientation.addEventListener("change", initNav);
});

function initNav(){
  const loggedValue = $("[name=logged]").val();
  const device = checkDevice();
  
  if(loggedValue == 0){
    $("#userMenu").addClass('closed');
    $("body>main").addClass('large');
    switch (device) {
      case 'tablet-landscape': $("#toggleMenu").hide(); break;
      case 'tablet-portrait': $("#toggleMenu").show(); break;
      case 'pc': 
        $("#toggleMenu").hide();
        $("#backdrop, #userMenu").remove() 
      break;
      default: $("#toggleMenu").show(); break;
    }
  }else{
    if(device=='pc'){
      $("#userMenu").addClass('open');
    }else{
      $("#userMenu").addClass('closed');
    }
    $("body>main").addClass(device=='pc' ? 'small' :'large');
    $("#toggleMenu").show()
  }
}
function toggleNav(){
  $("nav").toggleClass('open closed');
  if (
    // screen.width < 1368
    checkDevice()!=='pc'
  ) {
    $("#backdrop").fadeToggle('250');
    ["wheel", "touchmove"].forEach(event => {
      document.getElementById("backdrop").addEventListener(event,  preventScroll, {passive: false});
    })
  }else{
    $(".mainSection").toggleClass('large small')
  }
}
function preventScroll(e){
  e.preventDefault();
  e.stopPropagation();
  return false;
}


async function currentPageActiveLink(url) {
  document.querySelectorAll('.headerLink > a.currentPage').forEach(el => {
    el.classList.remove('currentPage');
  });
  const activeLink = document.querySelector(`.headerLink > a[href="${url}"]`);
  if (activeLink) {
    activeLink.classList.add('currentPage');
  }
}

function getSelectOptions(list, column, filter, select){
  ajaxSettings.url=API+"get.php";
  ajaxSettings.data = {trigger:'getSelectOptions',list:list, filter:filter, column:column}
  $.ajax(ajaxSettings)
  .done(function(data) {
    data.forEach((opt, i) => {
      $("<option/>").val(opt.id).text(opt[column]).appendTo("#"+select)
    });
  });
}



function addItemToCollection(id){
  collection.items.push(parseInt(id));
  console.log(collection);
}
function removeItemFromCollection(id){
  console.log(id);
  collection.items.splice(id,1);
  console.log(collection);
}
