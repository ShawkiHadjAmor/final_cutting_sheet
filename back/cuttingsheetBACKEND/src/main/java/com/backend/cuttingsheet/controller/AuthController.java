package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.dto.LoginRequest;
import com.backend.cuttingsheet.dto.LoginResponse;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.entity.User_Role;
import com.backend.cuttingsheet.interfaces.IAuthController;
import com.backend.cuttingsheet.repository.UserRepository;
import com.backend.cuttingsheet.security.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class AuthController implements IAuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public ResponseEntity<?> login(LoginRequest loginRequest) {
        App_user user = userRepository.findByEmail(loginRequest.getEmail());
        if (user != null && passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            String token = jwtTokenUtil.generateToken(user);
            // Get the first role name from user_roles (assuming one role per user)
            String role = user.getUser_roles().stream()
                .map(User_Role::getName)
                .findFirst()
                .orElse("USER"); // Fallback role if none found
            return ResponseEntity.ok(new LoginResponse(token, user.getEmail(), user.getFirstName(), user.getLastName(), role));
        }
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Invalid email or password!");
        errorResponse.put("status", "error");
        return ResponseEntity.badRequest().body(errorResponse);
    }
}