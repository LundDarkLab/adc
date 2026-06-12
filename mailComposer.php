<?php 
require 'init.php'; 
if (!isset($_SESSION['id'])) { header('Location: 403.php');}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="css/mailComposer.css">
  </head>
  <body>
    <?php 
      require("assets/header.php");
      require("assets/menu.php");
      require("assets/loadingDiv.html");
    ?> 
    <main class="animated mainSection">
      <div class="container">
        <div class="row">
          <div class="col">
            <div id="toolbar">
              <input type="radio" class="btn-check" name="template" id="draft" value="draft" autocomplete="off" checked>
              <label class="btn btn-outline-secondary" id="draftLabel" for="draft">Drafts</label>

              <input type="radio" class="btn-check" name="template" id="template" value="private" autocomplete="off">
              <label class="btn btn-outline-secondary" id="templateLabel" for="template">My templates</label>

              <input type="radio" class="btn-check" name="template" id="shared" value="shared" autocomplete="off">
              <label class="btn btn-outline-secondary" id="sharedLabel" for="shared">Shared templates</label>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <div id="mailContainer" class="mt-3 mx-auto p-3 border rounded">
              <h5 id="templateTitle" class="txt-adc-dark">My drafts</h5>
              <div id="mailWrapper" class="mt-3"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="container mt-5">
        <form id="mailForm">
          <input type="hidden" id="mailId" value="">
          <input type="hidden" id="created_by" value="<?php echo $_SESSION['id']; ?>">
          <div class="mb-3">
            <h3 class="txt-adc-dark border-bottom mb-3">Type email</h3>
            <label for="object">Object</label>
            <input type="text" class="form-control" id="object">
            <div id="objectError" class="errorDiv alert alert-danger mt-2 p-2">Please insert an email object!</div>
          </div>
          <div id="editor"></div>
          <div id="editorError" class="errorDiv alert alert-danger mt-2 p-2">Please write a valid text!</div>

          <div class="my-3 d-flex justify-content-between">
            <div>
              <button type="button" class="btn btn-sm btn-outline-secondary saveEmailBtn" value="draft" id="saveAsDraft">save as draft</button>
              <button type="button" class="btn btn-sm btn-outline-secondary saveEmailBtn" value="private" id="saveAsPrivate">save as my template</button>
              <button type="button" class="btn btn-sm btn-outline-secondary saveEmailBtn" value="shared" id="saveAsShared">save as shared template</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" id="clearEditor">clear editor</button>
            </div>
            <div>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#toggleRecipients">toggle contacts</button>
            </div>
          </div>
          <div id="toggleRecipients" class="collapse">
            <h3 class="txt-adc-dark border-bottom my-3">Add recipients</h3>
            <div id="filterWrap" class="border rounded p-2">
              <select class="form-select form-select-sm w-auto mx-2 filter" id="institution">
                <option selected value="">filter by institution</option>
              </select>
              <select class="form-select form-select-sm w-auto filter" id="role">
                <option selected value="">filter by userclass</option>
              </select>
              <input type="text" class="form-control form-control-sm w-auto mx-2 filter" placeholder="type email or name" id="string">
              <button type="button" class="btn btn-sm btn-light" id="clearFilter" data-bs-toggle="tooltip" title="reset filters"><span class="mdi mdi-filter-variant-remove"></span></button>
            </div>

            <div id="selectEmailWrap">
              <div class="mt-3 border rounded">
                <div>
                  <div class="bg-light p-2 m-2">
                    <button type="button" id="selectAll" class="btn btn-sm btn-adc-dark">select all</button>
                    <button type="button" id="unselectAll" class="btn btn-sm btn-adc-dark">unselect all</button>
                  </div>
                  <ul class="list-group list-group-flush" id="recipient"></ul>
                </div>
                <div id="recipientError" class="errorDiv alert alert-danger mt-2 p-2">Please select at least one recipient!</div>
              </div>
              <div class="mt-3 border rounded">
                <div class="bg-light p-2 m-2"><h5>Send to:</h5></div>
                <ul class="list-group list-group-flush" id="sendToList"></ul>
              </div>
            </div>

            <div class="mt-3">
              <button type="button" class="btn btn-sm btn-adc-blue" id="sendEmail">send email</button>
            </div>
          </div>
        </form>
      </div>
    </main>
    <div id="toast-container" class="toast-container position-fixed top-0 start-50 translate-middle-x p-3"></div>
    <?php require("assets/deleteModal.html"); ?>
    <?php require("assets/js.html"); ?>
    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
    <script src="js/mailComposer.js"></script>
  </body>
</html>
