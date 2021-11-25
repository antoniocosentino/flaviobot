<?php

$data = json_decode(file_get_contents('php://input'));

if ( !$data ) {
    
    $storedChart = file_get_contents('data.json');

    echo $storedChart;

    exit;
}

if ( !is_array( $data->results ) ) {
    echo "Data is not formatted correctly";
    exit;
}

$contentForFile = json_encode( $data );

try {
    $jsonFile = fopen( 'data.json', 'w' );
    fwrite( $jsonFile, $contentForFile );
    fclose( $jsonFile );
    echo "File was saved";
} catch (Exception $e) {
    echo 'Error while saving the file: ',  $e->getMessage(), "\n";
}

?>