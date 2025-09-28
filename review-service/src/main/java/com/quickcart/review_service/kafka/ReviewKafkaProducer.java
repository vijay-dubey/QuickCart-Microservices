package com.quickcart.review_service.kafka;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReviewKafkaProducer {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReviewKafkaProducer.class);
    private final KafkaTemplate<String, String> kafkaTemplate;

    public void sendReviewEvent(String event) {
        kafkaTemplate.send("review-events", event);
        LOGGER.info("🔊 Kafka event sent: {}", event);
    }
}
