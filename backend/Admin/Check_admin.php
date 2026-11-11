<?php

//Start Session
if(session_status() === PHP_SESSION_NONE) session_start();

//Check if user is admin
if(!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '')
    !== 'admin')
{

  http_response_code(403);
  exit(json_encode(["error" => "Forbidden"]));

}