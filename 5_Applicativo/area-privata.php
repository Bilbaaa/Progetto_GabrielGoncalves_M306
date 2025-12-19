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
    <link rel="stylesheet" href="css/style.css">
    <script src="js/script.js" defer></script>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trading Platform</title>
    
</head>

<body>
    <div class="header">
        <div class="left-buttons">
            <a href="deposit.php" class="deposit-btn" id="depositBtn">DEPOSIT</a>
            <a href="withdraw.php" class="withdraw-btn">WITHDRAW</a>
        </div>
        <div class="profile-section" id="profile">
            <div class="profile-icon">👤</div>
            <div class="username"><?php echo $_SESSION["username"]; ?></div>
            <div class="profile-menu" id="profileMenu">
                <a href="#" id="logoutLink">Logout</a>
            </div>
        </div>
    </div>

    <div class="main-container">
        <div class="assets-sidebar">
            <div class="section-title" style="grid-column: 1 / span 2;">CRYPTO</div>
            <div class="asset-item" onclick="selectAsset('BTC', '₿')">
                <div class="asset-icon">
                    <img src="/images/bitcoin.png" alt="icona_bitcoin">
                </div>
                <div class="asset-name">BITCOIN</div>
            </div>
            <div class="asset-item" onclick="selectAsset('ETH', 'Ξ')">
                <div class="asset-icon">
                    <img src="/images/ethereum.png" alt="icona_ethereum">
                </div>
                <div class="asset-name">ETHEREUM</div>
            </div>
            <div class="asset-item" onclick="selectAsset('ADA', '₳')">
                <div class="asset-icon">
                    <img src="/images/cardano.png" alt="icona_cardano">
                </div>
                <div class="asset-name">CARDANO</div>
            </div>
            <div class="asset-item" onclick="selectAsset('DOT', '●')">
                <div class="asset-icon">
                    <img src="/images/polkadot.png" alt="icona_polkadot">
                </div>
                <div class="asset-name">POLKADOT</div>
            </div>
            <div class="asset-item" onclick="selectAsset('SOL', '◎')">
                <div class="asset-icon">
                    <img src="/images/solana.png" alt="icona_solana">
                </div>
                <div class="asset-name">SOLANA</div>
            </div>
            <div class="asset-item" onclick="selectAsset('XRP', '✕')">
                <div class="asset-icon">
                    <img src="/images/ripple.png" alt="icona_ripple">
                </div>
                <div class="asset-name">RIPPLE</div>
            </div>

            <div class="section-title" style="grid-column: 1 / span 2; margin-top: 20px;">AZIONI</div>
            <div class="asset-item" onclick="selectAsset('AAPL', '')">
                <div class="asset-icon">
                    <img src="/images/apple.png" alt="icona_apple">
                </div>
                <div class="asset-name">APPLE</div>
            </div>
            <div class="asset-item" onclick="selectAsset('TSLA', '⚡')">
                <div class="asset-icon">
                    <img src="/images/tesla.png" alt="icona_tesla">
                </div>
                <div class="asset-name">TESLA</div>
            </div>
            <div class="asset-item" onclick="selectAsset('MSFT', '')">
                <div class="asset-icon">
                    <img src="/images/microsoft.png" alt="icona_microsoft">
                </div>
                <div class="asset-name">MICROSOFT</div>
            </div>
            <div class="asset-item" onclick="selectAsset('AMZN', '📦')">
                <div class="asset-icon">
                    <img src="/images/amazon.png" alt="icona_amazon">
                </div>
                <div class="asset-name">AMAZON</div>
            </div>
            <div class="asset-item" onclick="selectAsset('GOOGL', 'G')">
                <div class="asset-icon">
                    <img src="/images/google.png" alt="icona_google">
                </div>
                <div class="asset-name">GOOGLE</div>
            </div>
            <div class="asset-item" onclick="selectAsset('META', 'f')">
                <div class="asset-icon">
                    <img src="/images/meta.png" alt="icona_meta">
                </div>
                <div class="asset-name">META</div>
            </div>
        </div>

        <div class="trading-container">
            <div class="selected-asset">
                <div class="selected-icon" id="selectedIcon">
                    <img id="selectedImage" src="images/bitcoin.png" alt="selected asset">
                </div>
                <div class="selected-name" id="selectedName">BITCOIN</div>
            </div>

            <canvas id="priceCanvas"></canvas>
            <canvas id="tradingGrid"></canvas>
            <div class="overlay" id="info" style="position: absolute; right: 40px; top: 40px; background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 6px; color: white; font-size: 13px; z-index: 3;">price: -</div>

            <div class="bottom-section">
                <div class="balance-section">
                    <div class="balance-label">SALDO ATTUALE</div>
                    <div class="balance-amount" id="balanceAmount">chf <?php echo number_format($saldo, 2, ',', '.'); ?></div>
                </div>

                <div class="trade-panel">
                    <div><div class="label">ASK</div><div class="value" id="askPrice">-</div></div>
                    <div><div class="label">BID</div><div class="value" id="bidPrice">-</div></div>
                    <div><div class="label">QTY</div><input id="qty" type="number" min="0" step="0.0001" value="1"></div>
                    <div><div class="label">HOLDINGS</div><div class="value" id="holdings">0.0000</div></div>
                    <div><div class="label">AVG COST</div><div class="value" id="avgCost">-</div></div>
                    <div><div class="label">P/L</div><div class="value" id="unrealized">0.00</div></div>
                </div>
                <div class="trade-panel" style="margin-top:10px;">
                    <div><div class="label">STOP LOSS</div><input id="slPrice" type="number" step="0.01" placeholder="price"></div>
                    <div><div class="label">TAKE PROFIT</div><input id="tpPrice" type="number" step="0.01" placeholder="price"></div>
                    <button class="buy-btn" style="padding:10px 16px;" onclick="saveStops()">Save SL/TP</button>
                    <button class="sell-btn" style="padding:10px 16px;" onclick="clearStops()">Clear</button>
                </div>

                <div class="trade-buttons">
                    <button class="buy-btn" onclick="trade('buy')">BUY</button>
                    <button class="sell-btn" onclick="trade('sell')">SELL</button>
                </div>
            </div>
        </div>
    </div>
    <script>
    // Inizializza la variabile del saldo JavaScript recuperando il valore numerico dal database tramite PHP
    let portfolioCHF = <?php echo json_encode((float)$saldo); ?>;
    </script>
   
</body>
</html>