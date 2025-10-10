<?php

require_once('config.php');

$email = $connessione->real_escape_string($_POST['email']);
$username = $connessione->real_escape_string($_POST['username']);
$password = $connessione->real_escape_string($_POST['password']);

 $hashed_password = password_hash($password, PASSWORD_DEFAULT);


$sql = "INSERT INTO utenti (email, username, password) VALUES ('$email','$username','$hashed_password')";
if ($connessione->query($sql) === true){
    echo "registrazione effettuata con successo";
}else{
    echo "errore durante la registrazione utente $sql. " . $connessione->error;
}


?>