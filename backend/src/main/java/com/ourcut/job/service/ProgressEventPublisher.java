package com.ourcut.job.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ProgressEventPublisher {
    private final ProgressEventSink sink;

    public ProgressEventPublisher(ProgressEventSink sink) {
        this.sink = sink;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(ProgressEvent event) {
        sink.publish(event);
    }
}
