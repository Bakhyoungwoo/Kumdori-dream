# 트러블 슈팅 1 보완 기록: 테스트 중 Outbox Relay 장애 발견

기존 트러블 슈팅 1의 템플릿에 실제 발견 과정을 추가한 보완 문서다. 장애는 테스트 외부에서 수동으로 주입하지 않고, 통합 테스트 시나리오 안에서 재현했다.

## 1. 문제 상황

정상적으로 Kafka에 메시지를 전송하던 Outbox Relay가 브로커 연결이 끊긴 상황에서 이벤트를 유실하지 않고 실패 상태와 재시도 정보를 저장해야 한다. 이 동작이 실제 Kafka 클라이언트 실패를 통해 검증되는지 확인할 필요가 있었다.

### 1.1 문제를 발견한 과정

`OutboxRelayKafkaIntegrationTest`가 Embedded Kafka 브로커를 시작하고 `compose.request` 토픽으로 기준 메시지를 먼저 전송했다. 이후 동일한 테스트 메서드 안에서 브로커를 종료한 다음 Relay를 실행했다.

이때 테스트 로그에서 다음 순서가 관찰됐다.

- Kafka client가 `localhost:53457`에 다시 연결하지 못함
- `TimeoutException` 발생: `Topic compose.request not present in metadata after 2000 ms`
- Relay가 `outbox event publish failed`를 출력
- 이벤트의 `retryCount=1`, `nextAttemptAt` 기록
- JUnit 검증 통과 및 `BUILD SUCCESSFUL`

상세 원문은 [Embedded Kafka 테스트 증거](evidence/OUTBOX_RELAY_EMBEDDED_KAFKA_TEST.md)에 남겼다.

## 2. 원인

테스트 중 브로커가 종료되어 Kafka Producer가 메타데이터를 가져오지 못했다. 이 실패는 Relay 내부의 `KafkaTemplate.send(...).get(...)`에서 예외로 관찰된다.

## 3. 해결 방법

### 방법 A: API 요청 스레드에서 Kafka 전송이 성공할 때까지 대기

DB 저장과 Kafka 전송을 한 요청 흐름에서 처리한다. 구현은 단순하지만 Kafka 장애가 API 응답 지연으로 전파되고, DB 커밋과 메시지 발행 사이의 원자성을 보장하기 어렵다.

### 방법 B: Transactional Outbox와 Relay 재시도

Job과 Outbox 이벤트를 같은 DB 트랜잭션으로 저장한다. 별도 Relay가 Kafka 발행을 담당하며, 실패 이벤트는 `FAILED`와 재시도 횟수·다음 시도 시각·마지막 오류를 저장한다.

## 4. 선택 이유

방법 B는 API와 Kafka의 장애 결합도를 낮추고, DB에 남은 이벤트를 재시도할 수 있다. 또한 같은 테스트에서 브로커 종료를 검증할 수 있어 실패를 재현하기 쉽고, 향후 멱등성·DLQ·관측 지표를 추가하기 좋다.

## 5. 해결 과정

1. `OutboxEvent`에 `retryCount`, `availableAt`, `lastError`를 추가했다.
2. 실패 시 재시도 횟수를 증가시키고 지수 백오프 기반의 다음 시각을 계산하도록 했다.
3. Relay가 `PENDING`뿐 아니라 재시도 시각이 도래한 `FAILED` 이벤트도 조회하도록 했다.
4. Docker에 의존하던 테스트 대신 Spring Kafka의 `EmbeddedKafkaKraftBroker`를 사용했다.
5. 테스트 안에서 정상 전송 후 브로커를 종료하고 Relay의 실패 저장을 검증했다.

## 6. 해결 결과

통합 테스트가 통과했고 다음 상태 전이가 확인됐다.

```text
PENDING -> Kafka 연결 실패 -> FAILED
                     retryCount=1
                     nextAttemptAt 기록
```

정량적인 운영 복구율·p95는 아직 측정하지 않았다. 해당 값은 실제 운영 또는 반복 부하 테스트에서 측정한 뒤 추가한다.
