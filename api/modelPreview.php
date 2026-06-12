<?php
header('Content-Type: application/json');
$projectRoot = dirname(__DIR__);
file_put_contents($projectRoot . '/archive/models/preview/upload_debug.log', print_r($_FILES, true), FILE_APPEND);
try {
    if (!isset($_FILES["nxz"])) {
        throw new Exception("No file uploaded.");
    }

    $fileName = $_FILES["nxz"]["name"];
    $fileTmpLoc = $_FILES["nxz"]["tmp_name"];
    $fileLoc = $projectRoot . "/archive/models/preview/" . $fileName;
    $fileType = $_FILES["nxz"]["type"];
    $fileSize = $_FILES["nxz"]["size"];
    $fileExt = pathinfo($fileName, PATHINFO_EXTENSION);
    $fileErrorMsg = $_FILES["nxz"]["error"];

    if (!$fileTmpLoc) {
        throw new Exception("Please browse for a file before clicking the upload button.");
    }
    if ($fileExt !== 'nxz') {
        throw new Exception("Sorry but you can upload only nxz files. You are trying to upload a ".$fileExt." file type");
    }
    if ($fileType !== 'application/octet-stream') {
        throw new Exception("Sorry but you can upload only nxz files. You are trying to upload a ".$fileType." file type");
    }
    if (!move_uploaded_file($fileTmpLoc, $fileLoc)) {
        // throw new Exception("move_uploaded_file function failed, view server log for more details");
        throw new Exception(
        "move_uploaded_file failed. " .
        "tmp: $fileTmpLoc | " .
        "dest: $fileLoc | " .
        "error: " . error_get_last()['message']
    );
    }
    chmod($fileLoc, 0666);
    echo json_encode(['success' => true, 'message' => $fileName." upload is complete", "filename" => $fileName]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
