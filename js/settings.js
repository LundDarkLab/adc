const personal = $("#user").data('personal');

if(personal == 1){
  const usr = document.getElementById('user');
  const formPwd = document.getElementById('pwdForm');
  const curPwd = document.getElementById("current_pwd");
  const newPwd = document.getElementById("new_pwd");
  const confPwd = document.getElementById("confirm_pwd");
  const toastToolBar = $('#toastBtn');
  
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
      dati.id = usr.value;
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
  
  function checkPwd(){
    //pwd minchar
    if(newPwd.value.length <= 8){
      newPwd.setCustomValidity("Password must have 8 characters at least");
    }else{
      newPwd.setCustomValidity("");
    }
    //pwd matching
    if(newPwd.value !== confPwd.value){
      confPwd.setCustomValidity("Passwords don't match, please check and try again");
    }else{
      confPwd.setCustomValidity("");
    }
  }
}

