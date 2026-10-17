package com.ourcut.character.repository;
import com.ourcut.character.domain.Frame;
import com.ourcut.character.domain.FrameSourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface FrameRepository extends JpaRepository<Frame, UUID> {
    List<Frame> findBySourceTypeOrderByUsageCountDesc(FrameSourceType sourceType);
    List<Frame> findBySourceTypeAndCharacter_IdOrderByUsageCountDesc(FrameSourceType sourceType, UUID characterId);
}
