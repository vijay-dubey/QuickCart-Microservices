package com.quickcart.cart_service.kafka;

import com.quickcart.cart_service.repository.CartRepository;
import com.quickcart.common.event.UserDeletedEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CartKafkaConsumer {

    private static final Logger logger = LoggerFactory.getLogger(CartKafkaConsumer.class);
    private final CartRepository cartRepository;

    @KafkaListener(topics = "user-deleted-topic", groupId = "cart-service-group")
    public void consumeUserDeleted(UserDeletedEvent event) {
        logger.info("Consumed UserDeletedEvent: {}", event);

        cartRepository.findByUserId(event.getUserId())
                .ifPresent(cart -> {
                    cartRepository.delete(cart);
                    logger.info("Deleted cart for userId: {}", event.getUserId());
                });
    }
}
