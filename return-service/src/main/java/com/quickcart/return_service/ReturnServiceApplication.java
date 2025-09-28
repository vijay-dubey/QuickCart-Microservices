package com.quickcart.return_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.quickcart.return_service.feign")
@ComponentScan(basePackages = {"com.quickcart.return_service", "com.quickcart.common"})
public class ReturnServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReturnServiceApplication.class, args);
	}

}
