<?php
function suicide($msg,$type){
    $suicide_note = array("type"=>$type,"text"=>$msg);
    $suicide_note = json_encode($suicide_note);
    echo($suicide_note);
    die();
}
if(!isset($_POST["type"])) suicide("Nothing requested.","error");

//database connection
$servername = "0.0.0.0";
$username = "arrayy";
$password = "";
$database = "chat";

if(!$db = mysqli_connect($servername,$username,$password,$database)) suicide("Error: ".mysqli_connect_error($db),"error");

session_start();

$userid = $_SESSION["id"];
$type = $_POST["type"];
$date = gmdate("Y-m-d H:i:s", time());
$status = "none";
if($type === "img") {
    // check: selected a file
    if(empty($_FILES['real_img']['name'])) suicide("Error: Please select an image.","error");
    
    // check: no upload errors
    if($_FILES["real_img"]["error"] > 0) suicide("An error ocurred while uploading.","error");
    
    // getting file MIME TYPE
    $finfo = new finfo();
    $fileMimeType = $finfo->file($_FILES["real_img"]["tmp_name"], FILEINFO_MIME_TYPE);
    
    // check: uploading an image MIME TYPE
    if( $fileMimeType != "image/png" &&
        $fileMimeType != "image/jpeg" &&
        $fileMimeType != "image/pjpeg" &&
        $fileMimeType != "image/gif")
        suicide("Error: A valid image file is required.","error");
    
    // check: file size
    if($_FILES["real_img"]["size"] > 1500000) suicide("Error: File uploaded exceeds maximum upload size.","error");
    
    // getting file extension
    $extension = pathinfo($_FILES['real_img']['name'])["extension"];
    
    //setting random name, setting directory location (for the original image)
    $rand = bin2hex(openssl_random_pseudo_bytes(10));
    $filename = $rand.".".$extension;
    $file_dir = "files/" . $filename;
    
    // moving file to the directory
    if(!move_uploaded_file($_FILES["real_img"]["tmp_name"], $file_dir)) suicide("Error moving file to the direcotry.","error");
    
    $content = $file_dir;
} else {
    $content = $_POST["content"];
}


$stmt = mysqli_prepare($db, "INSERT INTO messages (userid, type, content, date, status) VALUES (?, ?, ?, ?, ?)");
if (!mysqli_stmt_bind_param($stmt, 'issss', $userid, $type, $content, $date, $status)) suicide("Error: ".mysqli_error($db),"error");
if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");



suicide("posted","success");
?>