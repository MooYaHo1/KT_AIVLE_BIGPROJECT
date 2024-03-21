window.addEventListener("DOMContentLoaded", function () {
    let mediaRecorder;
    let audioChunks = [];
    var csrfToken = $("[name=csrfmiddlewaretoken]").val();

    async function startRecording() {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        mediaRecorder.start();
    }

    async function stopRecording() {
        return new Promise((resolve) => {
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64AudioMessage = reader.result.split(",")[1];
                    resolve(base64AudioMessage);
                };
                reader.readAsDataURL(audioBlob);
            };
            mediaRecorder.stop();
        });
    }

    async function sendAudio() {
        const base64AudioMessage = await stopRecording();
        $.ajax({
            type: "post",
            async: false,
            headers: { "X-CSRFToken": csrfToken },
            url: "/chat/voice/",
            data: JSON.stringify({ message: base64AudioMessage }),
            processData: false,
            contentType: false,
        }).done(function (data) {
            window.app.inputMessage = data.text;
        });

        let audio = new Audio("data:audio/wav;base64," + base64AudioMessage);
        audio.play();
    }

    let isRecording = false;
    const recordButton = document.getElementById("record-button");

    recordButton.addEventListener("click", () => {
        if (!isRecording) {
            startRecording();
            isRecording = true;
        } else {
            sendAudio();
            isRecording = false;
        }
    });
});
