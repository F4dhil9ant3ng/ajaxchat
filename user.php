<?php
// suicide function
function suicide($msg,$type){
    $suicide_note = array("type"=>$type,"text"=>$msg);
    $suicide_note = json_encode($suicide_note);
    echo($suicide_note);
    die();
}

session_start();

// we will destroy session, thus logging out user if an ajax request asked us to do so by sending us a logout=true query
if(isset($_GET["logout"])) {
    session_destroy();
    suicide("Logged out successfully","success");
}

// we will check to see if we had a session going on (meaining there's a logged in user currently on this browser)
// the ajax will check that, if there's
// the script.js will show him the room
if(isset($_GET["autologin"])){
    if (isset($_SESSION["id"])) {
        suicide($_SESSION["id"] , "success");
    }
}

//database connection
$servername = "0.0.0.0";
$username = "alisaleem";
$password = "";
$database = "chat";

if(!$db = mysqli_connect($servername,$username,$password,$database)) suicide("Error: ".mysqli_connect_error($db),"error");



if (isset($_POST["type"])) {
    // if the user is signing up.....
    if($_POST["type"] === "signup"){
        // 1. shorthand variables
        $username = $_POST["username"];
        $password = $_POST["password"];
        
        // 2. check: user name and password 5 charecters long at least
        if(strlen($username) < 5 || strlen($password) < 5) suicide("Error: Username and password should be at least 5 charecters long","error");
        
        // 3. check: no duplicate username
        // 3.1. SQL QUERY AND SELECTING
        $stmt = mysqli_prepare($db, "SELECT name FROM users WHERE name=?");
        if (!mysqli_stmt_bind_param($stmt, 's', $username)) suicide("Error: ".mysqli_error($db),"error");
        if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
        if (!$result = mysqli_stmt_get_result($stmt)) suicide("Error: ".mysqli_error($db),"error");
        if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");
        
        /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*\
        |   NOTE: in this project, security was a concern for us, we didn't use the             |
        |   regural way of doing SQL queries, we used an alternative method of selecting and    |
        |   excuuting SQL queries. this alternative method is called "parameterized"            |
        |   and as the name suggests, it enables us to add the user input values as parameters, |
        |   dealing with user inputs as parameters, prevent them from being part of the SQL     |
        |   query string, thus preventing SQL injection and failing of the code in case a user  |
        |   inputs a special charecters.                                                        |
        |                                                                                       |
        |    1.  we prepare our SQL query by usning the mysqli_prepare funcitiom                |
        |    2.  instead of putting the variables, we put question marks as placeholders        |
        |    3.  we use the function mysqli_stmt_bind_param to bind our variables in the query  |
        |    4.  this function takes multiple arguments..                                       |
        |        a.  the first argument is the one that holds the mysqli_prepare funuction      |
        |        b.  the second argument is the type of the inputs                              |
        |            s .. for strings                                                           |
        |            i .. for integers                                                          |
        |            b .. for doubles                                                           |
        |       c.  after that we give the inputs as arguments                                  |
        |   5.  using the mysqli_stmt_excute we excute the query                                |
        |   6.  we get the results from mysqli_stmt_get_result                                  |
        |   7.  finally we close this parametrized query.                                       |        
        \*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    
    
        // 3.2 checking number of rows
        if(mysqli_num_rows($result) > 0) suicide("Error: Username already exists.","error");
        
        // 4. check: selected a file
        if(empty($_FILES['pp']['name'])) suicide("Error: Please select an image.","error");
        
        // 5. check: no upload errors
        if($_FILES["pp"]["error"] > 0) suicide("An error ocurred while uploading.","error");
        
        // 6. getting file MIME TYPE
        $finfo = new finfo();
        $fileMimeType = $finfo->file($_FILES["pp"]["tmp_name"], FILEINFO_MIME_TYPE);
        
        // 7. check: uploading an image MIME TYPE
        if( $fileMimeType != "image/png" &&
            $fileMimeType != "image/jpeg" &&
            $fileMimeType != "image/pjpeg" &&
            $fileMimeType != "image/gif")
            suicide("Error: A valid image file is required.","error");
        
        // 8. check: file size
        if($_FILES["pp"]["size"] > 1500000) suicide("Error: File uploaded exceeds maximum upload size.","error");
        
        // 9. getting file extension
        $extension = pathinfo($_FILES['pp']['name'])["extension"];
        
        //10. setting random name, setting directory location (for the original image)
        $rand1 = bin2hex(openssl_random_pseudo_bytes(10));
        $filename1 = $rand1.".".$extension;
        $file_dir1 = "files/" . $filename1;
        
        // 11. moving file to the directory
        if(!move_uploaded_file($_FILES["pp"]["tmp_name"], $file_dir1)) suicide("Error moving file to the direcotry.","error");
        
        //12. setting random name, setting direcotry location (for the cropped image)
        $rand2 = bin2hex(openssl_random_pseudo_bytes(10));
        $filename2 = $rand2.".".$extension;
        $file_dir2 = "files/" . $filename2;
        
        // 13. creation of the new image
        // 13.1. create image according to the file MIME TYPE
        if($fileMimeType === "image/png") {$org_image = imagecreatefrompng($file_dir1);}
        elseif($fileMimeType === "image/gif") {$org_image = imagecreatefromgif($file_dir1);}
        elseif($fileMimeType === "image/pjpeg" || $fileMimeType === "image/jpeg") {$org_image = imagecreatefromjpeg($file_dir1);}
        
        // 13.2. setting dimensions for the thumbnail we're going to make out of this image
        $thumb_width = 160;
        $thumb_height = 160;
        
        // 13.3. getting width and height of the original image
        $width = imagesx($org_image);
        $height = imagesy($org_image);
        
        // 13.4. aspect ratio of the original
        $original_aspect = $width / $height;
        
        // 13.5. aspect raio of the thumbnail 
        $thumb_aspect = $thumb_width / $thumb_height;
        
        // 13.6 if the thumb's aspect ratio is less than the original image
        if ( $original_aspect >= $thumb_aspect ) {
           // we take the height of the thumbnail to be the height of the cropped image 
           $new_height = $thumb_height;
           // based on the hight we'll calculate the width like this
           $new_width = $width / ($height / $thumb_height);
        } else {
           // If the thumbnail is wider than the image
           $new_width = $thumb_width;
           $new_height = $height / ($width / $thumb_width);
        }
        
        // 13.7. then we create an image true color.. with the dimensions of the thumb
        $thumb = imagecreatetruecolor( $thumb_width, $thumb_height );
        
        // 13.8 Resize and crop the original image to this image true color
        imagecopyresampled($thumb,
                           $org_image,
                           0 - ($new_width - $thumb_width) / 2, // Center the image horizontally
                           0 - ($new_height - $thumb_height) / 2, // Center the image vertically
                           0, 0,
                           $new_width, $new_height,
                           $width, $height);
        
        // 13.9 saving new image                   
        if($fileMimeType === "image/png") {imagepng($thumb, $file_dir2, 1);}
        elseif($fileMimeType === "image/gif") {imagegif($thumb, $file_dir2);}
        elseif($fileMimeType === "image/pjpeg" || $fileMimeType === "image/jpeg") {imagejpeg($thumb, $file_dir2, 90);}
        
        // 13.10. deletes the origianl image
        unlink($file_dir1);
        
        // 14. now let's insert the data (name,pass,img) in the database
        $stmt = mysqli_prepare($db, "INSERT INTO users (name, pass, img) VALUES (?, ?, ?)");
        if (!mysqli_stmt_bind_param($stmt, 'sss', $username,$password,$file_dir2)) suicide("Error: ".mysqli_error($db),"error");
        if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
        if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");
        
        // 15. prepare our response
        $response = array(
            "notice" => "You're Successfully registered, we will log you in now",
            "go" => "login",
            "username" => $username,
            "password" => $password
            );
        
        // 16. kill the rest of the page
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
}
?>