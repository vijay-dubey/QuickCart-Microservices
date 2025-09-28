package com.quickcart.user_service.kafka;

import com.quickcart.common.event.UserDeletedEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserKafkaProducer {

    private static final Logger logger = LoggerFactory.getLogger(UserKafkaProducer.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "user-deleted-topic";

    public void sendUserDeletedEvent(UserDeletedEvent event) {
        kafkaTemplate.send(TOPIC, event);
        logger.info("🔁 UserDeletedEvent sent to Kafka topic '{}': {}", TOPIC, event);
    }
}
