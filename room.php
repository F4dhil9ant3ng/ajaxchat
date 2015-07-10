<?php
function suicide($msg,$type){
    $suicide_note = array("type"=>$type,"text"=>$msg);
    $suicide_note = json_encode($suicide_note);
    echo($suicide_note);
    die();
}
session_start();
if(!isset($_GET["load"])) suicide("Nothing requested.","error");
if($_SESSION["id"] != $_GET["id"]) suicide("Logged out.","error");
//database connection
$servername = "0.0.0.0";
$username = "arrayy";
$password = "";
$database = "chat";
if(!$db = mysqli_connect($servername,$username,$password,$database)) suicide("Error: ".mysqli_connect_error($db),"error");


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

if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
if (!$result = mysqli_stmt_get_result($stmt)) suicide("Error: ".mysqli_error($db),"error");
if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");

$messages;
foreach ($result as $key => $value) {
    if($_GET["load"] === "initial") {
        if($key === 0) {$next = $value["id"]+1; $_SESSION["next"] = $next;};
        if($key === mysqli_num_rows($result) - 1) {$prev = $value["id"]-1; $_SESSION["prev"] = $prev;};
    }
    if($_GET["load"] === "interval") {
        if($key === 0) {$next = $value["id"]+1; $_SESSION["next"] = $next;};
    }
    if($_GET["load"] === "earlier") {
        if($key === mysqli_num_rows($result) - 1) {$prev = $value["id"]-1; $_SESSION["prev"] = $prev;};
    }
    // if we're not loading earlier messages the following line shouldn't apply
    $messages[$value["id"]] = $value;
}

if (!empty($messages)) {
    foreach ($messages as $key => $value) {
        
        $messages[$key]["content"] = htmlspecialchars($messages[$key]["content"], ENT_HTML5, 'UTF-8', false);
        
        $userid = $messages[$key]["userid"];
        
        $stmt = mysqli_prepare($db, "SELECT name, img FROM users WHERE id=?");
        if (!mysqli_stmt_bind_param($stmt, 'i', $userid)) suicide("Error: ".mysqli_error($db),"error");
        if (!mysqli_stmt_execute($stmt)) suicide("Error: ".mysqli_error($db),"error");
        if (!$result = mysqli_stmt_get_result($stmt)) suicide("Error: ".mysqli_error($db),"error");
        if (!mysqli_stmt_close($stmt)) suicide("Error: ".mysqli_error($db),"error");

        foreach ($result as $rownum => $rowval) {
            $messages[$key]["thumb"] = $rowval["img"] ;
            $messages[$key]["name"] = $rowval["name"] ;
        }
    }   
}
    
$response = array();

if(!empty($messages)) $response["messages"] = $messages;
$response["info"] = array();
if(!empty($next)) $response["info"]["nextM"] = $next;
if(!empty($prev)) $response["info"]["prevM"] = $prev;

suicide($response,"success");

?>