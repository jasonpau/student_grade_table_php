<?php

error_reporting(0);

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted data and store in variables for easy access
$id = $_POST['student_id'];
$name = $_POST['name'];
$course = $_POST['course'];
$grade = $_POST['grade'];

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
  $output['error'] = 'Unable to update data.';
}

sleep(1);
print(json_encode($output));

?>