<?php

error_reporting(0);

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted data, trim leading/trailing whitespace, sanitize, and store in variables for easy access
$id = filter_var(trim ($_POST['studentId']), FILTER_SANITIZE_NUMBER_INT);
$name = filter_var(trim ($_POST['name']), FILTER_SANITIZE_STRING);
$course = filter_var(trim ($_POST['course']), FILTER_SANITIZE_STRING);
$grade = filter_var(trim ($_POST['grade']), FILTER_SANITIZE_NUMBER_INT);

$query = "UPDATE grades SET name='$name',course='$course',grade='$grade' WHERE id='$id'";

$result = mysqli_query($conn, $query);

$output = [
  'success' => false
];

// if the query actually caused a change, update the output array
if (mysqli_affected_rows($conn)) {
  $output['message'] = "Successfully updated row id: $id";
  $output['success'] = true;
} else {
  $output['message'] = 'Unable to update data.';
}

sleep(1);
print(json_encode($output));

?>