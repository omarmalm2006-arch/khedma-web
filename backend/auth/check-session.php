    <?php

    session_start();

    header("Content-Type: application/json; charset=UTF-8");

    echo json_encode([
        "logged_in" => $_SESSION["logged_in"] ?? false,
        "user_id" => $_SESSION["user_id"] ?? null,
        "user_role" => $_SESSION["user_role"] ?? null,
        "user_name" => $_SESSION["user_name"] ?? null
    ], JSON_PRETTY_PRINT);
