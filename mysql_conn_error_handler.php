<?php

// check if our database connection was successful
if (!$conn) {
  $output['message'] = "Unable to establish a database connection.";

  // print the error for the front-end to deal with, then and exit
  print(json_encode($output));
  exit;
}

?>