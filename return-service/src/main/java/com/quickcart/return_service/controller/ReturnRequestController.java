package com.quickcart.return_service.controller;

import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.return_service.dto.request.CreateReturnRequest;
import com.quickcart.return_service.dto.response.ReturnRequestResponse;
import com.quickcart.return_service.feign.UserClient;
import com.quickcart.return_service.model.ReturnRequest;
import com.quickcart.return_service.service.ReturnRequestService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnRequestController {
    private final ReturnRequestService returnRequestService;
    private final UserClient userClient;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReturnRequestResponse createReturn(Authentication authentication,
                                              @Valid @RequestBody CreateReturnRequest request) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);

        return returnRequestService.createReturn(request, currentUser.getId());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReturnRequestResponse> getAllReturns() {
        return returnRequestService.getAllReturns();
    }

    @GetMapping("/user/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReturnRequestResponse> getUserReturnsByEmail(@PathVariable String email) {
        return returnRequestService.getReturnsByUserEmail(email);
    }

    @GetMapping("/user")
    public List<ReturnRequestResponse> getUserReturns(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        return returnRequestService.getReturnsByUserId(currentUser.getId());
    }

    @PatchMapping("/{returnId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ReturnRequestResponse approveReturn(@PathVariable Long returnId) {
        return returnRequestService.approveReturn(returnId);
    }

    @PatchMapping("/{returnId}/cancel")
    public void cancelReturn(Authentication authentication, @PathVariable Long returnId) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        returnRequestService.cancelReturn(returnId, currentUser.getId());
    }

    @GetMapping("/{returnId}")
    public ReturnRequestResponse getReturn(Authentication authentication,
                                           @PathVariable Long returnId,
                                           @RequestParam(required = false) Long targetUserId) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);

        Long effectiveUserId = (targetUserId != null && currentUser.getUserRole() == UserDto.UserRole.ADMIN) ? targetUserId : currentUser.getId();
        return returnRequestService.getReturnDetails(returnId, currentUser.getId(), effectiveUserId);
    }

    @PatchMapping("/{returnId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateReturnStatus(
            @PathVariable Long returnId,
            @RequestParam ReturnRequest.Status newStatus) {

        returnRequestService.updateReturnStatus(returnId, newStatus);
    }

    @GetMapping
    public List<ReturnRequestResponse> getReturnsByOrderId(
            Authentication authentication,
            @RequestParam(required = false) Long orderId) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);

        if (orderId != null) {
            return returnRequestService.getReturnsByOrderId(orderId, currentUser.getId());
        } else {
            return returnRequestService.getReturnsByUserId(currentUser.getId());
        }
    }
}