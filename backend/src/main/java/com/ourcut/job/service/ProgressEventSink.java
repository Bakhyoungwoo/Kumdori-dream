package com.ourcut.job.service;

public interface ProgressEventSink {
    void publish(ProgressEvent event);
}
