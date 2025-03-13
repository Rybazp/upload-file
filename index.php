<?php

$tempDir = 'temp/';
$uploadFile = 'upload/';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    fileUpload();
    exit;
}

include 'index.html';

function fileUpload() {
    global $tempDir, $uploadFile;

    $fileName = $_POST['fileName'];
    $fileChunk = $_FILES['fileChunk'];
    $currentChunk = (int)$_POST['currentChunk'];
    $totalChunks = (int)$_POST['totalChunks'];

    if (file_exists($uploadFile . $fileName)) {
        echo 'the file has already been downloaded';
        exit;
    }

    $chunkFileName = $tempDir . $fileName . '.part' . $currentChunk;

    if (!file_exists($chunkFileName)) {
        move_uploaded_file($fileChunk['tmp_name'], $chunkFileName);
        echo 'success';
    } else {
        echo 'chunk exists';
    }

    if ($currentChunk === $totalChunks - 1) {
        mergeChunks($fileName, $totalChunks, $tempDir, $uploadFile);
    }
}

function mergeChunks($fileName, $totalChunks, $tempDir, $uploadFile)
{
    $filePath = $uploadFile . $fileName;
    $file = fopen($filePath, "wb");

    for ($i = 0; $i < $totalChunks; $i++) {
        $chunkFileName = $tempDir . $fileName . '.part' . $i;

        if (file_exists($chunkFileName)) {
            $chunkData = file_get_contents($chunkFileName);
            fwrite($file, $chunkData);
            unlink($chunkFileName);
        }
    }

    fclose($file);
}