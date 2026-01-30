<?php
$destinationFolder = $_SERVER['DOCUMENT_ROOT']."/archive/models/preview/";

$fileName = $_FILES["nxz"]["name"];
$fileTmpLoc = $_FILES["nxz"]["tmp_name"];
$fileLoc = $destinationFolder.$fileName;
$fileType = $_FILES["nxz"]["type"];
$fileSize = $_FILES["nxz"]["size"];
$fileExt = pathinfo($fileName, PATHINFO_EXTENSION);
$fileErrorMsg = $_FILES["nxz"]["error"];//0 false, 1 true

if (!is_dir($destinationFolder)) {
    // Tentiamo di crearla ricorsivamente con i permessi corretti.
    if (!mkdir($destinationFolder, 0775, true)) {
        echo "Error: The destination folder does not exist and could not be created.";
        exit();
    }
}

if (!$fileTmpLoc) {
  echo "Please browse for a file before clicking the upload button.";
  exit();
}

if ($fileExt !== 'nxz') {
  echo "Sorry but you can upload only nxz files. You are trying to upload a ".$fileExt." file type";
  exit();
}
if ($fileType !== 'application/octet-stream') {
  echo "Sorry but you can upload only nxz files. You are trying to upload a ".$fileType." file type";
  exit();
}
if(move_uploaded_file($fileTmpLoc, $fileLoc)){
  chmod($fileLoc, 0666);
  echo $fileName." upload is complete";
} else {
  echo "move_uploaded_file function failed, view server log for more details";
}
?>
