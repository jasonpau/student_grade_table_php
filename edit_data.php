<?php

error_reporting(0);

$output = [
  'success' => false
];

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted data, trim leading/trailing whitespace, sanitize, and store in variables for easy access
$id = filter_var(trim ($_POST['id']), FILTER_SANITIZE_NUMBER_INT);
$name = filter_var(trim ($_POST['name']), FILTER_SANITIZE_STRING);
$course = filter_var(trim ($_POST['course']), FILTER_SANITIZE_STRING);
$grade = filter_var(trim ($_POST['grade']), FILTER_SANITIZE_NUMBER_INT);

// if the id and/or grade are NOT numbers, throw an error and exit
if (!is_numeric($id) || !is_numeric($grade)) {
  $output['message'] = 'Unable to update: one or more fields contain incorrect data types.';
  print(json_encode($output));
  exit();
}

// if the grade is not within the 0 - 100 range, throw an error and exit
if ($grade > 100 || $grade < 0) {
  $output['message'] = 'Unable to update: grade must be between 0 and 100.';
  print(json_encode($output));
  exit();
}

$statement = $conn->prepare("UPDATE grades SET name=?,course=?,grade=? WHERE id=?");
$statement->bind_param("ssii", $name, $course, $grade, $id);
$statement->execute();

// if the query actually caused a change, update the output array
if (mysqli_affected_rows($conn)) {
  $output['message'] = "Successfully updated row id: $id";
  $output['success'] = true;
} else {
  $output['message'] = 'Unable to update data.';
}

$statement->close();
$conn->close();

sleep(1);
print(json_encode($output));

?>