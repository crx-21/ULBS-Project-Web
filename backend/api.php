<?php
session_start(); 
ini_set('display_errors', 1); //Debugging.
error_reporting(E_ALL);

require_once 'database.php'; 
require_once 'models.php';



$userModel = new User($conn);

$request = $_REQUEST['action'] ?? '';

switch ($request) {
    case 'Register':
        $res = $userModel->Register($_POST['username'], $_POST['password'],$_POST['email'],$_POST['role']);
        
        
        if ($res) {
            header("Location: ../frontend/login.html");
        } else {
            header("Location: ../frontend/register.html?error=failed");
        }
        exit;

    case 'Login':
        $user = $userModel->Login($_POST['username'], $_POST['password']);
        
       
        if ($user) {
            
            $_SESSION['user_id'] = $user['userId']; 
            $_SESSION['username'] = $user['username'];
            
            header("Location: ../frontend/frontPage.html");
        } else {
            
            header("Location: ../frontend/login.html?error=invalidcredentials");
        }
        exit;
        
    default:
        
        header("Location: ../frontend/login.html");
        exit;
}
?>