package com.ivy.moda.controller;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.ivy.moda.dto.GoogleLoginRequest;
import com.ivy.moda.dto.LoginRequest;
import com.ivy.moda.dto.RegisterRequest;
import com.ivy.moda.model.User;
import com.ivy.moda.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allows seamless connection from React frontend on port 3000
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        String idToken = request.getIdToken();
        if (idToken == null || idToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu ID Token."));
        }

        try {
            String uid;
            String email;
            String name;

            // Check if Firebase is initialized
            if (!FirebaseApp.getApps().isEmpty()) {
                // Verify Firebase ID Token
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                uid = decodedToken.getUid();
                email = decodedToken.getEmail();
                name = decodedToken.getName();
            } else {
                // Fallback for local development when service account JSON is not yet set up
                logger.warn("Firebase Admin SDK is not initialized. Using simulated verification for Google Login.");
                uid = "dev_simulated_uid_" + UUID.randomUUID().toString().substring(0, 8);
                email = "user@gmail.com";
                name = "Google User";
            }

            if (email == null) {
                email = uid + "@noemail.com";
            }
            if (name == null) {
                name = email.split("@")[0];
            }

            final String finalEmail = email.toLowerCase().trim();
            final String finalName = name.trim();

            // Find or create User in MySQL Database
            User user = userRepository.findByUid(uid)
                    .orElseGet(() -> userRepository.findByEmail(finalEmail)
                            .orElse(new User()));

            user.setUid(uid);
            user.setEmail(finalEmail);
            user.setName(finalName);
            if (user.getPhone() == null) {
                user.setPhone("");
            }

            User savedUser = userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("uid", savedUser.getUid());
            response.put("name", savedUser.getName());
            response.put("email", savedUser.getEmail());
            response.put("phone", savedUser.getPhone());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error during Google Login token verification:", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Xác thực Google Sign-In thất bại. Vui lòng thử lại."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getName() == null || request.getEmail() == null || request.getPhone() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng điền đầy đủ các thông tin bắt buộc."));
        }

        String email = request.getEmail().toLowerCase().trim();

        try {
            Optional<User> existing = userRepository.findByEmail(email);
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email này đã được sử dụng."));
            }

            String offlineUid = "offline_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 5);
            User user = User.builder()
                    .uid(offlineUid)
                    .name(request.getName().trim())
                    .email(email)
                    .phone(request.getPhone().trim())
                    .build();

            User saved = userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("uid", saved.getUid());
            response.put("name", saved.getName());
            response.put("email", saved.getEmail());
            response.put("phone", saved.getPhone());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error creating user:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể đăng ký tài khoản. Vui lòng thử lại sau."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập email và mật khẩu."));
        }

        String email = request.getEmail().toLowerCase().trim();
        String password = request.getPassword();

        try {
            Optional<User> matched = userRepository.findByEmail(email);
            if (matched.isPresent()) {
                User user = matched.get();
                Map<String, Object> response = new HashMap<>();
                response.put("uid", user.getUid());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("phone", user.getPhone());
                return ResponseEntity.ok(response);
            }

            // Demo fallback registration
            if (password.length() >= 6) {
                String offlineUid = "offline_" + System.currentTimeMillis();
                User user = User.builder()
                        .uid(offlineUid)
                        .email(email)
                        .name(email.split("@")[0].toUpperCase())
                        .phone("0987654321")
                        .build();

                User saved = userRepository.save(user);

                Map<String, Object> response = new HashMap<>();
                response.put("uid", saved.getUid());
                response.put("name", saved.getName());
                response.put("email", saved.getEmail());
                response.put("phone", saved.getPhone());
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Tên đăng nhập hoặc mật khẩu chưa chính xác (Mật khẩu cần tối thiểu 6 ký tự)."));

        } catch (Exception e) {
            logger.error("Error logging in:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hệ thống khi đăng nhập."));
        }
    }
}
