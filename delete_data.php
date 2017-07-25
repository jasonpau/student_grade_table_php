<?php

error_reporting(0);

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted id, convert it to an integer (or 0 if it is unable)
$id = filter_var($_POST['studentId'], FILTER_SANITIZE_NUMBER_FLOAT);

$query = "DELETE FROM grades WHERE id = $id";

$result = mysqli_query($conn, $query);

$output = [
  'success' => false
];

if (mysqli_affected_rows($conn)) {
  $output['message'] = "Successfully deleted row id: $id";
  $output['success'] = true;
} else {
  $output['message'] = 'Unable to delete student.';
}

sleep(1);
print(json_encode($output));

?>