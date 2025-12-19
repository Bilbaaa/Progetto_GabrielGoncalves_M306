<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registrazione</title>
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
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .register-container {
            background-color: black;
            border-radius: 20px;
            padding: 40px 30px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .register-form h2 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 24px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            color: white;
            margin-bottom: 8px;
            font-weight: bold;
        }

        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #333;
            border-radius: 10px;
            background-color: #1a1a1a;
            color: white;
            font-size: 16px;
            outline: none;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus {
            border-color: #555;
        }

        .submit-btn {
            width: 100%;
            padding: 12px;
            background-color: #333;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s ease;
            margin-top: 10px;
        }

        .submit-btn:hover {
            background-color: #555;
        }

        .login-link {
            text-align: center;
            margin-top: 20px;
        }

        .login-link p {
            color: #ccc;
            margin-bottom: 5px;
        }

        .login-link a {
            color: white;
            text-decoration: none;
            font-weight: bold;
        }

        .login-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>
    <div class="register-container">
        <form class="register-form" action="register.php" method="POST">
            <h2>REGISTRATI</h2>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" name="email" id="email" required>
            </div>

            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" name="username" id="username" required>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" name="password" id="password" required>
            </div>

            <button type="submit" class="submit-btn">INVIA</button>
            
            <div class="login-link">
                <p>Hai già un account?</p>
                <a href="login.html">Accedi</a>
            </div>
        </form>
    </div>
</body>
</html>