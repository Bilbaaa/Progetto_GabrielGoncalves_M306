<?php
require_once('config.php');

if($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = $connessione->real_escape_string($_POST['email']);
    $username = $connessione->real_escape_string($_POST['username']);
    $password = $connessione->real_escape_string($_POST['password']);
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $saldo = floatval($_POST['saldo']);

    // Controlla se l'username o email esistono già
    $check_sql = "SELECT id FROM utenti WHERE username = '$username' OR email = '$email'";
    $check_result = $connessione->query($check_sql);
    
    if($check_result->num_rows > 0) {
        echo "Username o email già esistenti";
    } else {
        $sql = "INSERT INTO utenti (email, username, password, saldo) VALUES ('$email','$username','$hashed_password', 1000.00)";
        if ($connessione->query($sql) === true) {
            // Reindirizzamento alla pagina di 
            header("Location: login.html?registrazione=successo");
            exit();
        } else {
            echo "Errore durante la registrazione: " . $connessione->error;
        }
    }
    $connessione->close();
}
?>