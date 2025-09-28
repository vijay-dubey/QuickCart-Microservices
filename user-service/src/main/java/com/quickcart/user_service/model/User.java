package com.quickcart.user_service.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;


@Entity
@Table(name = "users")
@Data
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    @Column
    private String firstName;

    @Size(max = 100)
    @Column
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email required")
    @Column(unique = true)
    private String email;

    @NotBlank(message = "Phone is required")
    @Column(unique = true)
    @Pattern(regexp = "^\\+?[0-9]{10,15}$")
    private String phone;

    @NotBlank(message = "Password is required")
    private String password;

    public enum UserRole {
        CUSTOMER, ADMIN
    }

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.CUSTOMER;

    public enum Gender {
        MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
    }

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column
    private LocalDate dob;

    private boolean deleted = false;

    @CreationTimestamp
    @Column
    private LocalDateTime createdAt;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        return !deleted;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Column
    private LocalDateTime deletedAt;
}