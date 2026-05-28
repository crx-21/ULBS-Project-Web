<?php
session_start(); 
ini_set('display_errors', 1); //Debugging.
error_reporting(E_ALL);

require_once 'database.php'; 
require_once 'models.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}



$userModel = new User($conn);

$inputData = json_decode(file_get_contents("php://input"), true);

$request = $inputData['action'] ?? $_REQUEST['action'] ?? '';

switch ($request) {
    case 'Register':
        
        $username = $inputData['username'] ?? '';
        $password = $inputData['password'] ?? '';
        $email    = $inputData['email']    ?? '';
        $role     = $inputData['role']     ?? '';

        $res = $userModel->Register($username, $password, $email, $role);
        
        
        if ($res) {
            echo json_encode(["success" => true, "message" => "Registration successful"]);
        } else {
            http_response_code(400); // Bad Request status
            echo json_encode(["success" => false, "message" => "Registration failed"]);
        }
        exit;

    case 'Login':
        $username = $inputData['username'] ?? '';
        $password = $inputData['password'] ?? '';

        $user = $userModel->Login($username, $password);
        
        if ($user) {
            $_SESSION['user_id'] = $user['userId']; 
            $_SESSION['username'] = $user['username'];
            
        
            echo json_encode([
                "success" => true, 
                "message" => "Login successful",
                "user" => [
                    "id" => $user['userId'],
                    "username" => $user['username']
                ]
            ]);
        } else {
            http_response_code(401); 
            echo json_encode(["success" => false, "message" => "Invalid username or password"]);
        }
        exit;
        
    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Invalid Action"]);
        exit;
}
?>

