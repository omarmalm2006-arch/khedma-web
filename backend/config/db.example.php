
<?php

$host = "YOUR_HOST";
$port = "YOUR_PORT";
$dbname = "YOUR_DATABASE_NAME";
$username = "YOUR_USERNAME";
$password = "YOUR_PASSWORD";

$sslCert = __DIR__ . "/ca.pem";

try {

    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";

    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_SSL_CA => $sslCert,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true
        ]
    );
} catch (PDOException $e) {

    error_log($e->getMessage());

    http_response_code(500);

    exit("Database connection failed.");
}
