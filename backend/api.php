<?php
session_start();
ini_set('display_errors', 1); //Debugging.
error_reporting(E_ALL);

require_once 'database.php';
require_once 'models.php';
require_once 'auth_session.php';

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

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Password must be at least 6 characters."
            ]);
            exit;
        }

        $res = $userModel->Register($username, $password, $email, $role);

        if (!$res) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Registration failed"]);
            exit;
        }

        $user = $userModel->Login($username, $password);

        if (!$user) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Account created but sign-in failed. Please log in manually."
            ]);
            exit;
        }

        auth_set_user_session($user);
        echo json_encode(auth_json_logged_in('Registration successful'));
        exit;

    case 'Login':
        $username = $inputData['username'] ?? '';
        $password = $inputData['password'] ?? '';
        $user = $userModel->Login($username, $password);
        if ($user) {
            auth_set_user_session($user);
            echo json_encode(auth_json_logged_in('Login successful'));
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid username or password"]);
        }

        exit;

    case 'Session':
        if (auth_is_logged_in()) {
            echo json_encode(auth_json_logged_in('Session active'));
        } else {
            echo json_encode([
                "success" => true,
                "logged_in" => false,
                "session_id" => null,
            ]);
        }
        exit;

    case 'Logout':
        auth_clear_session();
        echo json_encode(["success" => true, "message" => "Logged out"]);
        exit;

    case 'SetRole':
        if (!auth_is_logged_in()) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Unauthorized. Please log in first."]);
            exit;
        }

        $role = $inputData['role'] ?? '';

        // Validate the role
        $validRoles = ['tenant', 'landlord'];
        if (!in_array($role, $validRoles)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid role selected."]);
            exit;
        }

        // --- LOOK EVERYWHERE FOR THE USER ID ---
        // This checks both root level $_SESSION and nested $_SESSION['user']
        $userId = $_SESSION['userId'] 
               ?? $_SESSION['user_id'] 
               ?? null;

        if (!$userId) {
            http_response_code(500);
            echo json_encode([
                "success" => false, 
                "message" => "User ID not found anywhere in session.",
                "debug_session_root" => $_SESSION // Let's see the entire root if it still fails
            ]);
            exit;
        }

        // Update the role in the database (Now using your clean PDO method!)
        $success = $userModel->updateRole($userId, $role);

        if ($success) {
            // Update the session in both possible configurations so the app updates immediately
            if (isset($_SESSION['role'])) {
                $_SESSION['role'] = $role;
            }
            if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
                $_SESSION['user']['role'] = $role;
            }
            
            echo json_encode(["success" => true, "message" => "Role updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update role in the database."]);
        }
        exit;

    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Invalid Action"]);
        exit;

}



?>


