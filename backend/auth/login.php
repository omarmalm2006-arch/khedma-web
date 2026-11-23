
<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/db.php";

// Helper function for JSON responses
function respond(
    int $status,
    string $message,
    array $data = []
): void {

    http_response_code($status);

    echo json_encode(
        array_merge([
            "success" => $status >= 200 && $status < 300,
            "message" => $message
        ], $data),
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// Allow POST requests only
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, "Method not allowed");
}

// Get JSON input
$input = json_decode(
    file_get_contents("php://input"),
    true
);

// Validate JSON
if (!is_array($input)) {
    respond(400, "Invalid JSON data");
}

// Get email and password
$email = trim($input["email"] ?? "");
$password = $input["password"] ?? "";

// Validate required fields
if ($email === "" || $password === "") {
    respond(400, "Email and password are required");
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, "Invalid email format");
}

try {

    // Find user by email
    $sql = "SELECT
                id,
                full_name,
                email,
                phone,
                password_hash,
                role,
                account_status
            FROM users
            WHERE email = :email
            LIMIT 1";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":email" => $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check user and password
    if (!$user || !password_verify($password, $user["password_hash"])) {
        respond(401, "Invalid email or password");
    }

    // Check account status
    if ($user["account_status"] !== "active") {
        respond(403, "Your account is not active");
    }

    // Default approval status
    $approvalStatus = null;

    // If user is a worker, get approval status
    if ($user["role"] === "worker") {

        $statusSql = "SELECT approval_status
                      FROM worker_profiles
                      WHERE user_id = :user_id
                      LIMIT 1";

        $statusStmt = $pdo->prepare($statusSql);

        $statusStmt->execute([
            ":user_id" => $user["id"]
        ]);

        $workerProfile = $statusStmt->fetch(PDO::FETCH_ASSOC);

        // Worker must have a profile
        if (!$workerProfile) {
            respond(403, "Worker profile not found");
        }

        $approvalStatus = $workerProfile["approval_status"];
    }

    // Prevent session fixation
    session_regenerate_id(true);

    // Store user information in session
    $_SESSION["user_id"] = $user["id"];
    $_SESSION["user_role"] = $user["role"];
    $_SESSION["user_name"] = $user["full_name"];
    $_SESSION["logged_in"] = true;

    // Remove sensitive information
    unset($user["password_hash"]);
    unset($user["account_status"]);

    // Successful login
    respond(200, "Login successful", [
        "user" => $user,
        "approval_status" => $approvalStatus
    ]);
} catch (PDOException $e) {

    error_log("Login Database Error: " . $e->getMessage());

    respond(500, "Something went wrong. Please try again later.");
}
