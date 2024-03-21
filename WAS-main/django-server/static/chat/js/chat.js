window.addEventListener("DOMContentLoaded", function () {
    window.app = new Vue({
        delimiters: ["[[", "]]"],
        el: "#app-history",
        data: {
            // 메시지 내용 기록 { type, message, avatar, time }
            statements: [],
            // 현재 입력 중인 메시지
            inputMessage: "",
            // 서버의 답변을 기다리고 있는 메시지 수
            sentMessages: 0,
            isVisibleRecorder: false
        },
        computed: {
            waitting: function () {
                return this.sentMessages > 0;
            },
        },
        methods: {
            submit: function (e) {
                // 입력창 텍스트 가져오기
                var message = this.inputMessage;

                // 입력창 비우기
                this.inputMessage = "";

                // 서버로 전달
                chatSocket.send(
                    JSON.stringify({
                        message,
                    })
                );

                // 가상DOM으로 전달
                this.statements.push({
                    type: "querry",
                    message,
                    time: new Date().toLocaleTimeString(),
                });

                this.sentMessages += 1;
            },
            toggleRecorder: function (e) {
                this.isVisibleRecorder = !this.isVisibleRecorder;
            }
        },
        mounted() {
            /* chat-history 드래그로 리스트 확인 기능 */
            new PerfectScrollbar(this.$refs.chatHistoryBody, {
                wheelPropagation: !1,
                suppressScrollX: !0,
            });
        },
        updated() {
            i = this.$refs.chatHistoryBody;
            i.scrollTo(0, i.scrollHeight);
        },
    });
    const video_id = this.document.querySelector('#app-history').dataset.videoId;
    const user_id = this.document.querySelector('#app-history').dataset.userId;

    const chatSocket = new WebSocket("ws://" + window.location.host + "/ws/chat/" + user_id + "/?video_id="+video_id);

    // 서버에서 메시지 수용
    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        // 저장된 mp3파일 재생
        var base64EncodedAudio = data.tts;
        // Base64 디코딩
        var binaryAudio = atob(base64EncodedAudio);
        // ArrayBuffer로 변환
        var arrayBuffer = new ArrayBuffer(binaryAudio.length);
        var view = new Uint8Array(arrayBuffer);
        for (var i = 0; i < binaryAudio.length; i++) {
            view[i] = binaryAudio.charCodeAt(i);
        }
        // ArrayBuffer를 Blob으로 변환
        var blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        // Blob을 URL로 생성
        var audioUrl = URL.createObjectURL(blob);
        // 오디오 플레이어 생성
        var audio = new Audio(audioUrl);
        // 오디오 재생
        audio.play();

        // 가상DOM으로 전달
        window.app.statements.push({
            type: "answer",
            message: data.message,
            avatar: "gpt_logo.svg",
            time: new Date().toLocaleTimeString(),
        });

        window.app.sentMessages -= 1;
    };

    chatSocket.onclose = function (e) {
        console.error("Chat socket closed unexpectedly");
    };
});
