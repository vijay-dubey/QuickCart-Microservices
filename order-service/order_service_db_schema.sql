CREATE DATABASE IF NOT EXISTS quickcart_ms_db;

USE quickcart_ms_db;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;


CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL, 
    shipping_address_id BIGINT NOT NULL, 
    status ENUM('ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'PARTIALLY_RETURNED', 'REFUND_INITIATED') NOT NULL DEFAULT 'ORDER_PLACED',
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    payment_method ENUM('COD', 'UPI', 'NET_BANKING', 'CREDIT_CARD', 'DEBIT_CARD') NOT NULL DEFAULT 'COD',
    payment_id VARCHAR(100),
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason VARCHAR(255) NULL,
    tracking_number VARCHAR(100),
    expected_delivery_date TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 90.00,
    cgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    refund_deadline TIMESTAMP
);

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL, 
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image_url VARCHAR(512),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
