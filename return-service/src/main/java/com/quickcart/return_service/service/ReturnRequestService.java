package com.quickcart.return_service.service;

import com.quickcart.common.dto.OrderDto;
import com.quickcart.common.dto.OrderItemDto;
import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.return_service.dto.request.CreateReturnRequest;
import com.quickcart.return_service.dto.request.ReturnItemRequest;
import com.quickcart.return_service.dto.response.ReturnRequestResponse;
import com.quickcart.return_service.feign.OrderClient;
import com.quickcart.return_service.feign.ProductClient;
import com.quickcart.return_service.feign.UserClient;
import com.quickcart.return_service.mapper.ReturnRequestMapper;
import com.quickcart.return_service.model.ReturnItem;
import com.quickcart.return_service.model.ReturnRequest;
import com.quickcart.return_service.repository.ReturnItemRepository;
import com.quickcart.return_service.repository.ReturnRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReturnRequestService {
    private final ReturnRequestRepository returnRequestRepository;
    private final ReturnItemRepository returnItemRepository;
    private final ReturnRequestMapper returnRequestMapper;
    private final OrderClient orderClient;
    private final ProductClient productClient;
    private final UserClient userClient;

    @Transactional
    public ReturnRequestResponse createReturn(CreateReturnRequest request, Long userId) {
        OrderDto order = orderClient.getOrderById(request.getOrderId());
        validateReturnEligibility(order.getId(), userId);
        validateNoExistingReturn(order);

        UserDto user = userClient.getUserById(userId);

        ReturnRequest returnRequest = new ReturnRequest();
        returnRequest.setOrderId(order.getId());
        returnRequest.setUserId(user.getId());
        returnRequest.setStatus(ReturnRequest.Status.REQUESTED);
        returnRequest.setType(request.getType());
        returnRequest.setReason(request.getReason());

        if ("FULL".equals(request.getType())) {
            createFullReturnItems(order, returnRequest);
        } else {
            validatePartialReturnItems(request.getItems(), order);
            createPartialReturnItems(request.getItems(), returnRequest, order);
        }

        ReturnRequest savedRequest = returnRequestRepository.save(returnRequest);
        return returnRequestMapper.toResponse(savedRequest);
    }

    @Transactional
    public ReturnRequestResponse approveReturn(Long returnId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ValidationException("Return request not found"));

        if (returnRequest.getStatus() != ReturnRequest.Status.REQUESTED) {
            throw new ValidationException("Return already processed");
        }

        returnRequest.setStatus(ReturnRequest.Status.APPROVED);
        return returnRequestMapper.toResponse(returnRequestRepository.save(returnRequest));
    }

    @Transactional
    public void cancelReturn(Long returnId, Long userId) {
        ReturnRequest returnRequest = returnRequestRepository.findByIdAndUserId(returnId, userId)
                .orElseThrow(() -> new ValidationException("Return request not found"));

        if (returnRequest.getStatus() != ReturnRequest.Status.REQUESTED) {
            throw new ValidationException("Cannot cancel: Return already processed");
        }

        returnRequest.setStatus(ReturnRequest.Status.CANCELLED);
        returnRequestRepository.save(returnRequest);
    }

    @Transactional(readOnly = true)
    public ReturnRequestResponse getReturnDetails(Long returnId, Long requesterUserId, Long effectiveUserId) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ValidationException("Return not found"));

        UserDto requester = userClient.getUserById(requesterUserId);
        if (!returnRequest.getUserId().equals(effectiveUserId)  && requester.getUserRole() != UserDto.UserRole.ADMIN) {
            throw new ValidationException("Access denied");
        }

        return returnRequestMapper.toResponse(returnRequest);
    }


    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getAllReturns() {
        List<ReturnRequest> returns = returnRequestRepository.findAll();
        return returns.stream()
                .map(returnRequestMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getReturnsByUserId(Long userId) {
        List<ReturnRequest> returns = returnRequestRepository.findByUserId(userId);
        return returns.stream()
                .map(returnRequestMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getReturnsByUserEmail(String email) {
        UserDto user = userClient.getUserByEmail(email);
        List<ReturnRequest> returns = returnRequestRepository.findByUserId(user.getId());
        return returns.stream()
                .map(returnRequestMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getReturnsByOrderId(Long orderId, Long userId) {
        OrderDto order = orderClient.getOrderById(orderId);

        if (!order.getUserId().equals(userId)) {
            throw new ValidationException("Access denied");
        }

        List<ReturnRequest> returns = returnRequestRepository.findByOrderId(orderId);
        return returns.stream()
                .map(returnRequestMapper::toResponse)
                .toList();
    }

    @Transactional
    public void updateReturnStatus(Long returnId, ReturnRequest.Status newStatus) {
        ReturnRequest returnRequest = returnRequestRepository.findById(returnId)
                .orElseThrow(() -> new ValidationException("Return request not found"));

        if (!returnRequest.getStatus().canTransitionTo(newStatus)) {
            throw new ValidationException(
                    String.format("Cannot transition from %s to %s",
                            returnRequest.getStatus(), newStatus)
            );
        }

        returnRequest.setStatus(newStatus);

        OrderDto order = orderClient.getOrderById(returnRequest.getOrderId());

        switch (newStatus) {
            case PROCESSED:
                order.setStatus(returnRequest.getType().equals("FULL")
                        ? OrderDto.OrderStatus.RETURNED
                        : OrderDto.OrderStatus.PARTIALLY_RETURNED);
                restockItems(returnRequest);
                break;
            case REFUND_INITIATED:
                order.setStatus(OrderDto.OrderStatus.REFUND_INITIATED);
                break;
            case REFUNDED:
                order.setStatus(OrderDto.OrderStatus.REFUNDED);
                order.setPaymentStatus(OrderDto.PaymentStatus.REFUNDED);
                break;
        }

        returnRequestRepository.save(returnRequest);
        orderClient.updateOrderStatus(order.getId(), order.getStatus(), null);

    }

    // --- Helper Methods ---
    private OrderDto validateReturnEligibility(Long orderId, Long userId) {
        OrderDto order = orderClient.getOrderById(orderId);

        if (!order.getUserId().equals(userId)) {
            throw new ValidationException("Order access denied");
        }

        if (order.getStatus() != OrderDto.OrderStatus.DELIVERED &&
                order.getStatus() != OrderDto.OrderStatus.PARTIALLY_RETURNED) {
            throw new ValidationException("Order not eligible for return");
        }

        if (LocalDateTime.now().isAfter(order.getRefundDeadline())) {
            throw new ValidationException("Return window expired");
        }

        return order;
    }


    // Remaining Qty = Original Qty - (Active Returns) + (Cancelled Returns)
    private int getRemainingReturnableQuantity(OrderItemDto orderItem) {
        Integer activeReturnedQty = returnItemRepository.sumQuantitiesByOrderItemAndStatusIn(
                orderItem.getId(),
                List.of(
                        ReturnRequest.Status.REQUESTED,
                        ReturnRequest.Status.APPROVED,
                        ReturnRequest.Status.PROCESSED,
                        ReturnRequest.Status.REFUND_INITIATED,
                        ReturnRequest.Status.REFUNDED
                )
        );

        Integer cancelledReturnedQty = returnItemRepository.sumQuantitiesByOrderItemAndStatusIn(
                orderItem.getId(),
                List.of(ReturnRequest.Status.CANCELLED)
        );

        int totalReserved = (activeReturnedQty != null ? activeReturnedQty : 0);
        int totalCancelled = (cancelledReturnedQty != null ? cancelledReturnedQty : 0);

        return orderItem.getQuantity() - totalReserved + totalCancelled;
    }

    private void createFullReturnItems(OrderDto order, ReturnRequest returnRequest) {
        order.getItems().forEach(orderItem -> {
            int remainingQty = getRemainingReturnableQuantity(orderItem);
            if (remainingQty <= 0) {
                throw new ValidationException(
                        "Cannot process full return: Item " + orderItem.getId() +
                                " has no remaining quantity to return"
                );
            }

            ReturnItem returnItem = new ReturnItem();
            returnItem.setReturnRequest(returnRequest);
            returnItem.setOrderItemId(orderItem.getId());
            returnItem.setQuantity(remainingQty);
            returnItem.setRefundAmount(
                    orderItem.getPrice()
                            .multiply(BigDecimal.valueOf(remainingQty))
                            .multiply(new BigDecimal("1.18"))
            );
            returnRequest.getReturnItems().add(returnItem);
        });
    }

    private void createPartialReturnItems(List<ReturnItemRequest> items, ReturnRequest returnRequest, OrderDto order) {
        items.forEach(item -> {
            OrderItemDto orderItem = order.getItems().stream()
                    .filter(i -> i.getId().equals(item.getOrderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ValidationException("Order item not found"));

            ReturnItem returnItem = new ReturnItem();
            returnItem.setReturnRequest(returnRequest);
            returnItem.setOrderItemId(orderItem.getId());
            returnItem.setQuantity(item.getQuantity());
            returnItem.setRefundAmount(
                    orderItem.getPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity()))
                            .multiply(new BigDecimal("1.18")) // GST
            );
            returnRequest.getReturnItems().add(returnItem);
        });
    }

    private void validatePartialReturnItems(List<ReturnItemRequest> items, OrderDto order) {
        if (items == null || items.isEmpty()) {
            throw new ValidationException("Partial return requires items");
        }

        items.forEach(item -> {
            OrderItemDto orderItem = order.getItems().stream()
                    .filter(i -> i.getId().equals(item.getOrderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ValidationException("Order item not found"));


            int remainingQty = getRemainingReturnableQuantity(orderItem);
            if (item.getQuantity() > remainingQty) {
                throw new ValidationException(String.format("Return quantity exceeds remaining quantity. Requested: %d, Available: %d",
                        item.getQuantity(), remainingQty)
                );
            }
        });
    }

    private void restockItems(ReturnRequest returnRequest) {
        returnRequest.getReturnItems().forEach(returnItem -> {
            OrderItemDto orderItem = orderClient.getOrderItemById(returnItem.getOrderItemId());
            productClient.incrementStock(orderItem.getProductId(), returnItem.getQuantity());
        });
    }

    // Edge Case: Prevent duplicate returns for same order
    private void validateNoExistingReturn(OrderDto order) {
        if (returnRequestRepository.existsByOrderIdAndStatusIn(order.getId(),
                List.of(ReturnRequest.Status.REQUESTED,
                        ReturnRequest.Status.APPROVED))) {
            throw new ValidationException("Active return already exists.");
        }
        else if (returnRequestRepository.existsByOrderIdAndStatusIn(order.getId(),
                List.of(ReturnRequest.Status.PROCESSED))) {
            throw new ValidationException("Return already processed.");
        }
        else if (returnRequestRepository.existsByOrderIdAndStatusIn(order.getId(),
                List.of(ReturnRequest.Status.REFUND_INITIATED))) {
            throw new ValidationException("Return already processed. Refund initiated.");
        }
        else if (returnRequestRepository.existsByOrderIdAndStatusIn(order.getId(),
                List.of(ReturnRequest.Status.REFUNDED))) {
            throw new ValidationException("Return already processed and refunded.");
        }
    }
}