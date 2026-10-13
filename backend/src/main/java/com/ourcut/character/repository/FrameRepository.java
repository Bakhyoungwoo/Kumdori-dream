package com.ourcut.character.repository;
import com.ourcut.character.domain.Frame;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface FrameRepository extends JpaRepository<Frame, UUID> {}
