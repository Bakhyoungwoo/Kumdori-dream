package com.ourcut.user.application;

import com.ourcut.user.api.UserDtos;
import com.ourcut.user.infra.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserAdminService {
    private final UserRepository users;
    public UserAdminService(UserRepository users) { this.users = users; }

    public List<UserDtos.UserSummary> listAll() {
        return users.findAll().stream()
            .map(user -> new UserDtos.UserSummary(user.getId(), user.getEmail(), user.getNickname(), user.getRole(), user.getStatus()))
            .toList();
    }
}
