<?php

// Database connection
require_once __DIR__ . "/../config/db.php";

// Check admin authentication
require_once __DIR__ . '/check_admin.php';

// Response type
header("Content-Type: application/json; charset=UTF-8");

// Get status filter
$statues = $_GET['statues'] ?? 'pending' ;

// Validate status
if(!in_array ($statues, ['pending', 'approved', 'rejected']))
    {

      http_response_code(400);

      exit(json_encode(["error" => "Invalid status"]));

    }

 // Fetch worker profiles by status 
$stmt = $pdo->prepare
(
    "SELECT wp.id, wp.user_id, u.full_name, u.email, u.phone,
            c.name AS category, wp.location, wp.experience_years,
            wp.approval_status, wp.admin_note, wp.created_at
     FROM worker_profiles wp
     JOIN users u ON u.id = wp.user_id
     LEFT JOIN categories c ON c.id = wp.category_id
     WHERE wp.approval_status = ?
     ORDER BY wp.created_at DESC

 ");

// Execute query and return JSON response
    $stmt->execute([$statues]);
    echo json_encode($stmt->fetchAll());