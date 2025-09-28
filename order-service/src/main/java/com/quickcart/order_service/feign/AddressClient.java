package com.quickcart.order_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import com.quickcart.common.dto.AddressDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "address-service", configuration = FeignClientConfig.class)
public interface AddressClient {

    @GetMapping("/api/addresses/{id}")
    AddressDto getAddressById(@PathVariable("id") Long id);
}
