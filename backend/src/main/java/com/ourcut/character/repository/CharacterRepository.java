package com.ourcut.character.repository;
import com.ourcut.character.domain.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface CharacterRepository extends JpaRepository<Character, UUID> {}
