package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.App_user;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<App_user, Long> {
    App_user findByEmail(String email);

    @Query("SELECT u FROM App_user u JOIN u.user_roles r WHERE r.name = :roleName")
    List<App_user> findByRoleName(String roleName);
}