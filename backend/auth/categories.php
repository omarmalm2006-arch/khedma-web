
<?php

// declare(strict_types=1);

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

// Allow GET requests only
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    respond(405, "Method not allowed.");
}

try {

    // Get only active categories
    $query = "
        SELECT
            id,
            name,
            slug,
            description
        FROM categories
        WHERE is_active = 1
        ORDER BY name ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();

    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return categories
    respond(200, "Categories retrieved successfully.", [
        "categories" => $categories
    ]);
} catch (PDOException $e) {

    error_log($e->getMessage());

    respond(500, "Could not retrieve categories.");
} catch (Throwable $e) {

    error_log($e->getMessage());

    respond(500, "Something went wrong. Please try again.");
}
