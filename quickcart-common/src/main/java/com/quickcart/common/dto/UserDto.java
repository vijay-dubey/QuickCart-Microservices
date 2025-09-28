package com.quickcart.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;

    @JsonProperty("role")
    private UserRole userRole;

    public enum UserRole {
        CUSTOMER, ADMIN
    }
}
