
<?php

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

// 1. Allow POST requests only

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, "Method not allowed.");
}

// 2. Get raw input data

$raw = [
    "full_name" => $_POST["full_name"] ?? "",
    "email" => $_POST["email"] ?? "",
    "phone" => $_POST["phone"] ?? "",
    "password" => $_POST["password"] ?? "",
    "confirm_password" => $_POST["confirm_password"] ?? "",
    "role" => $_POST["role"] ?? "customer",

    "category_id" => $_POST["category_id"] ?? "",
    "location" => $_POST["location"] ?? "",
    "experience_years" => $_POST["experience_years"] ?? "0",
    "national_id" => $_POST["national_id"] ?? "",
    "bio" => $_POST["bio"] ?? "",
    "starting_price" => $_POST["starting_price"] ?? ""
];

// Validate input types

foreach ($raw as $value) {

    if (!is_string($value)) {
        respond(422, "Invalid input data.");
    }
}

// Clean input data

$fullName = trim($raw["full_name"]);
$email = strtolower(trim($raw["email"]));
$phone = trim($raw["phone"]);

$password = $raw["password"];
$confirmPassword = $raw["confirm_password"];

$role = $raw["role"];

$categoryId = $raw["category_id"];
$location = trim($raw["location"]);
$experience = $raw["experience_years"];

$nationalId = trim($raw["national_id"]);
$bio = trim($raw["bio"]);

$startingPrice = $raw["starting_price"];

// 3. Validate basic required fields

if (
    $fullName === "" ||
    $email === "" ||
    $phone === "" ||
    $password === "" ||
    $confirmPassword === ""
) {
    respond(422, "Please fill in all required fields.");
}

// Full name validation

if (
    mb_strlen($fullName) < 3 ||
    mb_strlen($fullName) > 120
) {
    respond(422, "Name must be between 3 and 120 characters.");
}

// Email validation

if (
    strlen($email) > 190 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    respond(422, "Please enter a valid email address.");
}

// Phone validation

if (!preg_match('/^\+?[0-9]{10,15}$/D', $phone)) {
    respond(422, "Please enter a valid phone number.");
}

// Password validation

if (strlen($password) < 8) {
    respond(422, "Password must be at least 8 characters.");
}

if (
    !preg_match('/[A-Za-z]/', $password) ||
    !preg_match('/[0-9]/', $password)
) {
    respond(422, "Password must contain letters and numbers.");
}

// Confirm password

if ($password !== $confirmPassword) {
    respond(422, "Passwords do not match.");
}

// 4. Validate role
// Public registration cannot create admin accounts.

if (!in_array($role, ["customer", "worker"], true)) {
    respond(422, "Invalid account type.");
}

// 5. Validate worker information

if ($role === "worker") {

    // Category validation

    if (
        !ctype_digit($categoryId) ||
        (int)$categoryId < 1
    ) {
        respond(422, "Please select a valid service category.");
    }

    // Location validation

    if (
        $location === "" ||
        mb_strlen($location) > 120
    ) {
        respond(422, "Please enter your location.");
    }

    // Experience validation

    if (
        !ctype_digit($experience) ||
        (int)$experience > 80
    ) {
        respond(422, "Invalid experience years.");
    }

    // Egyptian National ID validation

    if ($nationalId === "") {
        respond(422, "National ID is required for workers.");
    }

    if (!preg_match('/^[0-9]{14}$/D', $nationalId)) {
        respond(
            422,
            "National ID must contain exactly 14 digits."
        );
    }

    // Bio validation

    if (mb_strlen($bio) > 10000) {
        respond(422, "Bio is too long.");
    }

    // Starting price validation

    if ($startingPrice !== "") {

        if (
            !is_numeric($startingPrice) ||
            !is_finite((float)$startingPrice) ||
            (float)$startingPrice < 0 ||
            (float)$startingPrice > 99999999.99
        ) {
            respond(422, "Invalid starting price.");
        }
    }
}

// 6. Hash password

$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

if ($passwordHash === false) {
    respond(500, "Could not secure the password.");
}

// 7. Database operations

$db = null;

try {

    // Reuse PDO connection from db.php

    $db = $pdo;

    // Start transaction

    $db->beginTransaction();

    // 8. Check worker category

    if ($role === "worker") {

        $categoryQuery = "
            SELECT id
            FROM categories
            WHERE id = :category_id
              AND is_active = 1
            LIMIT 1
        ";

        $categoryStmt = $db->prepare($categoryQuery);

        $categoryStmt->execute([
            ":category_id" => (int)$categoryId
        ]);

        if (!$categoryStmt->fetch()) {

            $db->rollBack();

            respond(422, "Selected category is not available.");
        }
    }

    // 9. Insert user

    $userQuery = "
        INSERT INTO users
        (
            full_name,
            email,
            phone,
            password_hash,
            role
        )
        VALUES
        (
            :full_name,
            :email,
            :phone,
            :password_hash,
            :role
        )
    ";

    $userStmt = $db->prepare($userQuery);

    $userStmt->execute([
        ":full_name" => $fullName,
        ":email" => $email,
        ":phone" => $phone,
        ":password_hash" => $passwordHash,
        ":role" => $role
    ]);

    // Get new user ID

    $userId = (int)$db->lastInsertId();

    // 10. Insert worker profile

    if ($role === "worker") {

        $workerQuery = "
            INSERT INTO worker_profiles
            (
                user_id,
                category_id,
                national_id,
                location,
                experience_years,
                bio,
                starting_price
            )
            VALUES
            (
                :user_id,
                :category_id,
                :national_id,
                :location,
                :experience_years,
                :bio,
                :starting_price
            )
        ";

        $workerStmt = $db->prepare($workerQuery);

        $workerStmt->execute([
            ":user_id" => $userId,
            ":category_id" => (int)$categoryId,
            ":national_id" => $nationalId,
            ":location" => $location,
            ":experience_years" => (int)$experience,
            ":bio" => $bio === "" ? null : $bio,
            ":starting_price" => $startingPrice === ""
                ? null
                : $startingPrice
        ]);
    }

    // 11. Commit transaction

    $db->commit();

    // 12. Success response

    respond(201, "Account created successfully.", [

        "user" => [
            "id" => $userId,
            "full_name" => $fullName,
            "email" => $email,
            "role" => $role
        ],

        "approval_status" => $role === "worker"
            ? "pending"
            : null

    ]);
} catch (PDOException $e) {

    // Rollback transaction if needed

    if ($db !== null && $db->inTransaction()) {
        $db->rollBack();
    }

    // Duplicate entry

    if (
        $e->getCode() === "23000" &&
        isset($e->errorInfo[1]) &&
        (int)$e->errorInfo[1] === 1062
    ) {

        respond(
            409,
            "Email, phone, or national ID is already registered."
        );
    }

    error_log($e->getMessage());

    respond(500, "Something went wrong. Please try again.");
} catch (Throwable $e) {

    if ($db !== null && $db->inTransaction()) {
        $db->rollBack();
    }

    error_log($e->getMessage());

    respond(500, "Something went wrong. Please try again.");
}
