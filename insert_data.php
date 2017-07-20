<?php

error_reporting(0);

$output = [
  'success' => false
];

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted data and store in variables for easy access
$name = $_POST['name'];
$course = $_POST['course'];
$grade = $_POST['grade'];

$query = "
INSERT INTO grades (name, course, grade)
   VALUES
   ('$name', '$course', '$grade')";

$result = mysqli_query($conn, $query);

if (mysqli_affected_rows($conn)) {
  $output['message'] = 'Data added to database!';
  $output['new_id'] = mysqli_insert_id($conn);
  $output['success'] = true;
} else {
  $output['error'] = 'Unable to insert data.';
}

sleep(1);
print(json_encode($output));

?>