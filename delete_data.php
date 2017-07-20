<?php

error_reporting(0);

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted id and store in a variable for easy access
$id = $_POST['student_id'];

$query = "DELETE FROM grades WHERE id = $id";

$result = mysqli_query($conn, $query);

$output = [
  'success' => false
];

if (mysqli_affected_rows($conn)) {
  $output['message'] = "Successfully deleted row id: $id";
  $output['success'] = true;
} else {
  $output['error'] = 'Unable to delete data.';
}

sleep(1);
print(json_encode($output));

?>