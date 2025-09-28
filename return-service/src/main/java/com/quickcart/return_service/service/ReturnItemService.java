package com.quickcart.return_service.service;

import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.return_service.dto.response.ReturnItemResponse;
import com.quickcart.return_service.feign.UserClient;
import com.quickcart.return_service.mapper.ReturnItemMapper;
import com.quickcart.return_service.model.ReturnItem;
import com.quickcart.return_service.model.ReturnRequest;
import com.quickcart.return_service.repository.ReturnItemRepository;
import com.quickcart.return_service.repository.ReturnRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReturnItemService {
    private final ReturnItemRepository returnItemRepository;
    private final ReturnItemMapper returnItemMapper;
    private final ReturnRequestRepository returnRequestRepository;
    private final UserClient userClient;

    public List<ReturnItemResponse> getReturnItems(Long returnRequestId, Long userId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new ValidationException("Return request not found"));

        UserDto currentUser = userClient.getUserById(userId);
        if (!returnRequest.getUserId().equals(userId)  && currentUser.getUserRole() != UserDto.UserRole.ADMIN) {
            throw new ValidationException("Access denied");
        }

        return returnItemRepository.findByReturnRequestId(returnRequestId)
                .stream()
                .map(returnItemMapper::toResponse)
                .collect(Collectors.toList());
    }

    public BigDecimal calculateTotalRefundAmount(Long returnRequestId, Long userId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new ValidationException("Return request not found"));

        UserDto currentUser = userClient.getUserById(userId);
        if (!returnRequest.getUserId().equals(userId)  && currentUser.getUserRole() != UserDto.UserRole.ADMIN) {
            throw new ValidationException("Access denied");
        }

        if (returnRequest.getStatus() == ReturnRequest.Status.CANCELLED) {
            throw new ValidationException("Return request already cancelled");
        }

        return returnItemRepository.findByReturnRequestId(returnRequestId)
                .stream()
                .map(ReturnItem::getRefundAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
