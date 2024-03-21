import json
from channels.generic.websocket import WebsocketConsumer
from datetime import datetime
from lecture.models import Video
from accounts.models import User
from .models import Message
import urllib.parse
from config.settings import chatbot
import numpy as np
from gtts import gTTS
import base64
import io


class ChatConsumer(WebsocketConsumer):
    history = []

    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        # 쿼리 문자열 파싱 /?key=value
        query_string = self.scope['query_string'].decode('utf8')
        params = urllib.parse.parse_qs(query_string)
        # 쿼리 파라미터 추출
        video_id = params.get('video_id', [None])[0]
        # 방 파라미터 추출
        user_id = self.scope['url_route']['kwargs']['room_name']

        # 참조 객체들
        video = Video.objects.get(id=video_id)
        user = User.objects.get(id=user_id)

        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        message_time = datetime.now()

        # history로 사용될 메시지
        selected_messages = []
        # 러프한 길이 제한
        LEN_LIMIT = 10000

        user_message_embedded = chatbot.get_embedding(message)
        user_messages = Message.objects.filter(user=user, video=video)
        if user_messages:
            embedded_user_vectors = np.array([msg.user_message_embedded for msg in user_messages])
            descent_idx = np.argsort(np.dot(embedded_user_vectors, user_message_embedded))[::-1]
            len_count = 0
            for idx in descent_idx:
                if len_count < LEN_LIMIT:
                    current_message = user_messages[idx.item()]
                    selected_messages.append((current_message.user_message, current_message.bot_message))
                    len_count += (len(current_message.user_message) + len(current_message.bot_message))

        answer = chatbot.chat(message, selected_messages)
        answer_time = datetime.now()

        print("query", message)
        print("answer", answer)

        # gpt 답변 tts로 변환
        tts = gTTS(answer, lang="ko")

        # 음성을 메모리에 저장하지 않고 Base64로 변환
        speech_data = io.BytesIO()
        tts.write_to_fp(speech_data)
        speech_data.seek(0)  # 파일 끝을 처음으로 돌립니다.

        # Base64로 변환
        base64_encoded = base64.b64encode(speech_data.read()).decode("utf-8")

        # Message 생성
        instance = Message(
            user=user, video=video,
            user_message=message, bot_message=answer, user_time=message_time, bot_time=answer_time,
            user_message_embedded=user_message_embedded, bot_message_embedded=chatbot.get_embedding(answer))
        # 데이터베이스에 저장
        instance.save()

        self.send(text_data=json.dumps({"message": answer, "tts": base64_encoded}))
