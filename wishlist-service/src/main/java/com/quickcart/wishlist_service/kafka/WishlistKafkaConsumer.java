package com.quickcart.wishlist_service.kafka;

import com.quickcart.common.event.UserDeletedEvent;
import com.quickcart.wishlist_service.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WishlistKafkaConsumer {

    private static final Logger logger = LoggerFactory.getLogger(WishlistKafkaConsumer.class);
    private final WishlistRepository wishlistRepository;

    @KafkaListener(topics = "user-deleted-topic", groupId = "wishlist-service-group")
    public void consumeUserDeleted(UserDeletedEvent event) {
        logger.info("Consumed UserDeletedEvent: {}", event);

        wishlistRepository.findByUserId(event.getUserId())
                .ifPresent(wishlist -> {
                    wishlistRepository.delete(wishlist);
                    logger.info("Deleted wishlist for userId: {}", event.getUserId());
                });
    }
}