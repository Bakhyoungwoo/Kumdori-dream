package com.ourcut.global.storage;

@FunctionalInterface
public interface ObjectUrlResolver {
    String resolve(String objectKey);
}
