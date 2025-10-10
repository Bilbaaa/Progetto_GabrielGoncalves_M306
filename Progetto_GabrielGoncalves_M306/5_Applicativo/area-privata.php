<?php
session_start();
if(!isset($_SESSION['loggato']) || $_SESSION['loggato'] !== true){
    header("location: login.html");
    exit;
}


?>
<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale1.0">
    <title>Area Privata</title>
</head>
<body>
    <h1>Area privata</h1>
    <?php
        echo "ciao " . $_SESSION["username"];
    ?>
</body>

</html>
