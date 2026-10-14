package com.ourcut.character.service;

import com.ourcut.character.domain.FrameSourceType;
import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.repository.FrameRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class FrameQueryService {
    private final FrameRepository frames;

    public FrameQueryService(FrameRepository frames) {
        this.frames = frames;
    }

    public List<FrameResponse> list(FrameSourceType source, UUID characterId) {
        var result = characterId == null
            ? frames.findBySourceTypeOrderByUsageCountDesc(source)
            : frames.findBySourceTypeAndCharacter_IdOrderByUsageCountDesc(source, characterId);
        return result.stream().map(FrameResponse::from).toList();
    }
}
