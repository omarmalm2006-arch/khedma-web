
<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate");

function sendResponse($statusCode, $data)
{
    http_response_code($statusCode);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

// 1. Check HTTP method
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    sendResponse(405, [
        "success" => false,
        "message" => "Method not allowed."
    ]);
}

// 2. Check login session
if (
    empty($_SESSION["logged_in"]) ||
    empty($_SESSION["user_id"])
) {
    sendResponse(401, [
        "success" => false,
        "message" => "You must login first."
    ]);
}

// 3. Check user role
if (($_SESSION["user_role"] ?? null) !== "worker") {
    sendResponse(403, [
        "success" => false,
        "message" => "Access denied. Workers only."
    ]);
}

// 4. Connect to database
require_once __DIR__ . "/../config/db.php";

try {

    // 5. Get logged-in worker data
    $sql = "
        SELECT
            wp.id AS profile_id,
            wp.approval_status,
            wp.location,
            wp.address_details,
            wp.experience_years,
            wp.starting_price,
            wp.admin_note,
            wp.created_at,

            u.full_name,
            u.phone,

            c.name AS category_name

        FROM worker_profiles wp

        INNER JOIN users u
            ON wp.user_id = u.id

        INNER JOIN categories c
            ON wp.category_id = c.id

        WHERE wp.user_id = :user_id

        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $_SESSION["user_id"]
    ]);

    $worker = $stmt->fetch();

    // 6. Check if worker profile exists
    if (!$worker) {
        sendResponse(404, [
            "success" => false,
            "message" => "Worker profile not found."
        ]);
    }

    // 7. Return worker request data
    sendResponse(200, [
        "success" => true,
        "data" => [
            "request_number" => "REQ-" . $worker["profile_id"],
            "status" => $worker["approval_status"],

            "name" => $worker["full_name"],
            "job" => $worker["category_name"],
            "phone" => $worker["phone"],

            "location" => $worker["location"],
            "address_details" => $worker["address_details"],

            "experience_years" => $worker["experience_years"],
            "starting_price" => $worker["starting_price"],

            "admin_note" => $worker["admin_note"],
            "created_at" => $worker["created_at"]
        ]
    ]);
} catch (PDOException $e) {

    error_log($e->getMessage());

    sendResponse(500, [
        "success" => false,
        "message" => "Internal server error."
    ]);
}
