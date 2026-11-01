# Tài liệu dự án Trọ Ơi! (đọc trước khi code)

Thư mục này là **nguồn sự thật duy nhất** cho người và AI khi làm việc với repo.

| File                                           | Nội dung                                                        |
| ---------------------------------------------- | --------------------------------------------------------------- |
| [coding-rules.md](coding-rules.md)             | Quy tắc code bắt buộc (chung, web, api) + checklist trước commit |
| [project-structure.md](project-structure.md)   | Cấu trúc monorepo, route web, component, luồng dữ liệu, env     |
| [api.md](api.md)                               | Hợp đồng REST API: endpoint, request, response, auth, lỗi       |

## Quy tắc bắt buộc về tài liệu

1. **Đọc** 3 file trên trước khi sửa code.
2. **Mỗi thay đổi code phải cập nhật docs trong cùng commit**:
   - Thêm/sửa/xoá endpoint, DTO, field schema → `api.md`.
   - Thêm/xoá route, component dùng chung, store, thư mục, biến env → `project-structure.md`.
   - Thêm quy ước mới / đổi tool format-lint → `coding-rules.md`.
3. Docs mô tả **trạng thái hiện tại** của code, không mô tả kế hoạch. Việc chưa làm ghi ở mục "Chưa làm" cuối `project-structure.md`.
4. Viết tiếng Việt, ngắn gọn, ưu tiên bảng và ví dụ code.
