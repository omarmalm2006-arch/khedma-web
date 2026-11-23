
<?php

//declare(strict_types=1);

session_start();

header("Content-Type: application/json; charset=UTF-8");

// Generate a token if one doesn't exist
if (
    !isset($_SESSION["csrf_token"]) ||
    !is_string($_SESSION["csrf_token"])
) {
    $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
}

// Return the token to the frontend
echo json_encode([
    "success" => true,
    "csrf_token" => $_SESSION["csrf_token"]
], JSON_UNESCAPED_UNICODE);
