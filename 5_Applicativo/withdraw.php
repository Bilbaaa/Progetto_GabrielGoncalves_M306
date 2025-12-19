<?php
session_start();
if(!isset($_SESSION['loggato']) || $_SESSION['loggato'] !== true){
    header("location: login.html");
    exit;
}

require_once('config.php');
$user_id = $_SESSION['id'];
$sql_saldo = "SELECT saldo FROM utenti WHERE id = $user_id";
$result_saldo = $connessione->query($sql_saldo);
$row_saldo = $result_saldo->fetch_array(MYSQLI_ASSOC);
$saldo = $row_saldo['saldo'];
$connessione->close();
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdraw - Trading Platform</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        
        body {
            background-color: white;
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .withdraw-container {
            background: white;
            border: 3px solid black;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        h1 {
            text-align: center;
            margin-bottom: 30px;
            color: black;
            font-size: 28px;
        }
        
        .balance-info {
            background: #f0f0f0;
            border: 2px solid black;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .balance-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .balance-amount {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: black;
        }
        
        input[type="text"],
        input[type="number"] {
            width: 100%;
            padding: 12px;
            border: 2px solid black;
            border-radius: 10px;
            font-size: 16px;
        }
        
        input[type="text"]:focus,
        input[type="number"]:focus {
            outline: none;
            border-color: #4CAF50;
        }
        
        .card-number-hint {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .button-group {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn {
            flex: 1;
            padding: 15px;
            border: 2px solid black;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-withdraw {
            background-color: #f44336;
            color: white;
        }
        
        .btn-withdraw:hover {
            background-color: #da190b;
            transform: translateY(-2px);
        }
        
        .btn-cancel {
            background-color: #666;
            color: white;
        }
        
        .btn-cancel:hover {
            background-color: #555;
            transform: translateY(-2px);
        }
        
        .error-message {
            background-color: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 2px solid #c62828;
            display: none;
        }
        
        .success-message {
            background-color: #e8f5e9;
            color: #2e7d32;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 2px solid #2e7d32;
            display: none;
        }
    </style>
</head>
<body>
    <div class="withdraw-container">
        <h1>Withdraw Funds</h1>
        
        <div class="balance-info">
            <div class="balance-label">Available Balance</div>
            <div class="balance-amount">CHF <?php echo number_format($saldo, 2, ',', '.'); ?></div>
        </div>
        
        <div class="error-message" id="errorMsg"></div>
        <div class="success-message" id="successMsg"></div>
        
        <form id="withdrawForm" method="POST" action="process_withdraw.php">
            <div class="form-group">
                <label for="cardNumber">Card Number</label>
                <input type="text" id="cardNumber" name="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" required>
                <div class="card-number-hint">Enter a 16-digit card number (any number will work)</div>
            </div>
            
            <div class="form-group">
                <label for="amount">Withdraw Amount (CHF)</label>
                <input type="number" id="amount" name="amount" min="1" step="0.01" placeholder="100.00" max="<?php echo $saldo; ?>" required>
            </div>
            
            <div class="button-group">
                <button type="submit" class="btn btn-withdraw">Withdraw</button>
                <button type="button" class="btn btn-cancel" onclick="window.location.href='area-privata.php'">Cancel</button>
            </div>
        </form>
    </div>
    
    <script>
        // Formato del numero della carta con spazio ogni 4 numeri
        document.getElementById('cardNumber').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
        
        // Valida il prelievo
        document.getElementById('withdrawForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const amount = parseFloat(document.getElementById('amount').value);
            const availableBalance = <?php echo $saldo; ?>;
            
            const errorMsg = document.getElementById('errorMsg');
            const successMsg = document.getElementById('successMsg');
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            
            if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
                errorMsg.textContent = 'Please enter a valid 16-digit card number';
                errorMsg.style.display = 'block';
                return;
            }
            
            if (!amount || amount <= 0) {
                errorMsg.textContent = 'Please enter a valid withdrawal amount';
                errorMsg.style.display = 'block';
                return;
            }
            
            if (amount > availableBalance) {
                errorMsg.textContent = 'Insufficient balance. Available: CHF ' + availableBalance.toFixed(2);
                errorMsg.style.display = 'block';
                return;
            }
            
            // Submit form
            const formData = new FormData(this);
            fetch('process_withdraw.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(data => {
                if (data.includes('successo') || data.includes('success')) {
                    successMsg.textContent = 'Withdrawal successful! Redirecting...';
                    successMsg.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = 'area-privata.php';
                    }, 1500);
                } else {
                    errorMsg.textContent = 'Error processing withdrawal. Please try again.';
                    errorMsg.style.display = 'block';
                }
            })
            .catch(error => {
                errorMsg.textContent = 'Error processing withdrawal. Please try again.';
                errorMsg.style.display = 'block';
            });
        });
    </script>
</body>
</html>


