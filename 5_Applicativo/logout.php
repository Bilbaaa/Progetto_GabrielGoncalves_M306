<?php
session_start();
require_once('config.php');

if (isset($_SESSION['id']) && isset($_POST['saldo'])) {
    $utente_id = $_SESSION['id'];
    $saldo = floatval($_POST['saldo']);
    $connessione->query("UPDATE utenti SET saldo = $saldo WHERE id = $utente_id");
}

session_unset();
session_destroy();
header("location: login.html");
exit;
?>
