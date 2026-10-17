package com.ourcut.user.controller;

import com.ourcut.user.service.UserAdminService;
import com.ourcut.user.dto.UserDtos;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserAdminController {
    private final UserAdminService users;
    public UserAdminController(UserAdminService users) { this.users = users; }

    @GetMapping
    public List<UserDtos.UserResponse> list() {
        return users.listAll();
    }
}
