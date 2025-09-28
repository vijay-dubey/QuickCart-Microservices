package com.quickcart.return_service.controller;

import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.return_service.dto.response.ReturnItemResponse;
import com.quickcart.return_service.feign.UserClient;
import com.quickcart.return_service.service.ReturnItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/return-items")
@RequiredArgsConstructor
public class ReturnItemController {
    private final ReturnItemService returnItemService;
    private final UserClient userClient;

    @GetMapping("/return-request/{returnRequestId}")
    public List<ReturnItemResponse> getReturnItems(Authentication authentication, @PathVariable Long returnRequestId) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        return returnItemService.getReturnItems(returnRequestId, currentUser.getId());
    }


    @GetMapping("/return-request/{returnRequestId}/refund-total")
    public BigDecimal getRefundTotal(Authentication authentication, @PathVariable Long returnRequestId) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        return returnItemService.calculateTotalRefundAmount(returnRequestId, currentUser.getId());
    }
}
