package com.backend.cuttingsheet.entity;

import org.springframework.security.core.GrantedAuthority;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_role")
public class User_Role implements GrantedAuthority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @ManyToMany(mappedBy = "user_roles")
    @JsonIgnore
    private List<App_user> users = new ArrayList<>();

    public User_Role() {}

    public User_Role(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<App_user> getUsers() { return users; }
    public void setUsers(List<App_user> users) { this.users = users; }

    @Override
    public String getAuthority() {
        return "ROLE_" + name; 
    }
}