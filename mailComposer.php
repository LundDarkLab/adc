<?php require 'init.php'; ?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <?php require("assets/meta.php"); ?>
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet">
  </head>
  <body>
    <?php require("assets/header.php"); ?>
    <?php require("assets/menu.php"); ?>
    <main class="animated mainSection">
      <div class="container">
        <form id="mailForm">
          <div class="mb-3">
            <h3 class="txt-adc-dark border-bottom mb-3">Type email</h3>
            <label for="object">Object</label>
            <input type="text" class="form-control" id="object">
            <div id="objectError" style="color: red; display: none;">Please insert an email object!</div>
          </div>

          <div id="editor"></div>
          <div id="editorError" style="color: red; display: none;">Please write a valid text!</div>

          <div class="form-check mt-3">
            <input class="form-check-input" type="checkbox" id="mailTemplate">
            <label class="form-check-label" for="mailTemplate">save as template</label>
            <div class="form-text">check if you want to save the e-mail as a template and reuse it later, if you leave the box unchecked, the text of the e-mail will not be saved in the database.</div>
          </div>

          <h3 class="txt-adc-dark border-bottom my-3">Add recipients</h3>
          <div class="d-flex align-items-center justify-content-start border rounded p-2">
            <div class="btn-group btn-group-sm">
              <input type="checkbox" class="btn-check filter" id="addAll" autocomplete="off">
              <label class="btn btn-outline-secondary" for="addAll">add all</label>
            </div>
            <select class="form-select form-select-sm w-auto mx-2 filter" id="institution">
              <option selected value="">filter by institution</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </select>
            <select class="form-select form-select-sm w-auto filter" id="userclass">
              <option selected value="">filter by userclass</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </select>
            <input type="search" class="form-control form-control-sm w-auto mx-2 filter" placeholder="type email or name" id="string">
          </div>
          <div class="mt-3 border rounded">
            <ul class="list-group list-group-flush" id="recipient"></ul>
          </div>

          <div class="mt-3">
            <button type="submit" class="btn btn-sm btn-adc-blue" id="sendEmail">send</button>
          </div>
        </form>
      </div>
    </main>
    <?php require("assets/js.html"); ?>
    <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
    <script src="js/mailComposer.js"></script>
  </body>
</html>
