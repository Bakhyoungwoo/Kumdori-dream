# AI Engine

OURCUT의 이미지 합성 및 생성형 이미지·영상 작업을 처리하는 Python 기반 AI Engine입니다.

## 주요 기능

- 인물 segmentation 및 landmark 기반 이미지 합성
- CV 기반 이미지 결과 생성
- OpenAI 이미지 생성 연동
- Google Veo 영상 생성 연동
- LangGraph 기반 작업 파이프라인
- Kafka `compose.request` 메시지 소비
- Core API 상태 callback
- 로컬 object storage 기반 결과 저장

## 처리 흐름

```text
Core API
  -> Kafka compose.request
  -> AI Engine consumer
  -> LangGraph pipeline
  -> local storage / S3-compatible storage
  -> Core API callback
```

파이프라인은 `media_type`에 따라 분기됩니다.

- `IMAGE`: CV 또는 생성형 이미지 파이프라인
- `VIDEO`: 이미지와 프레임을 바탕으로 한 영상 파이프라인

## 요구사항

- Python 3.12+
- Kafka (메시지 소비 시)
- Google AI Studio API key (Veo 영상 생성 시)
- OpenAI API key (OpenAI 이미지 생성 시)

## 설치

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
```

## 환경설정

`.env.example`을 복사해 `.env`를 만들고 필요한 값을 설정합니다.

```powershell
Copy-Item .env.example .env
```

주요 설정:

```env
KAFKA_ENABLED=false
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=compose.request
CORE_API_URL=http://localhost:8080
AI_ENGINE_SECRET=change-me
STORAGE_ROOT=.data/objects

OPENAI_API_KEY=
GEMINI_API_KEY=
IMAGE_PROVIDER=openai
VIDEO_PROVIDER=google
VIDEO_MODEL=veo-3.1-generate-preview
```

`OPENAI_API_KEY`와 `GEMINI_API_KEY`는 서로 다른 키입니다. 영상 생성은 `VIDEO_PROVIDER=google`일 때 Google AI Studio의 `GEMINI_API_KEY`를 사용합니다.

## 실행

### HTTP health endpoint

```powershell
\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

```powershell
Invoke-RestMethod http://localhost:8001/health
```

### Kafka consumer

`.env`에서 `KAFKA_ENABLED=true`로 설정한 뒤 같은 방식으로 실행합니다. consumer는 `compose.request` 토픽을 구독하고 작업 결과를 Core API에 callback합니다.

## 테스트

```powershell
\.venv\Scripts\python.exe -m pytest -q tests
```

테스트는 외부 OpenAI/Gemini 호출을 비활성화한 상태에서 실행되며, CV 파이프라인·그래프 라우팅·결과 저장·provider 검증을 확인합니다.

## 작업 payload

AI Engine은 snake_case 내부 필드와 Core API에서 사용하는 camelCase 입력을 모두 지원합니다.

```json
{
  "job_id": "job-id",
  "user_id": "user-id",
  "media_type": "VIDEO",
  "pipeline_type": "GENERATIVE",
  "requirement_text": "나와 꿈돌이가 함께 걷는 영상",
  "input_keys": ["uploads/job-id/user.jpg"],
  "frame_key": "uploads/job-id/dreamy.webp"
}
```

Core API payload를 사용할 때는 `mediaType`, `pipelineType`, `requirementText`, `imageCount` 같은 camelCase 필드도 사용할 수 있습니다. 영상 요청에는 반드시 `mediaType: "VIDEO"`가 필요합니다. 값이 없으면 기본값은 `IMAGE`입니다.

## 결과

기본 로컬 storage 결과 위치:

```text
.data/objects/results/{job_id}/result.png
.data/objects/results/{job_id}/result.mp4
.data/objects/results/{job_id}/thumbnail.jpg
```

영상 생성 결과에는 `result.mp4`와 `thumbnail.jpg`가 저장됩니다.

## Core API callback

AI Engine은 다음 endpoint로 작업 상태를 보고합니다.

```text
POST /api/v1/internal/jobs/{job_id}/callback
Header: X-Internal-Api-Key: {AI_ENGINE_SECRET}
```

상태는 `PROCESSING`, `DONE`, `FAILED`를 사용합니다. Core API의 `APP_INTERNAL_API_KEY`와 AI Engine의 `AI_ENGINE_SECRET`은 같은 값이어야 합니다.

## Google Veo 영상 생성

Google AI Studio에서 발급한 키를 설정합니다.

```env
GEMINI_API_KEY=...
VIDEO_PROVIDER=google
VIDEO_MODEL=veo-3.1-generate-preview
```

Veo 호출은 비동기로 동작하므로 생성 완료까지 시간이 걸릴 수 있습니다. API 사용량과 결제 설정이 필요하며, 크레딧이 부족하면 `402 RESOURCE_EXHAUSTED`가 반환됩니다.

## 현재 제한사항

- 로컬 object storage는 개발·테스트용입니다.
- 운영 환경에서는 S3 호환 storage 설정이 필요합니다.
- Core API가 `mediaType`을 전달하지 않으면 영상 요청을 구분할 수 없습니다.
- 외부 provider 통합 테스트는 API 비용 때문에 기본 테스트에서 제외됩니다.
