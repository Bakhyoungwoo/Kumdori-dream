package com.ourcut.character.service;

import com.ourcut.character.domain.Frame;
import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.dto.UserFrameDtos;
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
public class UserFrameService {
    private final FrameRepository frames;
    private final UserRepository users;
    private final ObjectUrlResolver urls;

    public UserFrameService(FrameRepository frames, UserRepository users, ObjectUrlResolver urls) {
        this.frames = frames;
        this.users = users;
        this.urls = urls;
    }

    @Transactional
    public FrameResponse create(UUID userId, UserFrameDtos.CreateRequest request) {
        var user = users.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        validate(userId, request);
        Frame frame = Frame.userFrame(user, request.title().trim(), normalize(request.description()),
            request.templateKey().trim(), request.slotCount());
        request.slots().forEach(slot -> frame.addSlot(slot.slotIndex(), slot.targetImageKey().trim(), normalize(slot.analysis())));
        return FrameResponse.from(frames.save(frame), urls);
    }

    @Transactional(readOnly = true)
    public List<FrameResponse> list(UUID userId) {
        return frames.findByOwner_IdOrderByCreatedAtDesc(userId).stream()
            .map(frame -> FrameResponse.from(frame, urls)).toList();
    }

    @Transactional
    public void delete(UUID userId, UUID frameId) {
        Frame frame = frames.findById(frameId)
            .filter(value -> value.getOwner() != null && value.getOwner().getId().equals(userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Frame not found"));
        frames.delete(frame);
    }

    private static void validate(UUID userId, UserFrameDtos.CreateRequest request) {
        if (request.slots().size() != request.slotCount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All frame slots must be provided");
        }
        var indexes = request.slots().stream().map(UserFrameDtos.Slot::slotIndex).toList();
        if (new HashSet<>(indexes).size() != indexes.size()
            || indexes.stream().anyMatch(index -> index < 0 || index >= request.slotCount())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid frame slot inputs");
        }
        String prefix = "users/" + userId + "/inputs/";
        if (!request.templateKey().trim().startsWith(prefix)
            || request.slots().stream().map(UserFrameDtos.Slot::targetImageKey).map(String::trim)
                .anyMatch(key -> !key.startsWith(prefix))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Frame assets do not belong to the user");
        }
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
