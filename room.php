<?php
// we start with suicide function of course..
function suicide($msg,$type){
    $suicide_note = array("type"=>$type,"text"=>$msg);
    $suicide_note = json_encode($suicide_note);
    echo($suicide_note);
    die();
}

// now let's check if the user's currently logged in
session_start();
if(!isset($_SESSION["id"])) suicide("Logged out.","error");

// if it didn't send request like load=initial, or load=interval or load=earlier
// in the get method URL query string ..
//that means no one requested this page... let's kill it
if(!isset($_GET["load"])) suicide("Nothing requested.","error");

// database connection
$servername = "0.0.0.0";
$username = "alisaleem";
$password = "";
$database = "chat";
if(!$db = mysqli_connect($servername,$username,$password,$database)) suicide("Error: ".mysqli_connect_error($db),"error");

    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*\
    |   Now according to the data requesed we're going to to different SQL queries                              |
    |   +if it's loaded = initial                                                                               |
    |   we're going to ask for the latest 3 messages                                                            |
    |   +if it's loaded = interval                                                                              |
    |   we're going to ask for any messages that has an ID greater than the ID in the $_SESSION["next"]         |
    |   +if it's loaded = earlier                                                                               |
    |   we're going to ask for 10 messages that has an ID less than the ID in the $_SESSION["prev"]             |
    \~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

if($_GET["load"] === "initial") {
    $stmt = mysqli_prepare($db, "SELECT * FROM messages order by id DESC LIMIT 3");
}

elseif($_GET["load"] === "interval") {
    $next = $_SESSION["next"];
    $stmt = mysqli_prepare($db, "SELECT * FROM messages WHERE id >= ?");
    if (!mysqli_stmt_bind_param($stmt, 'i', $next)) suicide("Error: ".mysqli_error($db),"error");
}

elseif($_GET["load"] === "earlier") {
    $prev = $_SESSION["prev"];
    $stmt = mysqli_prepare($db, "SELECT * FROM messages WHERE id <= ? order by id DESC LIMIT 10");
    if (!mysqli_stmt_bind_param($stmt, 'i', $prev)) suicide("Error: ".mysqli_error($db),"error");
} 

// now let's : excute, get results, close
if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
if (!$result = mysqli_stmt_get_result($stmt)) suicide("Error: ".mysqli_error($db),"error");
if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");

$messages = null;
$response = array();
// if it's empty
if (mysqli_num_rows($result) < 1) {
    $response["text"] = $messages;
    suicide($response,"success");
};

// let's convert the mysql result to an associative array
foreach ($result as $key => $value) {
    
    // for each row we'll take the poster ID
    $posterid = $value["userid"];
    
    // then will connect to the users table asking for the name and the thumbnail
    $stmt = mysqli_prepare($db, "SELECT name, img FROM users WHERE id=?");
    if (!mysqli_stmt_bind_param($stmt, 'i', $posterid)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
    if (!$userresult = mysqli_stmt_get_result($stmt)) suicide("Error: ".mysqli_error($db),"error");
    if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");

    // so now we have a result, this result contains only one row..
    // so let's access that row by a foreach loop
    // and take the thumbnail and username.. and add it to the result from the messages table
    foreach ($userresult as $rownum => $rowval) {
        $value["thumb"] = $rowval["img"] ;
        $value["name"] = $rowval["name"] ;
    }
    
    // now let's escape any HTML elements that the content might have to prevent users from using
    // the HTML elements to make thier text bold or embeding web pages or anything like that
    $value["content"] = htmlspecialchars($value["content"], ENT_HTML5, 'UTF-8', false);
    
    // Now we have  row:
    // 1. this row doesn't have a special HTML elements
    // 2. it has the username
    // 3. and it has the poster's username
    // so it's ready to be added to our messages array
    $messages[$value["id"]] = $value;
    
    // while we're at it.. we're going to set new $_SESSION["prev"] and new $_SESSION["next"] according to the data we requested
    // if it's initial, then we're going to set both prev and next
    // if it's interval we're just going to set the next
    // if it's earlier we're just going to set the prev
    // since it's a descending order by ID, the first message has the ID of the expected next message
    // while the last message has the ID of the previous message
    
    if($_GET["load"] === "initial") {
        if($key === 0) {$next = $value["id"]+1; $_SESSION["next"] = $next;};
        $lastkey = mysqli_num_rows($result) - 1;
        if($key === $lastkey) {$prev = $value["id"]-1; $_SESSION["prev"] = $prev;};
    }
    
    if($_GET["load"] === "interval") {
        if($key === 0) {$next = $value["id"]+1; $_SESSION["next"] = $next;};
    }
    
    if($_GET["load"] === "earlier") {
        if($key === mysqli_num_rows($result) - 1) {$prev = $value["id"]-1; $_SESSION["prev"] = $prev;};
    }
}

// let's create our response  array
$response = array();

if(!empty($messages)) $response["messages"] = $messages;
$response["info"] = array();
if(!empty($next)) $response["info"]["nextM"] = $next;
if(!empty($prev)) $response["info"]["prevM"] = $prev;

suicide($response,"success");

?>