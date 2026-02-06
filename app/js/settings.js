const toastToolBar = $('#toastBtn');
const apiPerson = API+"person.php";
const trigger = 'updatePerson'
const usr = document.getElementById('user').value;
const person = document.getElementById('person').value;
const formPwd = document.getElementById('pwdForm');
const curPwd = document.getElementById("current_pwd");
const newPwd = document.getElementById("new_pwd");
const confPwd = document.getElementById("confirm_pwd");
const personMainFieldForm = document.getElementById('usrMainFieldForm')
const personAffiliationForm = document.getElementById('usrAffiliationForm') 
const personalInformationForm = document.getElementById('personalInformationForm') 

getList(listInstitution.settings,listInstitution.htmlEl,listInstitution.label)
getList(listPosition.settings,listPosition.htmlEl,listPosition.label)

//set a fast timeout to make sure that list are fully loaded before setting the options selected according to the user's value
setTimeout(function(){ fetchData(person) }, 500);

  
$("#toggle-pwd").on('click',function() {
  $(this).find('i').toggleClass("mdi-eye mdi-eye-off");
  var input = $(".pwd");
  let type = input.attr("type") == "password" ? "text" : "password";
  input.attr("type", type);
});
$("#genPwd").on('click', generateRandomPassword)
newPwd.addEventListener("input", getPwdStrength);
  
$("#pwdChangeBtn").on('click', function (e) {
  checkPwd()
  if (formPwd.checkValidity()) {
    e.preventDefault()
    let dati={}
    dati.trigger = 'changePassword';
    dati.id = usr;
    dati.curPwd = curPwd.value;
    dati.password_hash = newPwd.value;
    ajaxSettings.url=API+'user.php';
    ajaxSettings.data = dati;
    $.ajax(ajaxSettings)
    .done(function(data) {
      console.log([dati,data]);
      // return false;
      if (data.res==0) {
        $("#toastDivError .errorOutput").text(data.output);
        $("#toastDivError").removeClass("d-none");
      }else {
        $(".toastTitle").text(data.output)
        gotoIndex.appendTo(toastToolBar);
        gotoDashBoard.appendTo(toastToolBar);
        $("#toastDivSuccess").removeClass("d-none")
      }
      $("#toastDivContent").removeClass('d-none')
    })
    .fail(function(data){
      form.find(".outputMsg").html(data);
    });
  }
});

$("#changeUsrMainFieldBtn").on('click', changePersonMainField);
$("#changeUsrAffiliationBtn").on('click', changePersonAffiliation);

function changePersonMainField(e) {
  if(personMainFieldForm.checkValidity()){
    e.preventDefault();
    const settings = {
      url: apiPerson,
      dataType: "json",
      method: "POST",
      data: {
        trigger: trigger,
        person: {
          id: person,
          first_name: $("#first_name").val(),
          last_name: $("#last_name").val(),
          email: $("#email").val()
        }
      }
    };
    saveInfo(settings);
  }
}

function changePersonAffiliation(e) {
  if(personAffiliationForm.checkValidity()){
    e.preventDefault();
    const settings = {
      url: apiPerson,
      dataType: "json",
      method: "POST",
      data: {
        trigger: trigger,
        person: {
          id: person,
          institution: $("#institution").val(),
          position: $("#position").val()
        }
      }
    };
    saveInfo(settings);
  }
}

function saveInfo(settings){
  $.ajax(settings)
    .done(function(data) {
      console.log(data);
      if (data.res == 1) {
        $("#toastDivError .errorOutput").text(data.output);
        $("#toastDivError").removeClass("d-none");
      } else {
        $(".toastTitle").text(data.output)
        $("#toastDivSuccess").removeClass("d-none")
        setTimeout(function(){ window.location.reload(); }, 3000);
      }
      $("#toastDivContent").removeClass('d-none')
    })
    .fail(function(data){
      console.log(data);
      $("#toastDivError .errorOutput").html(data.responseText);
    });
}



function checkPwd(){
  if(newPwd.value.length <= 8){
    newPwd.setCustomValidity("Password must have 8 characters at least");
  }else{
    newPwd.setCustomValidity("");
  }
  if(newPwd.value !== confPwd.value){
    confPwd.setCustomValidity("Passwords don't match, please check and try again");
  }else{
    confPwd.setCustomValidity("");
  }
}


function fetchData(person){
  ajaxSettings.url=API+"person.php";
  ajaxSettings.data={trigger:'getPerson', id:person}
  $.ajax(ajaxSettings)  
  .done(function(data) {
    console.log(data);
    const person = data.person;
    $("#first_name").val(person.first_name)
    $("#last_name").val(person.last_name)
    $("#email").val(person.email)
    $("#institution").val(person.institution_id)
    $("#position").val(person.position_id)
  });
}
