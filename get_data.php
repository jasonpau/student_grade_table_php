<?php

error_reporting(0);

$output = [
  'success' => false
];

require_once('mysql_connect.php');
require_once('mysql_conn_error_handler.php');

$query = "
SELECT 
  g.id AS id, 
  g.name AS name, 
  g.course AS course, 
  g.grade AS grade
FROM grades AS g";

$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) > 0) {
  while ($row = mysqli_fetch_assoc($result)) {
    $output['data'][] = $row;
  }
  $output['message'] = 'Data received from database!';
  $output['success'] = true;
} else {
  $output['message'] = 'No students in database.';
  $output['success'] = true;
}

print(json_encode($output));

?>