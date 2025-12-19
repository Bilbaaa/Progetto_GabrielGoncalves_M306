<?php

$host = "127.0.0.1";
$user = "root";
$password = "";
$db = "gestioneutenti";

$connessione = new mysqli($host, $user, $password, $db);

if ($connessione === false){
    die ("errore durante la connessione: " . $connessione->connect_error);

}
?>