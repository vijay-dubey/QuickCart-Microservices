package com.quickcart.return_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import com.quickcart.common.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", configuration = FeignClientConfig.class)
public interface UserClient {

    @GetMapping("/api/users/id/{id}")
    UserDto getUserById(@PathVariable("id") Long id);

    @GetMapping("/api/users/email/{email}")
    UserDto getUserByEmail(@PathVariable("email") String email);

}