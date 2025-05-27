package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.dto.LoginRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/auth")
public interface IAuthController {
    @PostMapping("/login")
    ResponseEntity<?> login(@RequestBody LoginRequest loginRequest);
}