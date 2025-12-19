<?php
session_start();
require_once('config.php'); // deve contenere $connessione

// Controlla che l'utente sia loggato e che ci sia un valore saldo
if (isset($_SESSION['id']) && isset($_POST['saldo'])) {
    $utente_id = $_SESSION['id'];
    $saldo = floatval($_POST['saldo']);

    // Aggiorna il saldo nel database
    $stmt = $connessione->prepare("UPDATE utenti SET saldo = ? WHERE id = ?");
    $stmt->bind_param("di", $saldo, $utente_id);
    $stmt->execute();

    echo "Saldo aggiornato con successo.";
} else {
    echo "Errore: dati mancanti o utente non loggato.";
}

$connessione->close();
?>
