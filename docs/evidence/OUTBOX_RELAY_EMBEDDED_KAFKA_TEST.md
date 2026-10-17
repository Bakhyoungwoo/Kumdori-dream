# Outbox Relay 장애 발견 증거: Embedded Kafka 통합 테스트

이 증거는 운영 장애가 아니라, 통합 테스트 시나리오 내부에서 Kafka 브로커를 시작하고 종료하여 재현한 결과다.

## 실행 명령

```powershell
cd backend
.\gradlew.bat test --tests com.ourcut.job.outbox.OutboxRelayKafkaIntegrationTest --no-daemon
```

## 테스트 시나리오

1. 테스트가 Embedded Kafka KRaft 브로커와 `compose.request` 토픽을 시작한다.
2. 정상 메시지를 먼저 전송해 브로커가 정상임을 확인한다.
3. 같은 테스트 메서드 안에서 `kafka.destroy()`를 호출한다.
4. Outbox Relay가 이벤트를 전송한다.
5. 전송 실패를 `FAILED` 상태, `retryCount=1`, 다음 시도 시각으로 저장하는지 검증한다.

## 장애 발견 로그

```text
WARN org.apache.kafka.clients.NetworkClient - Connection to node -1
  (localhost/127.0.0.1:53457) could not be established.
WARN org.apache.kafka.clients.NetworkClient - Bootstrap broker
  localhost:53457 (id: -1 rack: null) disconnected

ERROR org.springframework.kafka.support.LoggingProducerListener -
  Exception thrown when sending a message with key='5313b643-a3c4-44ca-b5d4-0c0bb8dcfb48'
  and payload='{}' to topic compose.request:
  org.apache.kafka.common.errors.TimeoutException:
  Topic compose.request not present in metadata after 2000 ms.

WARN com.ourcut.job.outbox.OutboxRelay - outbox event publish failed:
  topic=compose.request, retryCount=1,
  nextAttemptAt=2026-10-17T11:21:27.006952Z
```

## 결과

```text
OutboxRelayKafkaIntegrationTest >
  brokerFailsDuringTestAndRelayRecordsRetryMetadata() PASSED

BUILD SUCCESSFUL in 21s
```

이 테스트로 확인한 범위는 브로커 연결 실패 시 Relay의 실패 상태 및 재시도 메타데이터 기록이다. 실제 운영 장애 발생률이나 복구 p95를 의미하지 않으므로, 운영 지표는 별도 부하·관측 환경에서 측정해야 한다.
