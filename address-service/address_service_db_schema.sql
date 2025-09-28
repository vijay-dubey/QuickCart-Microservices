CREATE DATABASE IF NOT EXISTS quickcart_ms_db;

USE quickcart_ms_db;

DROP TABLE IF EXISTS addresses;

CREATE TABLE addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(16) NOT NULL,
    recipient_email VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    landmark VARCHAR(255),
    type ENUM('HOME', 'WORK', 'OTHER') NOT NULL DEFAULT 'HOME',
    is_default BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
