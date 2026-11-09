import { PageSlug } from '@tro-oi/shared';

interface TemplateContext {
  siteName: string;
  contactEmail: string;
}

/**
 * BẢN NHÁP để admin chèn vào trình soạn ở /quan-tri/trang-chinh-sach, KHÔNG phải văn bản pháp lý.
 * Chỉ mô tả cách hệ thống đang hoạt động thật (dữ liệu thu thập, bên thứ ba, thời hạn...).
 * Thông tin pháp lý không suy ra được từ code để ở dạng [[...]] — API từ chối đăng khi còn [[.
 * Sửa tính năng liên quan dữ liệu người dùng → cập nhật bản nháp này.
 */
export const POLICY_TEMPLATES: Record<PageSlug, (context: TemplateContext) => string> = {
  [PageSlug.TERMS]: ({ siteName, contactEmail }) => `## 1. Giới thiệu
${siteName} là nền tảng trực tuyến giúp người dùng đăng và tìm tin cho thuê, mua bán nhà ở (phòng trọ, căn hộ, nhà nguyên căn, ở ghép) và rao bán đồ cũ (Chợ ơi). Website do [[Tên đơn vị / cá nhân vận hành]] vận hành, địa chỉ liên hệ: [[Địa chỉ]], email: ${contactEmail}.
Khi đăng nhập và sử dụng ${siteName}, bạn đồng ý với các điều khoản dưới đây. Điều khoản có hiệu lực từ ngày [[Ngày hiệu lực]].

## 2. Tài khoản
- Bạn đăng nhập bằng số điện thoại và mã xác thực (OTP). Bạn chịu trách nhiệm giữ an toàn thiết bị và tài khoản của mình.
- Mỗi người dùng chịu trách nhiệm về mọi hoạt động thực hiện từ tài khoản của mình.
- Quản trị viên có thể khoá tài khoản vi phạm điều khoản. Tài khoản bị khoá không đăng nhập và không thao tác được.

## 3. Đăng tin và nội dung người dùng
- Tin đăng, ảnh, video, mô tả, tin nhắn và đánh giá do người dùng tự cung cấp và tự chịu trách nhiệm về tính chính xác, hợp pháp.
- Không đăng nội dung lừa đảo, sai sự thật (giá, địa chỉ, hình ảnh), tin trùng lặp, nội dung không phù hợp hoặc vi phạm pháp luật.
- Tin có thể phải chờ quản trị viên duyệt trước khi hiển thị. Tin Trọ ơi hiển thị 30 ngày, sau đó tự hết hạn; chủ tin có thể gia hạn tại Kênh người đăng.
- Người dùng khác có thể báo cáo tin vi phạm. Quản trị viên có quyền ẩn hoặc xoá tin vi phạm mà không cần báo trước; chủ tin sẽ nhận được thông báo trên website.
- Video được nhúng từ YouTube theo đường link chủ tin cung cấp và tuân theo điều khoản của YouTube.

## 4. Nhắn tin và đánh giá
- Tính năng nhắn tin dùng để trao đổi về tin đăng hoặc món đồ. Không gửi nội dung quấy rối, quảng cáo rác hoặc vi phạm pháp luật.
- Chỉ người đã nhắn tin trao đổi với nhau mới đánh giá được nhau. Đánh giá phải trung thực; quản trị viên có quyền xoá đánh giá vi phạm.

## 5. Giao dịch giữa người dùng
${siteName} là nền tảng kết nối, không phải bên cho thuê, bên bán hay môi giới trong giao dịch. Người dùng tự kiểm tra thông tin, xem nhà/xem đồ trực tiếp và tự chịu trách nhiệm khi đặt cọc, thanh toán, ký hợp đồng. [[Giới hạn trách nhiệm của đơn vị vận hành]]

## 6. Thay đổi dịch vụ và điều khoản
Chúng tôi có thể thay đổi tính năng hoặc cập nhật điều khoản. Bản cập nhật có hiệu lực khi được đăng trên trang này (xem "Cập nhật ngày" ở đầu trang).

## 7. Luật áp dụng và giải quyết tranh chấp
[[Luật áp dụng và cơ quan giải quyết tranh chấp]]

## 8. Liên hệ
Mọi câu hỏi, khiếu nại về điều khoản xin gửi tới ${contactEmail}.`,

  [PageSlug.PRIVACY]: ({ siteName, contactEmail }) => `## 1. Phạm vi
Chính sách này mô tả cách ${siteName} ([[Tên đơn vị / cá nhân vận hành]]) thu thập, sử dụng và bảo vệ dữ liệu cá nhân của người dùng. Căn cứ pháp lý: [[Văn bản pháp luật về bảo vệ dữ liệu cá nhân đang áp dụng]]. Có hiệu lực từ ngày [[Ngày hiệu lực]].

## 2. Dữ liệu chúng tôi thu thập
- Thông tin tài khoản: số điện thoại (để đăng nhập), tên hiển thị, email (nếu bạn cung cấp), ảnh đại diện, ảnh bìa, lời giới thiệu.
- Nội dung bạn đăng: tin cho thuê/mua bán, món đồ rao bán (ảnh, địa chỉ, giá, mô tả, tiện ích, link video), đánh giá, báo cáo vi phạm.
- Tin nhắn trao đổi giữa bạn và người dùng khác.
- Dữ liệu sử dụng: tin và món đồ đã lưu, tìm kiếm đã lưu, thông báo, số lượt xem tin (đếm chung, không gắn với danh tính người xem).

## 3. Mục đích sử dụng
- Xác thực đăng nhập và duy trì phiên đăng nhập.
- Hiển thị tin đăng, hồ sơ công khai và cho phép người dùng liên hệ với nhau.
- Gửi thông báo trên website: tin được duyệt/bị ẩn, tin sắp hết hạn, đánh giá mới, tin mới khớp tìm kiếm đã lưu.
- Kiểm duyệt nội dung, xử lý báo cáo vi phạm, ngăn chặn lừa đảo và lạm dụng.

## 4. Thông tin hiển thị công khai
- Hồ sơ công khai: tên, ảnh đại diện, ảnh bìa, vai trò, lời giới thiệu, ngày tham gia, các tin đang hiển thị và đánh giá. Hồ sơ công khai không hiển thị email.
- Trên trang tin đăng, số điện thoại của người đăng được hiển thị cho người xem khi bấm "Hiện số" và dùng cho nút liên hệ Zalo.
- Đánh giá hiển thị kèm tên và ảnh đại diện của người viết.
- Ảnh bạn tải lên có thể được truy cập công khai qua đường link ảnh.

## 5. Tin nhắn
Tin nhắn chỉ hiển thị cho hai người trong cuộc trò chuyện trên website. [[Trường hợp đơn vị vận hành được truy cập nội dung tin nhắn, ví dụ: xử lý khiếu nại, yêu cầu của cơ quan có thẩm quyền]]

## 6. Cookie và lưu trữ trên trình duyệt
- Cookie đăng nhập (accessToken) để giữ phiên đăng nhập, hết hạn sau 7 ngày hoặc khi bạn đăng xuất.
- Cookie ghi nhớ lựa chọn giao diện sáng/tối.
- Lịch sử tin đã xem (tối đa 15 tin) lưu ngay trên trình duyệt của bạn, không gửi về máy chủ; bạn có thể xoá bằng cách xoá dữ liệu trang web trong trình duyệt.
- Chúng tôi không dùng cookie quảng cáo hoặc công cụ phân tích hành vi của bên thứ ba.

## 7. Dịch vụ bên thứ ba
- Google Firebase: gửi và xác thực mã OTP qua số điện thoại.
- YouTube (chế độ youtube-nocookie): phát video nhúng trong tin đăng.
- OpenStreetMap: hiển thị bản đồ vị trí tin đăng.
- Zalo: chỉ khi bạn bấm nút liên hệ Zalo.
Các dịch vụ này có chính sách bảo mật riêng.

## 8. Thời gian lưu trữ
- Thông báo được tự động xoá sau 90 ngày.
- Tin đăng hết hạn sau 30 ngày được ẩn khỏi tìm kiếm nhưng vẫn lưu để chủ tin gia hạn, cho tới khi chủ tin hoặc quản trị viên xoá.
- Dữ liệu tài khoản, tin nhắn và đánh giá: [[Thời hạn lưu trữ và thời điểm xoá]]

## 9. Quyền của bạn
- Xem và sửa thông tin hồ sơ tại Trang cá nhân; sửa, ẩn hoặc xoá tin đăng tại Kênh người đăng; xoá đánh giá do mình viết.
- Yêu cầu xoá tài khoản hoặc trích xuất dữ liệu: gửi email tới ${contactEmail}. Chúng tôi phản hồi trong vòng [[Số ngày]] ngày làm việc.
- [[Các quyền khác của chủ thể dữ liệu theo pháp luật áp dụng]]

## 10. Bảo mật
Mật khẩu không được sử dụng (đăng nhập bằng OTP). Phiên đăng nhập dùng token có thời hạn; quản trị viên chỉ thao tác qua trang quản trị và mọi thao tác kiểm duyệt đều được ghi nhật ký. [[Biện pháp bảo mật hạ tầng: máy chủ, sao lưu, mã hoá kết nối]]

## 11. Liên hệ
Câu hỏi về dữ liệu cá nhân xin gửi tới ${contactEmail}.`,
};
