# TODO: 의존성 설치 및 실행 커맨드 추가 예정
FROM python:3.12-slim
WORKDIR /app
EXPOSE 8001

COPY requirements.txt .
COPY app ./app

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
