CREATE DATABASE IF NOT EXISTS quickcart_ms_db;

USE quickcart_ms_db;

DROP TABLE IF EXISTS return_requests;
DROP TABLE IF EXISTS return_items;



CREATE TABLE return_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    type ENUM('FULL','PARTIAL') NOT NULL,
    status ENUM('REQUESTED', 'APPROVED', 'PROCESSED', 'REFUND_INITIATED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE return_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    return_request_id BIGINT NOT NULL,
    order_item_id BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    refund_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (return_request_id) REFERENCES return_requests(id)
);