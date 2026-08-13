# HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY BACKEND SPRING BOOT (MYSQL + FIREBASE AUTH)

Mã nguồn này được thiết kế để kết nối trực tiếp với giao diện frontend React của ứng dụng IVY moda, thay thế cho Express server hiện tại để cung cấp một môi trường production vững chắc sử dụng **Spring Boot**, **MySQL** và **Firebase Authentication**.

---

## 1. Yêu Cầu Hệ Thống
* **Java**: JDK 17 trở lên.
* **Maven**: Phiên bản 3.8.x trở lên.
* **MySQL Database**: Đang chạy cục bộ (local) hoặc đám mây (cloud) trên cổng `3306`.

---

## 2. Cấu Hình Cơ Sở Dữ Liệu MySQL

Trong file `/src/main/resources/application.properties`, hệ thống đã được thiết lập sẵn thông tin kết nối mà bạn cung cấp:
* **Tên DB**: `ivy_moda` (Tự động khởi tạo nếu chưa có: `createDatabaseIfNotExist=true`).
* **Tên Đăng Nhập**: `root`
* **Mật khẩu**: `Mhun@1311`

Nếu thông tin thay đổi, bạn có thể chỉnh sửa trực tiếp các tham số sau trong file `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ivy_moda?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=Mhun@1311
```

> **Lưu ý quan trọng**: Nhờ thuộc tính `spring.jpa.hibernate.ddl-auto=update`, khi dự án khởi chạy lần đầu tiên, **Spring Boot sẽ tự động tạo cấu trúc bảng (`users`, `orders`) trong MySQL cho bạn** mà không cần phải chạy file SQL thủ công!

---

## 3. Khởi Tạo Xác Thực Đăng Nhập Google (Tùy Chọn)

Đăng nhập bằng Google trên ứng dụng sử dụng cơ chế bảo mật **Firebase Authentication**:
1. Truy cập vào [Firebase Console](https://console.firebase.google.com/).
2. Nhấp vào biểu tượng Răng Cưa (Project Settings) -> **Service Accounts**.
3. Chọn **Generate New Private Key** để tải file khóa bảo mật dạng JSON về máy.
4. Đổi tên file vừa tải thành `firebase-service-account.json`.
5. Đặt file này vào thư mục nguồn tài nguyên của dự án:
   `springboot-backend/src/main/resources/firebase-service-account.json`

> **Chế độ phát triển dự phòng**: Nếu bạn không cấu hình file này, hệ thống sẽ log cảnh báo và **tự động chuyển sang chế độ giả lập xác thực** trên môi trường local để bạn có thể tiếp tục thử nghiệm tính năng Đăng nhập bằng Google mà không bị chặn lỗi crash server.

---

## 4. Cách Chạy Backend Spring Boot

Từ thư mục `/springboot-backend`, mở terminal và chạy các câu lệnh sau:

### Trình biên dịch và đóng gói (Sử dụng Maven Wrapper hoặc Maven đã cài đặt):
```bash
# Trên Windows
mvnw clean package

# Trên macOS/Linux
./mvnw clean package
```

### Chạy ứng dụng Spring Boot:
```bash
# Trên Windows
mvnw spring-boot:run

# Trên macOS/Linux
./mvnw spring-boot:run
```

Sau khi khởi động thành công, backend sẽ hoạt động tại địa chỉ: **`http://localhost:8080`**.

---

## 5. Kết Nối Frontend React Với Spring Boot Backend

Trong môi trường lập trình local, để React frontend kết nối mượt mà tới Spring Boot:

### Cách 1: Cấu hình Proxy trong Vite (`vite.config.ts`)
Mở file `vite.config.ts` ở thư mục gốc của frontend và cấu hình proxy cho các request `/api` hướng về cổng `8080` của Spring Boot:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### Cách 2: Gọi trực tiếp địa chỉ Full URL trên Frontend
Trong React (`App.tsx`), thay vì gọi `fetch('/api/...')`, bạn có thể chỉ định rõ URL backend:
`fetch('http://localhost:8080/api/...')`
*(Do backend Spring Boot đã được kích hoạt `@CrossOrigin(origins = "*")` trên tất cả các controller nên bạn sẽ không gặp lỗi CORS).*
