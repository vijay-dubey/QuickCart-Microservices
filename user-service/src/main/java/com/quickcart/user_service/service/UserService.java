package com.quickcart.user_service.service;

import com.quickcart.common.event.UserDeletedEvent;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.user_service.dto.request.UserRequest;
import com.quickcart.user_service.dto.request.UserUpdate;
import com.quickcart.user_service.dto.response.UserResponse;
import com.quickcart.user_service.kafka.UserKafkaProducer;
import com.quickcart.user_service.mapper.UserMapper;
import com.quickcart.user_service.model.User;
import com.quickcart.user_service.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final UserKafkaProducer kafkaProducer;

    public User registerUser(UserRequest request) {
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new ValidationException("Email already exists");
        }

        if (userRepository.existsByPhoneAndDeletedFalse(request.getPhone())) {
            throw new ValidationException("Phone already exists");
        }

        Optional<User> deletedUser = userRepository.findByEmailAndDeletedTrue(request.getEmail());
        if (deletedUser.isPresent()) {
            return restoreUser(deletedUser.get(), request);  // Restore logic
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userRepository.save(user);
    }

    private User restoreUser(User deletedUser, UserRequest request) {
        // Check 30-day cooldown
        if (deletedUser.getDeletedAt().isAfter(LocalDateTime.now().minusDays(30))) {
            throw new ValidationException("Account can only be restored after 30 days");
        }

        // Restore and update all fields (except email)
        deletedUser.setDeleted(false);
        deletedUser.setDeletedAt(null);
        deletedUser.setPassword(passwordEncoder.encode(request.getPassword()));  // Update password
        userMapper.updateUserFromRequest(request, deletedUser);  // Update other fields
        return userRepository.save(deletedUser);
    }

    public User updateUser(String email, UserUpdate update) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        userMapper.updateUserFromDto(update, user);
        return userRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public UserResponse getByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(userMapper::toUserResponse)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(userMapper::toUserResponse)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllActiveUsers() {
        return userRepository.findAllActiveUsers().stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllUsers().stream()
                .map(userMapper::toUserResponse)
                .toList();
    }



    public void deleteUser(String email) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
        UserDeletedEvent event = new UserDeletedEvent(user.getId(), user.getEmail());
        kafkaProducer.sendUserDeletedEvent(event);
        userRepository.save(user);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ValidationException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmailAndDeletedFalse(String email) {
        return userRepository.findByEmailAndDeletedFalse(email);
    }
}