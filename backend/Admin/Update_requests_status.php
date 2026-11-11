<?php

// Response type
header("Content-Type: application/json; charset=UTF-8");


session_start();
$_SESSION['user_id'] =1;

//Database connection 
require_once __DIR__ . "/../config/db.php";

// Check admin authentication
require_once __DIR__ . '/check_admin.php';


// Get request parameters
$id = $_POST['id'] ?? null; 
$decision = $_POST['decision'] ?? null;
$note = $_POST['note'] ?? null;

//validate input data
if(!$id || !in_array($decision, ['approved', 'rejected']))
    {

        http_response_code(400);
        exit(json_encode(["error" => "Invalid data"]));

    }
 try
    {

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT user_id FROM worker_profiles WHERE id = ?");
        $stmt->execute([$id]);
        $profile = $stmt->fetch();
        if(!$profile){
            $pdo->rollBack();
            http_response_code(404);
            exit (json_encode(["error" => "Not Found"]));

        }


        //update worker status
        $pdo->prepare("UPDATE worker_profiles
                        SET approval_status = ?, admin_note = ?, reviewed_by = ?, 
                            reviewed_at = NOW() 
                        WHERE id = ?")
             ->execute([$decision, $note, $_SESSION['user_id'], $id]);
             

        //insert review log
        $pdo->prepare("INSERT INTO worker_application_reviews
                         (worker_id, admin_id, decision, note )
                         VALUES (?, ?, ?, ?)")
             ->execute([$profile['user_id'], $_SESSION['user_id'], $decision, $note]);
        $pdo->commit();
        echo json_encode(["success" => true]);
    }   


    //handle database error
catch(Exception $e)
    {

        $pdo->rollBack();
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Server error"]);

    }