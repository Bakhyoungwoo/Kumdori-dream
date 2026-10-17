package com.ourcut.character.service;

import com.ourcut.character.domain.FrameSourceType;
import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.repository.FrameRepository;
import com.ourcut.global.storage.ObjectUrlResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
public class FrameQueryService {
    private final FrameRepository frames;
    private final ObjectUrlResolver urls;

    public FrameQueryService(FrameRepository frames, ObjectUrlResolver urls) {
        this.frames = frames;
        this.urls = urls;
    }

    @Transactional(readOnly = true)
    public List<FrameResponse> list(FrameSourceType source, UUID characterId) {
        var result = characterId == null
            ? frames.findBySourceTypeOrderByUsageCountDesc(source)
            : frames.findBySourceTypeAndCharacter_IdOrderByUsageCountDesc(source, characterId);
        return result.stream().map(frame -> FrameResponse.from(frame, urls)).toList();
    }

    @Transactional(readOnly = true)
    public Optional<FrameResponse> find(UUID id) {
        return frames.findById(id).map(frame -> FrameResponse.from(frame, urls));
    }
}
