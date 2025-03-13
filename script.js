$(document).ready(function () {
    const allowedTypes = [
        'video/mp4',
        'video/avi',
        'video/quicktime'
    ];
    const maxSize = 1024 * 1024 * 1024; // 1GB
    const chunkSize = 1024 * 1024; // 1MB
    let currentChunk;
    let totalChunks;
    let file;
    let networkLost = false;

    $("#upload-form").submit(function (event) {
        event.preventDefault();
        uploadFile();
    });

    function uploadFile() {
        file = document.getElementById('fileInput').files[0];

        if (!file) {
            alert('Please select a file!');
            return;
        }

        if (!validateFile(file)) {
            return;
        }

        totalChunks = Math.ceil(file.size / chunkSize);
        currentChunk = getLastUploadedChunk(file.name) || 0;
        uploadNextChunk();
    }

    function validateFile(file) {
        if (!allowedTypes.includes(file.type)) {
            console.error('Invalid file type');
            alert('Invalid file type');
            return false;
        }

        if (file.size > maxSize) {
            console.error('Maximum file size');
            alert('The file size exceeds the maximum allowed size');
            return false;
        }

        return true;
    }

    function uploadNextChunk() {
        let chunk = file.slice(currentChunk * chunkSize, (currentChunk + 1) * chunkSize);
        sendChunk(chunk);
    }

    function sendChunk(chunkData) {
        let formData = new FormData();
        formData.append("fileChunk", chunkData);
        formData.append("currentChunk", currentChunk);
        formData.append("totalChunks", totalChunks);
        formData.append("fileName", file.name);

        $.ajax({
            url: 'index.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response === 'success' || response === 'chunk exists') {
                    saveLastUploadedChunk(file.name, ++currentChunk);

                    if (currentChunk < totalChunks) {
                        uploadNextChunk();
                    } else {
                        console.log('File upload complete!');
                        alert('Upload complete');
                        clearLastUploadedChunk(file.name);
                    }
                } else {
                    console.log('Error during chunk upload');
                    alert('Upload failed');
                }
            },
            error: function () {
                if (!networkLost) {
                    networkLost = true;
                    console.log('Network error, click to continue downloading');
                    showResumeModal();
                }
            }
        });
    }

    function showResumeModal() {
        $("#resumeModal").removeClass("hidden");

        $("#resumeBtn").off("click").on("click", function () {
            $("#resumeModal").addClass("hidden");
            networkLost = false;
            uploadNextChunk();
        });
    }

    function saveLastUploadedChunk(fileName, chunk) {
        try{
            localStorage.setItem(fileName + '_last_chunk', chunk);
        } catch(error) {
            console.log(error);
        }
    }

    function getLastUploadedChunk(fileName) {
        try {
            return parseInt(localStorage.getItem(fileName + '_last_chunk'));
        } catch(error) {
            console.log(error);
        }
    }

    function clearLastUploadedChunk(fileName) {
        try {
            localStorage.removeItem(fileName + '_last_chunk');
        } catch(error) {
            console.log(error);
        }
    }
});