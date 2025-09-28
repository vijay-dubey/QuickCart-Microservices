package com.quickcart.user_service.controller;

import com.quickcart.user_service.dto.request.PasswordChangeRequest;
import com.quickcart.user_service.dto.request.UserRequest;
import com.quickcart.user_service.dto.request.UserUpdate;
import com.quickcart.user_service.dto.response.UserResponse;
import com.quickcart.user_service.mapper.UserMapper;
import com.quickcart.user_service.model.User;
import com.quickcart.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserMapper userMapper;

//    @GetMapping("/me")
//    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal User user) {
//        if (user == null) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
//        }
//        return ResponseEntity.ok(userMapper.toUserResponse(user));
//    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal String email) {
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserResponse userResponse = userService.getByEmail(email);
        return ResponseEntity.ok(userResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userMapper.toUserResponse(user));
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> loginUser(@RequestBody User user) {
        // Authentication is handled by JwtAuthenticationFilter
        return ResponseEntity.ok("Login successful");
    }

    @PutMapping("/{email}")
    @PreAuthorize("#email == principal.username or hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @P("email") @PathVariable String email,
            @Valid @RequestBody UserUpdate update) {
        User user = userService.updateUser(email, update);
        return ResponseEntity.ok(userMapper.toUserResponse(user));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getByEmail(@P("email") @PathVariable String email) {
        return ResponseEntity.ok(userService.getByEmail(email));
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllActiveUsers());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsersIncludingDeleted() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/{email}")
    @PreAuthorize("#email == principal.username or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@P("email") @PathVariable String email) {
        userService.deleteUser(email);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PasswordChangeRequest request) {
        userService.changePassword(user.getEmail(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}