<?php
require_once('config.php');

if($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = $connessione->real_escape_string($_POST['username']);
    $password = $connessione->real_escape_string($_POST['password']);

    $sql_select = "SELECT * FROM utenti WHERE username = '$username'";
    if ($result = $connessione->query($sql_select)) {
        if ($result->num_rows == 1) {
            $row = $result->fetch_array(MYSQLI_ASSOC);
            // Nel login.php, dopo la verifica della password
            if (password_verify($password, $row['password'])) {
                session_start();
                $_SESSION['loggato'] = true;
                $_SESSION['id'] = $row['id'];
                $_SESSION['username'] = $row['username'];
                $_SESSION['saldo'] = $row['saldo']; 
                header("location: area-privata.php");
                exit;
            }
            } else {
                echo "La password non è corretta";
            }
        } else {
            echo "Non ci sono account con questo username";
        }
    } else {
        echo "Errore in fase di login";
    }
    $connessione->close();

?>