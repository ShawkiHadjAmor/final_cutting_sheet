package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.User_Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<User_Role, Long> {
    User_Role findByName(String name);
}