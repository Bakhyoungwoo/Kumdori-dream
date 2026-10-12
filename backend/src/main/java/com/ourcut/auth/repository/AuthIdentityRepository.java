package com.ourcut.auth.repository;
import com.ourcut.auth.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, UUID> {
    Optional<AuthIdentity> findByProviderAndProviderSubject(AuthProvider provider, String subject);
}
