*/
Actual database configuration file used for PDO connection.
/*

<?php
$host = "127.0.0.1";
$port = "1037";
$username = "root";
$password = '';
$dbname = "rental_platform";

try {
  $conn = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
  // set the PDO error mode to exception
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
  die("Connection failed: " . $e->getMessage());
}

?>