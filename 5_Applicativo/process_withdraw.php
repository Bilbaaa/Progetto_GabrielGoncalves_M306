<?php
session_start();
require_once('config.php');

if (!isset($_SESSION['loggato']) || $_SESSION['loggato'] !== true) {
    echo "Error: User not logged in";
    exit;
}

if (isset($_POST['cardNumber']) && isset($_POST['amount'])) {
    $user_id = $_SESSION['id'];
    $cardNumber = $_POST['cardNumber'];
    $amount = floatval($_POST['amount']);
    
    // Validazione dei numeri della carta, controlla che siano 16 numeri
    $cardNumber = preg_replace('/\s+/', '', $cardNumber);
    if (strlen($cardNumber) !== 16 || !ctype_digit($cardNumber)) {
        echo "Error: Invalid card number";
        exit;
    }
    
    if ($amount <= 0) {
        echo "Error: Invalid amount";
        exit;
    }
    
    // Controlla il saldo attuale
    $sql = "SELECT saldo FROM utenti WHERE id = $user_id";
    $result = $connessione->query($sql);
    $row = $result->fetch_array(MYSQLI_ASSOC);
    $current_balance = floatval($row['saldo']);
    
    // Controlla se ci sono abbastanza soldi
    if ($amount > $current_balance) {
        echo "Error: Insufficient balance";
        exit;
    }
    
    // Sottrae i soldi prelevati dal saldo
    $new_balance = $current_balance - $amount;
    
    // Aggiorna il saldo
    $stmt = $connessione->prepare("UPDATE utenti SET saldo = ? WHERE id = ?");
    $stmt->bind_param("di", $new_balance, $user_id);
    $stmt->execute();
    
    echo "Withdrawal successful. New balance: CHF " . number_format($new_balance, 2, ',', '.');
} else {
    echo "Error: Missing data";
}

$connessione->close();
?>


