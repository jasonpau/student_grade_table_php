<?php

error_reporting(0);

$output = [
  'success' => false
];

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

// grab the submitted data, trim leading/trailing whitespace, sanitize, and store in variables for easy access
$name = filter_var(trim ($_POST['name']), FILTER_SANITIZE_STRING);
$course = filter_var(trim ($_POST['course']), FILTER_SANITIZE_STRING);
$grade = filter_var(trim ($_POST['grade']), FILTER_SANITIZE_NUMBER_INT);

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
  $output['message'] = 'Unable to insert data.';
}

sleep(1);
print(json_encode($output));

?>