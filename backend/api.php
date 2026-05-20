<?php
function create_account()
{
    $username = $_POST['username'];
    $password = $_POST['password'];
    $user = new User();
    $user->username = $username;
    $user->password = $password;
    return $user;
}

function login()
{
    $username = $_POST['username'];
    $password = $_POST['password'];
    if($user->password == $password)
    {
        echo "<a href='index.html'>Login successful</a>";
    }
    else
    {
        echo "<p>Login failed</p>";
    }
    
}

?>