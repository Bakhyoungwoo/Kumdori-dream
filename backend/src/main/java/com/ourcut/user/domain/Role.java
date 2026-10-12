package com.ourcut.user.domain;

public enum Role {
    USER, ADMIN;

    public String authority() { return "ROLE_" + name(); }
}
