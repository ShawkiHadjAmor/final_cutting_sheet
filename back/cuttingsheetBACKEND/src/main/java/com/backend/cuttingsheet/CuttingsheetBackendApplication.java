package com.backend.cuttingsheet;

import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.entity.User_Role;
import com.backend.cuttingsheet.repository.UserRepository;
import com.backend.cuttingsheet.repository.UserRoleRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;

@SpringBootApplication
public class CuttingsheetBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CuttingsheetBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner init(UserRepository userRepository, UserRoleRepository userRoleRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            initializeData(userRepository, userRoleRepository, passwordEncoder);
        };
    }

    @Transactional
    private void initializeData(UserRepository userRepository, UserRoleRepository userRoleRepository, PasswordEncoder passwordEncoder) {
        // Create or fetch ENGINEER role
        User_Role engineerRole = userRoleRepository.findByName("ENGINEER");
        if (engineerRole == null) {
            engineerRole = new User_Role("ENGINEER");
            engineerRole = userRoleRepository.save(engineerRole);
            System.out.println("Created new ENGINEER role, ID: " + engineerRole.getId());
        } else {
            System.out.println("Found existing ENGINEER role, ID: " + engineerRole.getId());
        }
        userRoleRepository.flush();
        System.out.println("Flushed ENGINEER role");

        // Re-fetch to ensure managed state
        engineerRole = userRoleRepository.findById(engineerRole.getId()).orElse(null);
        System.out.println("Re-fetched ENGINEER role, ID: " + (engineerRole != null ? engineerRole.getId() : "null"));

        // ENGINEER (Admin)
        if (engineerRole != null && userRepository.findByEmail("chawkiamor2555@gmail.com") == null) {
            App_user engineer = new App_user();
            engineer.setFirstName("Chawki");
            engineer.setLastName("Amor");
            engineer.setEmail("chawkiamor2555@gmail.com");
            engineer.setPassword(passwordEncoder.encode("engineer123"));
            engineer.setUser_roles(Collections.singletonList(engineerRole));
            engineer.setCreatedAt(LocalDateTime.now());
            System.out.println("Saving ENGINEER user with role ID: " + engineerRole.getId());
            userRepository.save(engineer);
            userRepository.flush();
            System.out.println("Saved ENGINEER user");
        } else {
            System.err.println("ENGINEER role not found or user already exists, skipping user creation");
        }

        // Temporarily comment out other users to isolate the issue
        
        // ORDO
        User_Role ordoRole = userRoleRepository.findByName("ORDO");
        if (ordoRole == null) {
            ordoRole = new User_Role("ORDO");
            ordoRole = userRoleRepository.save(ordoRole);
            System.out.println("Created new ORDO role, ID: " + ordoRole.getId());
        }
        userRoleRepository.flush();
        ordoRole = userRoleRepository.findById(ordoRole.getId()).orElse(null);
        if (ordoRole != null && userRepository.findByEmail("zayanifadi2001@gmail.com") == null) {
            App_user ordo = new App_user();
            ordo.setFirstName("Ordo");
            ordo.setLastName("User");
            ordo.setEmail("zayanifadi2001@gmail.com");
            ordo.setPassword(passwordEncoder.encode("ordo123"));
            ordo.setUser_roles(Collections.singletonList(ordoRole));
            ordo.setCreatedAt(LocalDateTime.now());
            userRepository.save(ordo);
            userRepository.flush();
            System.out.println("Saved ORDO user");
        }

        // STOREKEEPER
        User_Role storekeeperRole = userRoleRepository.findByName("STOREKEEPER");
        if (storekeeperRole == null) {
            storekeeperRole = new User_Role("STOREKEEPER");
            storekeeperRole = userRoleRepository.save(storekeeperRole);
            System.out.println("Created new STOREKEEPER role, ID: " + storekeeperRole.getId());
        }
        userRoleRepository.flush();
        storekeeperRole = userRoleRepository.findById(storekeeperRole.getId()).orElse(null);
        if (storekeeperRole != null && userRepository.findByEmail("storekeeper@user.com") == null) {
            App_user storekeeper = new App_user();
            storekeeper.setFirstName("Store");
            storekeeper.setLastName("Keeper");
            storekeeper.setEmail("storekeeper@user.com");
            storekeeper.setPassword(passwordEncoder.encode("storekeeper123"));
            storekeeper.setUser_roles(Collections.singletonList(storekeeperRole));
            storekeeper.setCreatedAt(LocalDateTime.now());
            userRepository.save(storekeeper);
            userRepository.flush();
            System.out.println("Saved STOREKEEPER user");
        }

        // CML
        User_Role cmlRole = userRoleRepository.findByName("CML");
        if (cmlRole == null) {
            cmlRole = new User_Role("CML");
            cmlRole = userRoleRepository.save(cmlRole);
            System.out.println("Created new CML role, ID: " + cmlRole.getId());
        }
        userRoleRepository.flush();
        cmlRole = userRoleRepository.findById(cmlRole.getId()).orElse(null);
        if (cmlRole != null && userRepository.findByEmail("cml@user.com") == null) {
            App_user cml = new App_user();
            cml.setFirstName("CML");
            cml.setLastName("User");
            cml.setEmail("cml@user.com");
            cml.setPassword(passwordEncoder.encode("cml123"));
            cml.setUser_roles(Collections.singletonList(cmlRole));
            cml.setCreatedAt(LocalDateTime.now());
            userRepository.save(cml);
            userRepository.flush();
            System.out.println("Saved CML user");
        }

        // QUALITY
        User_Role qualityRole = userRoleRepository.findByName("QUALITY");
        if (qualityRole == null) {
            qualityRole = new User_Role("QUALITY");
            qualityRole = userRoleRepository.save(qualityRole);
            System.out.println("Created new QUALITY role, ID: " + qualityRole.getId());
        }
        userRoleRepository.flush();
        qualityRole = userRoleRepository.findById(qualityRole.getId()).orElse(null);
        if (qualityRole != null && userRepository.findByEmail("shawkihadjamor@gmail.com") == null) {
            App_user quality = new App_user();
            quality.setFirstName("Shawki");
            quality.setLastName("HadjAmor");
            quality.setEmail("shawkihadjamor@gmail.com");
            quality.setPassword(passwordEncoder.encode("quality123"));
            quality.setUser_roles(Collections.singletonList(qualityRole));
            quality.setCreatedAt(LocalDateTime.now());
            userRepository.save(quality);
            userRepository.flush();
            System.out.println("Saved QUALITY user");
        }
        
    }
}