/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~Defining some important variables for later use~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
this will put them in the global scope, instead of being just a local variables in  function

#   the USER variable will be equal to the current user ID
    it will be compared against the sender ID of the messages
    if it's equal to the sends ID .. the message will be styled differently
    so it appear like the current logged in user sent it.
    This ID will NOT be used to save messages, since it can be moidified by the USER
    Rather, I'll use a $_SESSION in PHP to save the IP of the currently logged-in USER*/
    
var USER = "";


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Height Assigning function~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
A function that will assign a height for the the div that contains the messages
by this function we will prevent vertical scroll
this function will be called if:
    1. the user successfully logged in
    2. we loaded the messages initially...*/
var assignHeight = function () {
    var windowHeight = $(window).innerHeight();
    var headerHeight = $("header").outerHeight();
    var inputsHeight = $("#text").outerHeight();
    var mainHeight = windowHeight - headerHeight - inputsHeight;
    $(".main").css("height",mainHeight);
};




/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Error/Success reporting function~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Note:   since we're checking if the type is "success"
        the default type is error
        so we don't actually have to write "error" as a second argument if we wanted to display an error...*/
var notice = function (text,type) {
    $("#notice").text(text);
    type === "success" ? $("#notice").css("background","rgb(68, 157, 68)") : $("#notice").css("background","rgb(220, 20, 60)");
    $("#notice").css("top","0px");
    setTimeout(function () {
        $("#notice").css("top","-100px");
    },4000);
};


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~Forms submission (login, signup, upload images) function~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
this function will work on both forms, however the PHP program reacts with them differently
the PHP program will react with them according to a hidden input element they have
then it will send a JSON data that tells this page what to do
What else? this same function will also be used to upload images as char messages..
cool.. right? ...
*/

$("form").submit(function(evt){
    
    // prevents the browser from going to a different page
    evt.preventDefault();
    
    // let's take the URL from the form
    // the login form, the signup form and the image upload form all have different action="" attriute
    var url = $(this).attr("action");
    
    // our callback function
    // this callback function will work for the loing and signup forms only
    var user_callback = function (response) {
        // we will try to parse it to JSON
        try {
            response = JSON.parse(response);
            // if the type is error.. let's display it
            if(response.type === "error") {
                notice(response.text);console.log(response);
            } else {
                // display the success message
                notice(response.text.notice,"success");console.log(response);
                // if go === login .. then the user registered .. let's log him in.
                if(response.text.go === "login"){
                    // taking the values for login
                    $("#login-username").val(response.text.username);
                    $("#login-password").val(response.text.password);
                    // wait a second and half, so he reads the success message.. then clicks the login button programatically
                    setTimeout(function(){$("#login").click();},1500);
                // if go === room .. that means he logged in successfully .. yaayyyy
                } else if(response.text.go === "room") {
                    // let's register his ID on the JavaScript part
                    // we will use this ID for comparing it with incoming messages
                    // so we add special class on his messages for styling
                    USER = response.text.id;
                    // let's load messages now (by calling a function)
                    loadMessages("initial"); // inital load function will run first
                    setTimeout(function() {
                        setInterval(function(){
                            loadMessages("interval");
                        } ,1500); // the interval function will run every 1.5 seconds
                    },2000); // after 2 seconds of wait
                }
            }
        // if the parsing wasn't successful, it means that it's a PHP error :( .. darn it.. it's probably a missing semicolon.
        } catch (e) {
            notice("Server Side error: no suicide attempt occured.");console.log(response);
        }
    };
    
    // this is the image upload form callback function
    var img_upload_callback = function (response) {
        try {
            response = JSON.parse(response);
            if (response.type === "error") {
                notice(response.text);
            }
        } catch(e) {
            notice("Server Side error: no suicide attempt occured.");console.log(response);
        }
    };
    
    // a teritiary operator used to decide which callback function are we going to use
    var callback = url === "user.php" ? user_callback : img_upload_callback;
    
    // JQuery by default, doesn't really offer a new method or event for showing the progress bar
    // this function here uses JQUERY ability to do pure XMLHTTPREQUEST tricks .. one of which is the progress bar.
    var showProgress = function() {
        var xhr = new XMLHttpRequest();
        xhr.upload.onprogress = function (file) {
            var percentage = Math.ceil((file.loaded/file.total) * 100) + '%';
            $("#prog-con").css("top","0px");
            $("#prog-con").css("z-index","2");
            $("#prog-bar").css("width",percentage);
            if(file.loaded === file.total){
                $("#prog-bar").html("Upload finished");
                setTimeout(function () {$("#prog-con").css("top","-100px");$("#prog-con").css("z-index","0");},500);
            } else {
                $("#prog-bar").html(percentage);
            }
        };
        return xhr;
    };
    
    // we have a URL, Callback, a function to show progress
    // now let's hit the real AJAX method
    $.ajax({
        type: "POST",
        url: url,
        data: new FormData(this),
        processData: false,
        contentType: false,
        success: callback,
        xhr: showProgress
    });
    // the processData, and contentType are set to false so we prevent Jquery from processing them
    // this is because we're uploading files and we want to use a pure JavaScript XMLHTTPRequest to show progress
});





/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Load Messages function~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This function will ask the PHP program to return the following a list of messages
this function will be used in:
1. loading initial room messages
2. asking for new messaged on an interval time
3. loading earlier messages
------
notes:
1. the list of messages will be populated into the HTML by a seperate function
2. the next and prev ID will not be stored, as it's stored by a PHP $_SESSION
-----
what's the difference between an initial occurence, and an interval occurence?
# if it's initial:
    the PHP program will act on this fact to give the latest 3 messages
    we will load the chat.html file into the #room element.
# if it's interval: 
    the PHP program will act on this fact to give any new messages, by taking the NEXT from $_SESSION
    we won't load extra stuff in the  #room element
# However, in both cases the populateMessages(); function will list the messages in the same fashion ...
-----

I will call this function and pass an "ocurence" variable to it.
this variable (occurence) can be 3 diffrent values: initial, interval, and earlier
so this variable is going to be used by the PHP program
    1.  if it's initial, the PHP program will give the latest 3 messages
    2.  if it's interval, the PHP program will give any new messages after the $_SESSION["next"] then it will update the $_SESSION["next"]
    3.  if it's earlier, the PHP program will give 10 messages that has an ID less then the $_SESSION["prev"] then it will upadte the $_SESSION["prev"]
this variable will also be used by this same function:
    1.  if it's initial, we $.load chat.HTML .. at the callback of this ajax request we will populate messages and assign height
    2.  if it's interval, we will check the returened messages, 
        if it's not empty we will populate them
    3.  if it's earlier, we will check the returend messages,
        if it's not empty we will populate them, 
        if it's empty then there aren't any more earlier messages so we will remove the button
*/


var loadMessages = function (occurence) {
    var url = "room.php"; 
    var data = {
        load: occurence,
        id: USER
    };
    var callback = function (response) {
        try {
            response = JSON.parse(response);
            if(response.type === "success"){
                if (occurence === "initial") {
                    $("#room").load("chat.html",function(){
                        assignHeight();
                        populateMessages(response.text.messages);
                    });
                    notice("Room loaded successfully","success");
                } else if (occurence === "interval") {
                    if (typeof response.text.messages != "undefined") populateMessages(response.text.messages);
                } else {
                    if (typeof response.text.messages != "undefined") {populateMessages(response.text.messages,"top");}
                    else {$("#topbtn").html("--- no more earlier messages ---");}
                }
            } else {
                notice(response.text);console.log(response);
            }
        } catch(e){
            notice(response);console.log(response);
        }
    };
    $.get(url,data,callback);
};





/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Populating messages function~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
this function is pretty simple.. yet, very elegant..
    1. it takes an object that contains messages, and it also takes the target <- this is where we're going to put the messages (top or bottom)
    2. opens a variable "MarkupString" that will contain all the to-be-added html markup
    3. then it loops the data objects, and for each loop it does the following
        a. it makes a short hand for all the usuable information about the message
        b. if the ID of the current user = the ID of the message sender it sets the who variable to "me"
        c. else it sets it to "them"
        d. it the HTML markup in a string, this string has all the HTML markup, with IDs, classes, content, date, status...etc
        e. it check the target:
            * if it's === "top" ..
                it removes the "load earlier messages" button,
                then it adds the same button to the begining of the HTML string
                then it adds the HTML string to the begining of the #msgs-zone element,
                then it scrolls to the top of the DIV.
            * otherwise
                it adds the HTML string to the end of the #msgs-zone element
                then it scrolls to the bottom of the DIV*/
var populateMessages = function (data,target) {
    var MarkupString = "";
    for (var i in data) {
        // defines some shorthand variables
        var M_msgID = data[i]["id"];
        var M_type = data[i]["type"];
        var M_content = data[i]["content"];
        var M_date = data[i]["date"];
        var M_status = data[i]["status"];
        var M_thumb = data[i]["thumb"];
        var M_name = data[i]["name"];
        var M_senderID = data[i]["userid"];
        //if the current user ID = the sender's ID, then it's from "me"
        var who = USER === M_senderID ? "me" : "them";
        // ADDING DATA FOR A SINGLE STARTS
        // adds the main div with the ID and classes
        MarkupString = MarkupString + '<div class="message '+M_type+' '+who+'" id="'+M_msgID+'">';
        // adds the avatar with the name of the sender as a tooltip 
        MarkupString = MarkupString + '<img src="'+M_thumb+'" alt="'+M_name+'" title="'+M_name+'"></img>';
        // open P for content
        MarkupString = MarkupString + '<p>';
        // if it's a smily or frowny face
        if (M_type === "i") MarkupString = MarkupString + '<i class="fa '+M_content+'"></i>';
        // if it's an IMG
        else if (M_type === "img") MarkupString = MarkupString + '<img src="'+M_content+'"></img>';
        // if it's an audio
        else if (M_type === "audio") MarkupString = MarkupString + '<audio controls><source src="'+M_content+'" type="audio/mpeg">Your browser does not support the audio element.</audio>';
        // if none of the above then it's a paragaph, anyway let's just add it
        else MarkupString = MarkupString + M_content;
        // close the P for content
        MarkupString = MarkupString + '</p>';
        // adds time
        MarkupString = MarkupString + '<time>'+M_date+'</time>';
        // adds the delivered sign if it is delivered and it's from the sender
        if(M_status === "delivered" && who === "me") MarkupString = MarkupString + '<i class="status fa fa-check-circle"></i>';
        // close the DIV tag of the whole message
        MarkupString = MarkupString + '</div>';
        // ADDING DATA FOR A SINGLE LOOP ENDED
    }
    // now we have all the messags inside the MarkupString
    // let's add the messages in accordance with the direction
    if (target === "top") {
        // remove the load earlier messages button
        $("#topbtn").remove();
        // adds it to the top of the HTML string
        MarkupString = '<div id="topbtn"><button class="btn btn-info" id="loadold" onclick="loadOLD();">Load older messages</button></div>' + MarkupString;
        // adds the HTML string to the DIV
        $("#msgs-zone").html(MarkupString + $("#msgs-zone").html());
        // Scrolls to  TOP
        $("#msgs-zone").scrollTop(0);
    } else {
        // adds the HTML string to the DIV
        $("#msgs-zone").html($("#msgs-zone").html() + MarkupString);
        // scrolls to the bottom
        $("#msgs-zone").scrollTop($("#msgs-zone")[0].scrollHeight);
    }
};

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~POSTING: TEXT (sendP)~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
this function is in the onclick attribute of of the send button the besides the text input
it's fairly simple function:
    1. it takes the URL to be post.php
    2. the data are:
        type:  which the type of messages, basically we have three type (p, img, audio) this one is the "p"
        content: we take the content from the text input value
    3. the callback function in case of success will empty the value
    4. the Ajax request won't be sent unless the value has some charecters inside of it other than just spaces
        we remove the spacing using $.trim
Note: this function will also be excuted if the user presses "enter" (check the pressedEnter function below)
*/
var sendP = function () {
    //  URL ..
    var url = "post.php";
    // Data ..
    var data = {
        type:"p",
        content:$("#text").val()
    };
    // Callback
    var callback = function (response) {
        try {
            response = JSON.parse(response);
            if (response.type === "success") {
                // empty the text input ..
                $("#text").val(" ");
            } else {
                notice(response.text);   
            }
        } catch (e) {
            notice(response);
        }
    };
    // if after we trim it.. still contain charecters, it's a legit text message, let's send it..
    if ($.trim($('#text').val()) != '') $.post(url,data,callback);
};

/* this function is in the onkeypress attribute of the text input.
it will check which key is pressed, if it's 13 (and 13 is the keycode of the Enter key) it will run the sendP function that I wrote above
checking which key has been pressed has some cross browser issues
some brower uses the "which" property, other browsers uses the kyeCode property
we will check them both inside the the conditional satement using the || operator
*/
var pressedEnter = function (event) {if (event.which == 13 || event.keyCode == 13) sendP();};



/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~POSTING: Images (sendIMG)~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
We're not going to do much coding here, and here's why:
There's a hidden form in the page, this hidden form has only two inputs:
    # a file input: (this takes the image)
    # a hidden input: type="img"
once the user clicks the choose image button, we will click the file input programatically
    this is done by having chooseIMG(); function in the onclick attribute of the button
    and by JQuery we select the file input and we click it by the .click() method
once the user chooses an image, we will click the submi button in the form.
    this is done by having the clickSubmit(); function in the onchange attribute
    and by JQuery we select the submit button and click it using the click() method
once the the submit button gets clicked the form will be submitted
    this is done by having the sendIMG(); function in the onclick of the submit
    and by JQuery we submit the form using the submit() mehtod
once the form gets submitted.. the Submit function (that we wrote way above will get excuted)
and the magic, really occurs there... */
var chooseIMG =  function () {$("#real_img").click();};
var clickSubmit = function () {$("#submitimg").click();};
var sendIMG = function () { $("#imgform").submit();};


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~POSTING: Audio (little bit more complex)~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
----------------------------------------------
THE UNDERLYING LIBRARIES AND PLUGINS:
    recorder.js
    libmp3lame.min.js
    Fr.voice.js
    mp3Worker.js
    recorderWorker.js
----------------------------------------------
WHAT ARE THEY EXACTLY?
    Recording audio is done easily using the new HTML get user media API
    However saving this audio file to the user's computer or the server, is more complex 
    but why reinventing the wheel?
    Matt Diamond developed a plugin that can export the recording and let the user download it
    you can chek it out here: https://github.com/mattdiamond/Recorderjs
    However, this is not very satisfacotry, because a WAV file of 10 seconds can be nearly as large as 10 MegaBytes.
    converting this wav file to an MP3 might seem impossible to do in the browser,
    but .. there's a project called the LAME project, which is an open source, high quality MP3 encoder.
    http://lame.sourceforge.net/
    being an open source project, developers were able to port it to JavaScript.
    https://github.com/akrennmair/libmp3lame-js
    Now to make our life even more easier there's a JQuery plugin that uses the forementioned JavaScript plugins and libraries
    to play, record, convert, and save Microphone inputs from the user.
----------------------------------------------
HOW TO GET GOING WITH THE JQUERY PLUGIN:
    The JQuery Plugin offers us some easy to use function:
    1. Fr.voice.record: Used to begin recording
    2. Fr.voice.stop: Used to stop recording
    3. Fr.voice.export: Used to export recording

    Fr.voice.record: takes two arguments:
        first one is whether you want to give off a live feedback of what the user is recording. like letting them hear their voices
        the second on is a call back function that will be excuted once the recording has began
    
    Fr.voice.stop doesn't take any arguments. it just stops the recording and returns it.
    
    Fr.voice.export: takes two arguments:
        the first one is the callback function that will get excuted once the conversion and export is finished
        the second one is the type of the result you want:
            mp3: will give us a base64 uri of the mp3 file
            blob: will give us a blob file (which is stored in the user's computer)
            base64: will give us a base64 uri of a wav file for the recording..
----------------------------------------------
MODIFICATIONS I DID ON THE PLUGINS AND LIBRARIES:
    1. The Record.js JavaScript plugin when used with MP3 it gives a weired low pitched stero file
        to solve that I made the recorde file in mono, and we don't need it to be stereo anyways.. once I made it mono the problem was solved.
    2. The javascript port of lame project has a limitation that when we convert the WAV file to MP3 it doubles it's length
        to solve that, near the end of the libmp3lame.min.js .. I divided length by two.
    3. To get more consistency with JQuery Plugin.. I made the callback function of the Fr.voice.export to be the second argument just like the Fr.voice.record
        so we pass the type (which in our case will be MP3) and then we write the callback function.
----------------------------------------------
NOW LET's TALK ABOUT THE CODE IN OUR PROJECT:
    Global Variables
        We need 4 global variables: timeout, rcrdTimer, Timer and percent.. we'll explain what they do in a bit.
    Functions:
        We have to functions beginRecording(); and stopRecording();
        those two function are both in the record button onclick attribute, and we replace them one by another dynamically
        
        1. the first function beginRecording will do the following:
            It will fire the Fr.voice.record.
                the first argument is false, we don't want our users to hear what they are recording.
                the second arguemnt is a callback function that'll be excuted once recording began and do the following:
                    A.  it will change the onclick attribute of the record button to the other function stopRecording
                        so once we click it again the other function will be excuted
                    B.  it will change the icon of the button, for a better user experience
                    C.  it will show us the timer, which is a bar just like he notification bar that displays errors
                    D.  it will change the background of the bar to blue
                    E.  it wil set the HTML of the bar to be "Time left: 10 Seconds".
                    F.  it will make sure the the timer is ten
                    G.  it will set a setTimeout function in the timeout variable to excute the stopRecording after 10 seconds (= 10000 Milliseconds).
                    H.  it will set a setInterval function in the rcrdTimer variable, so every second the following will happen:
                        a.  we will substract 1 from the timer .. so at the first second, it will be 9
                        b.  we will tell the user in the bar that he has 9 seconds left.
                        c.  each second those two lines will get excuted, so the timer will be 8 and the user will see 8 then 7 then 6 and so on..
                    I. note that we stored the setTimeout and setInterval in a variables this will enables us to stop them in the next function 
        
        2. the second function stopRecording(); will do the following:
            A. it will fire the Fr.voice.export, on which we pass the type (mp3) and give a callback function 
                this callback function by itself takes a variabele, this variable will have the result of the export.
                like if it's an mp3 .. the variable will be a base64 uri for the mp3 file.
                in thi callback function we will send the $.post Ajax request.
                this $.post need 3 things:
                    URL: whcih is post.php
                    data: which is the data we will send to the PHP program.. it will be:
                        type:audio
                        content: uri
                        (NOTE: this uri is the variable that will have the result of the export)
                    callback: the callback function does the following
                        a.  it parses the response, checks if there's any error
                        b.  if the parsing failed it notifies the user
                        b.  if the response was parsed as a JSON and there's no error then
                                #   put the beginRecording(); function in the onclick attribute of the record button.
                                #   put the icon back
                                #   enable the button
                                #   hide the bar
            B. it will also fire Fr.voice.stop
            C. then it will clear the setTimeout and setInterval
            D. then it will tell the user that we're processing and uploading the audio
            E. it will also give the bar a green-good-looking background
            F. then it will disable the record button .. don't worry this, it will be enabled in the AJAX callback function                  
*/
var timeout;
var rcrdTimer;
var Timer = 10;

var beginRecording = function () {
  Fr.voice.record(false,function () {
    $("#rcrd").attr("onclick","stopRecording();");
    $("#rcrd").html('<i class="fa fa-microphone-slash"></i>');
    $("#timer").css("top","0px");
    $("#timer").css("background","rgb(40, 96, 144)");
    $("#timer").html("Time left: 10 seconds.");
    Timer = 10;
    timeout = setTimeout(function(){ stopRecording();},10000);
    rcrdTimer = setInterval(function(){
      Timer = Timer - 1;
      $("#timer").html("Time left: "+ Timer + " seconds");
    },1000);
  });
};


var stopRecording = function () {
  Fr.voice.export("mp3", function (uri) {
    var url="post.php";
    var data = {
        content: uri,
        type: "audio"
    };
    var callback = function (response) {
        try {
            JSON.parse(response);
            if(response.type === "error"){
                notice(response.text);
            } else {
                $("#rcrd").attr("onclick","beginRecording();");
                $("#rcrd").html('<i class="fa fa-microphone"></i>');
                $("#rcrd").removeAttr("disabled");
                $("#timer").css("top","-100px");    
            }
        } catch (e) {
            notice(response);
        }
    };
    $.post(url, data, callback);
});
    Fr.voice.stop();
    clearTimeout(timeout);
    clearInterval(rcrdTimer);
    $("#timer").html("Processing and uploading audio.");
    $("#timer").css("background","rgb(68, 157, 68)");
    $("#rcrd").attr("disabled","true");
};



/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~LOADING EARLIER MESSAGES~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
This function is on the onclick attribute of the button, it does nothing but excutes the loadMessages function with occurence = earlier
...*/
var loadOLD = function () {
    loadMessages("earlier");
};



/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~LOADING EARLIER MESSAGES~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
in case the user clicks logout .. a button that has this function on it's onclick attribute
this function will be excuted.. since we're not sending anydata .. we'll send our request via the $.get method
....*/
var logout = function () {
    var url = "user.php";
    var data = {logout: "true"};
    var callback = function (response) {
        console.log("logged out");
        document.location.reload(true);
    };
    $.get(url,data,callback);
};




/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~AUTO LOGIN~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
once the user-agent (browser) loads this page we will send an AJAX request
this ajax $.get request asks the PHP program if this computer has any $_SESSION with an ID..
if it does .. we will log the user instantly..
if it doesn't .. we will show the the user the register and login forms
....*/

$(document).ready(function() {
    var url = "user.php";
    var data = {autologin:"true"};
    var callback = function (response) {
        try {
            response = JSON.parse(response);
            console.log(response);
            if (response.type === "success") {
                USER = response.text;
                loadMessages("initial");
                setTimeout(function() {
                    setInterval(function(){
                        loadMessages("interval");
                    } ,1500);
                },2000);
            } else {$("#user").show();}
        } catch(e) {$("#user").show();}
    };
    $.get(url,data,callback); 
});