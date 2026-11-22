
<?php

//declare(strict_types=1);

session_start();

header("Content-Type: application/json; charset=UTF-8");

// Standard JSON response
function respond(int $statusCode, string $message): void
{
    http_response_code($statusCode);

    echo json_encode([
        "success" => $statusCode >= 200 && $statusCode < 300,
        "message" => $message
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Only POST requests are allowed
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    respond(405, "Method not allowed.");
}

// Check whether the user is logged in
if (empty($_SESSION["logged_in"])) {
    respond(401, "You are not logged in.");
}

// Get CSRF token from request
$csrfToken = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? $_POST["csrf_token"] ?? "";

if (
    !is_string($csrfToken) ||
    !isset($_SESSION["csrf_token"]) ||
    !hash_equals($_SESSION["csrf_token"], $csrfToken)
) {
    respond(403, "Invalid CSRF token.");
}

// Clear all session data
$_SESSION = [];

// Delete the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();

    setcookie(session_name(), "", [
        "expires" => time() - 42000,
        "path" => $params["path"],
        "domain" => $params["domain"],
        "secure" => $params["secure"],
        "httponly" => $params["httponly"],
        "samesite" => $params["samesite"] ?? "Lax"
    ]);
}

// Destroy the session
session_destroy();

respond(200, "Logged out successfully.");
