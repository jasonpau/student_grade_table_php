<?php

error_reporting(0);

$output = [
  'success' => false
];

require_once('../mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted id, convert it to an integer (or 0 if it is unable)
$id = filter_var($_POST['id'], FILTER_SANITIZE_NUMBER_FLOAT);

// if id is NOT a number, throw an error and exit
if (!is_numeric($id)) {
  $output['message'] = 'Unable to delete: id is not a number.';
  print(json_encode($output));
  exit();
}

$statement = $conn->prepare("DELETE FROM grades WHERE id=?");
$statement->bind_param("i", $id);
$statement->execute();

if (mysqli_affected_rows($conn)) {
  $output['message'] = "Successfully deleted row id: $id";
  $output['success'] = true;
} else {
  $output['message'] = 'Unable to delete student.';
}

sleep(1);
print(json_encode($output));

?>