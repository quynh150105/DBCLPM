package com.ivy.moda.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    private OrderDto order;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderDto {
        private String id;
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private String shippingAddress;
        private String paymentMethod;
        private Integer totalAmount;
        private Object items; // Can accept List of maps or objects dynamically
        private String status;
    }
}
