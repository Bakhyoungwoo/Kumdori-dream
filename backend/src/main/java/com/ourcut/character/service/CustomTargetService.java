package com.ourcut.character.service;

import com.ourcut.character.domain.Frame;
import com.ourcut.character.dto.CustomTargetDtos;
import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.repository.FrameRepository;
import com.ourcut.global.storage.ObjectUrlResolver;
import com.ourcut.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
public class CustomTargetService {
    private final FrameRepository frames;
    private final UserRepository users;
    private final ObjectUrlResolver urls;

    public CustomTargetService(FrameRepository frames, UserRepository users, ObjectUrlResolver urls) {
        this.frames = frames;
        this.users = users;
        this.urls = urls;
    }

    @Transactional
    public FrameResponse create(UUID userId, CustomTargetDtos.CreateRequest request) {
        var user = users.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        String prefix = "users/" + userId + "/inputs/";
        if (request.slots().stream().map(CustomTargetDtos.Slot::slotIndex).collect(java.util.stream.Collectors.toSet()).size()
                != request.slots().size()
            || request.slots().stream().anyMatch(slot -> slot.slotIndex() < 0 || slot.slotIndex() >= request.slots().size()
                || !slot.targetImageKey().trim().startsWith(prefix))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid custom target slots");
        }
        Frame frame = Frame.userUploadedFrame(user, request.title().trim(),
            request.description() == null ? null : request.description().trim(), request.templateKey().trim(), request.slots().size());
        request.slots().forEach(slot -> frame.addSlot(slot.slotIndex(), slot.targetImageKey().trim(), slot.analysis()));
        return FrameResponse.from(frames.save(frame), urls);
    }

    @Transactional(readOnly = true)
    public List<FrameResponse> list(UUID userId) {
        return frames.findByOwner_IdOrderByCreatedAtDesc(userId).stream()
            .map(frame -> FrameResponse.from(frame, urls))
            .toList();
    }
}
