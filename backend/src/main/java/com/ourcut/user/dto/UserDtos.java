package com.ourcut.user.dto;

import com.ourcut.user.domain.Role;
import com.ourcut.user.domain.UserStatus;
import java.util.UUID;

public final class UserDtos {
    private UserDtos() {
    }

    public record UserResponse(UUID id, String email, String nickname, Role role, UserStatus status) {
    }
}
