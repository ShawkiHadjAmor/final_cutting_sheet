package com.backend.cuttingsheet.security;

import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.entity.User_Role;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String generateToken(App_user user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", user.getEmail());
        String role = user.getUser_roles().stream()
            .map(User_Role::getName)
            .findFirst()
            .orElse("USER");
        claims.put("role", role);
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000))
            .signWith(SignatureAlgorithm.HS512, secret)
            .compact();
    }
}