package com.ivy.moda.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivy.moda.dto.OrderRequest;
import com.ivy.moda.model.Order;
import com.ivy.moda.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*") // Allows seamless connection from React frontend on port 3000
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    public OrderController(OrderRepository orderRepository, ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
        if (request.getOrder() == null || request.getOrder().getId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thông tin đơn hàng không hợp lệ."));
        }

        OrderRequest.OrderDto dto = request.getOrder();

        try {
            // Serialize items object/list to JSON String to save in MySQL
            String serializedItems = objectMapper.writeValueAsString(dto.getItems());

            Order order = Order.builder()
                    .orderId(dto.getId())
                    .customerName(dto.getCustomerName())
                    .customerPhone(dto.getCustomerPhone())
                    .customerEmail(dto.getCustomerEmail() != null ? dto.getCustomerEmail().toLowerCase().trim() : null)
                    .shippingAddress(dto.getShippingAddress())
                    .paymentMethod(dto.getPaymentMethod())
                    .totalAmount(dto.getTotalAmount())
                    .items(serializedItems)
                    .status(dto.getStatus() != null ? dto.getStatus() : "Đang xử lý")
                    .build();

            Order savedOrder = orderRepository.save(order);

            // Format order back to send to user, deserializing items back to JSON structure
            Map<String, Object> formattedOrder = formatOrderResponse(savedOrder);

            return ResponseEntity.ok(Map.of("success", true, "order", formattedOrder));

        } catch (Exception e) {
            logger.error("Error saving order:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể lưu đơn hàng."));
        }
    }

    @GetMapping
    public ResponseEntity<?> getOrders(@RequestParam(value = "email", required = false) String email) {
        try {
            List<Order> orders;
            if (email != null && !email.trim().isEmpty()) {
                orders = orderRepository.findByCustomerEmailOrderByCreatedAtDesc(email.toLowerCase().trim());
            } else {
                orders = orderRepository.findAllByOrderByCreatedAtDesc();
            }

            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Order o : orders) {
                responseList.add(formatOrderResponse(o));
            }

            return ResponseEntity.ok(responseList);

        } catch (Exception e) {
            logger.error("Error fetching order history:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể tải danh sách đơn hàng."));
        }
    }

    /**
     * Formats order entity to match the expected format on frontend, 
     * deserializing the items JSON string back into native JSON structures.
     */
    private Map<String, Object> formatOrderResponse(Order o) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", o.getOrderId());
        map.put("customerName", o.getCustomerName());
        map.put("customerPhone", o.getCustomerPhone());
        map.put("customerEmail", o.getCustomerEmail());
        map.put("shippingAddress", o.getShippingAddress());
        map.put("paymentMethod", o.getPaymentMethod());
        map.put("totalAmount", o.getTotalAmount());
        map.put("status", o.getStatus());

        if (o.getCreatedAt() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            map.put("date", o.getCreatedAt().format(formatter));
        } else {
            map.put("date", "");
        }

        try {
            // Deserialize raw JSON text back into dynamic lists/maps for client-side consumption
            Object itemsObj = objectMapper.readValue(o.getItems(), Object.class);
            map.put("items", itemsObj);
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse order items text back to JSON structure for order {}", o.getOrderId(), e);
            map.put("items", o.getItems()); // Fallback to raw string if parsing fails
        }

        return map;
    }
}
