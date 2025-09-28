package com.quickcart.user_service.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private String role;
    private String gender;
    private LocalDate dob;
    private LocalDateTime createdAt;
    private boolean deleted;
    private LocalDateTime deletedAt;
}