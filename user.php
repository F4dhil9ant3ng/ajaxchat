<?php
// suicide function
function suicide($msg,$type){
    $suicide_note = array("type"=>$type,"text"=>$msg);
    $suicide_note = json_encode($suicide_note);
    echo($suicide_note);
    die();
}

session_start();

if($_GET["logout"] === "true") {
    session_destroy();
    suicide("Logged out successfully","success");
}
if($_GET["autologin"] === "true"){
    if (isset($_SESSION["id"])) {
        suicide($_SESSION["id"] , "success");
    }
}

//database connection
$servername = "0.0.0.0";
$username = "arrayy";
$password = "";
$database = "chat";

if(!$db = mysqli_connect($servername,$username,$password,$database)) suicide("Error: ".mysqli_connect_error($db),"error");

if(isset($_POST["type"])) foreach ($_POST as $key => $value) {$_POST[$key] = htmlentities($value);}

if($_POST["type"] === "signup"){
    
    // shorthand variables
    $username = $_POST["username"];
    $password = $_POST["password"];
    
    // checK: user name and password 5 charecters long
    if(strlen($username) < 5 || strlen($password) < 5) suicide("Error: Username and password should be at least 5 charecters long","error");
    
    // check: no duplicate username
    // sql query and selecting
    
    $stmt = mysqli_prepare($db, "SELECT name FROM users WHERE name=?");
    if (!mysqli_stmt_bind_param($stmt, 's', $username)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
    if (!$result = mysqli_stmt_get_result($stmt)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");
    

    // checking number of rows
    if(mysqli_num_rows($result) > 0) suicide("Error: Username already exists.","error");
    
    // check: selected a file
    if(empty($_FILES['pp']['name'])) suicide("Error: Please select an image.","error");
    
    // check: no upload errors
    if($_FILES["pp"]["error"] > 0) suicide("An error ocurred while uploading.","error");
    
    // getting file MIME TYPE
    $finfo = new finfo();
    $fileMimeType = $finfo->file($_FILES["pp"]["tmp_name"], FILEINFO_MIME_TYPE);
    
    // check: uploading an image MIME TYPE
    if( $fileMimeType != "image/png" &&
        $fileMimeType != "image/jpeg" &&
        $fileMimeType != "image/pjpeg" &&
        $fileMimeType != "image/gif")
        suicide("Error: A valid image file is required.","error");
    
    // check: file size
    if($_FILES["pp"]["size"] > 1500000) suicide("Error: File uploaded exceeds maximum upload size.","error");
    
    // getting file extension
    $extension = pathinfo($_FILES['pp']['name'])["extension"];
    
    //setting random name, setting directory location (for the original image)
    $rand1 = bin2hex(openssl_random_pseudo_bytes(10));
    $filename1 = $rand1.".".$extension;
    $file_dir1 = "files/" . $filename1;
    
    // moving file to the directory
    if(!move_uploaded_file($_FILES["pp"]["tmp_name"], $file_dir1)) suicide("Error moving file to the direcotry.","error");
    
    //setting random name, setting direcotry location (for the cropped image)
    $rand2 = bin2hex(openssl_random_pseudo_bytes(10));
    $filename2 = $rand2.".".$extension;
    $file_dir2 = "files/" . $filename2;
    
    // create image according to the file MIME TYPE
    if($fileMimeType === "image/png") {$org_image = imagecreatefrompng($file_dir1);}
    elseif($fileMimeType === "image/gif") {$org_image = imagecreatefromgif($file_dir1);}
    elseif($fileMimeType === "image/pjpeg" || $fileMimeType === "image/jpeg") {$org_image = imagecreatefromjpeg($file_dir1);}
    
    $thumb_width = 160;
    $thumb_height = 160;
    
    $width = imagesx($org_image);
    $height = imagesy($org_image);
    
    $original_aspect = $width / $height;
    $thumb_aspect = $thumb_width / $thumb_height;
    
    if ( $original_aspect >= $thumb_aspect ) {
       // If image is wider than thumbnail (in aspect ratio sense)
       $new_height = $thumb_height;
       $new_width = $width / ($height / $thumb_height);
    } else {
       // If the thumbnail is wider than the image
       $new_width = $thumb_width;
       $new_height = $height / ($width / $thumb_width);
    }
    
    $thumb = imagecreatetruecolor( $thumb_width, $thumb_height );
    
    // Resize and crop
    imagecopyresampled($thumb,
                       $org_image,
                       0 - ($new_width - $thumb_width) / 2, // Center the image horizontally
                       0 - ($new_height - $thumb_height) / 2, // Center the image vertically
                       0, 0,
                       $new_width, $new_height,
                       $width, $height);
                       
    if($fileMimeType === "image/png") {imagepng($thumb, $file_dir2, 80);}
    elseif($fileMimeType === "image/gif") {imagegif($thumb, $file_dir2, 80);}
    elseif($fileMimeType === "image/pjpeg" || $fileMimeType === "image/jpeg") {imagejpeg($thumb, $file_dir2, 80);}
    
    // deletes the origianl image
    unlink($file_dir1);

    $stmt = mysqli_prepare($db, "INSERT INTO users (name, pass, img) VALUES (?, ?, ?)");
    if (!mysqli_stmt_bind_param($stmt, 'sss', $username,$password,$file_dir2)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");

    $response = array(
        "notice" => "You're Successfully registered, we will log you in now",
        "go" => "login",
        "username" => $username,
        "password" => $password
        );
    
    suicide($response,"success");
}

if($_POST["type"] === "login"){
    $username = $_POST["login-username"];
    $password = $_POST["login-password"];
    
    $stmt = mysqli_prepare($db, "SELECT * FROM users WHERE name=?");
    if (!mysqli_stmt_bind_param($stmt, 's', $username)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
    if (!$result = mysqli_stmt_get_result($stmt)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");
    
    if(mysqli_num_rows($result) < 1) suicide("Error: Username doesn't exist.","error");

    foreach ($result as $key => $value) {
        $dbpass = $value["pass"];
    }
    
    if($password != $dbpass) suicide("Wrong password.","error");
    
    foreach ($result as $key => $value) {
        $userid = $value["id"];
    }
    
    $_SESSION["id"] = $userid;
    
    $response = array(
        "notice" => "Logged-in successfully, trying to load messages now.",
        "go" => "room",
        "id" => $userid
    );
    
    suicide($response,"success");
}
?>