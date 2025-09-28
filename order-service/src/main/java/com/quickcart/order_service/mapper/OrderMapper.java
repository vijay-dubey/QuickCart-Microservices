package com.quickcart.order_service.mapper;

import com.quickcart.order_service.dto.response.OrderResponse;
import com.quickcart.order_service.model.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;

@Mapper(componentModel = "spring", uses = {OrderItemMapper.class})
public interface OrderMapper {

    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "shippingAddressId", source = "shippingAddressId")
    @Mapping(target = "grandTotal", expression = "java(calculateGrandTotal(order))")
    @Mapping(target = "cancelledAt", source = "cancelledAt")
    @Mapping(target = "cancellationReason", source = "cancellationReason")
    OrderResponse toResponse(Order order);

    default BigDecimal calculateGrandTotal(Order order) {
        if (order == null) return BigDecimal.ZERO;

        BigDecimal total = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal shipping = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal cgst = order.getCgstAmount() != null ? order.getCgstAmount() : BigDecimal.ZERO;
        BigDecimal sgst = order.getSgstAmount() != null ? order.getSgstAmount() : BigDecimal.ZERO;

        return total.add(shipping).add(cgst).add(sgst);
    }
}