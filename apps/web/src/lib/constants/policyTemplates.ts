import { PageSlug } from '@tro-oi/shared';

interface TemplateContext {
  siteName: string;
  contactEmail: string;
  /** Hotline trong thiết lập website (bỏ trống → chỉ ghi email). */
  contactPhone?: string;
  /** Ngày hiệu lực dd/mm/yyyy (ngày admin chèn mẫu). */
  effectiveDate: string;
}

/** "email: a@b.vn, hotline: 09..." — chỉ ghi kênh có cấu hình. */
const contactLine = ({ contactEmail, contactPhone }: TemplateContext) =>
  [`email ${contactEmail}`, contactPhone && `hotline ${contactPhone}`].filter(Boolean).join(', ');

/**
 * Mẫu Điều khoản / Chính sách bảo mật để admin chèn ở /quan-tri/trang-chinh-sach.
 * Chỉ mô tả cách hệ thống đang hoạt động thật (dữ liệu thu thập, bên thứ ba, thời hạn...) và các
 * cam kết chung theo pháp luật Việt Nam — không ghi tên / địa chỉ / số đăng ký không có trong hệ thống.
 * Sửa tính năng liên quan dữ liệu người dùng → cập nhật mẫu này. Văn bản nên được người có chuyên môn
 * pháp lý rà soát trước khi vận hành chính thức. Admin vẫn có thể thêm ô [[...]]: API từ chối đăng khi còn.
 */
export const POLICY_TEMPLATES: Record<PageSlug, (context: TemplateContext) => string> = {
  [PageSlug.TERMS]: (context) => {
    const { siteName, contactEmail, effectiveDate } = context;
    return `## 1. Giới thiệu
${siteName} là nền tảng trực tuyến giúp người dùng đăng và tìm tin cho thuê, mua bán nhà ở (phòng trọ, căn hộ, nhà nguyên căn, ở ghép) và rao bán đồ cũ (Chợ ơi). Website do Ban quản trị ${siteName} vận hành; liên hệ qua ${contactLine(context)}.
Khi đăng nhập và sử dụng ${siteName}, bạn đồng ý với các điều khoản dưới đây và với Chính sách bảo mật. Điều khoản có hiệu lực từ ngày ${effectiveDate}.

## 2. Tài khoản
- Bạn cần đủ 18 tuổi, hoặc được cha mẹ / người giám hộ hợp pháp đồng ý và giám sát khi sử dụng.
- Bạn đăng nhập bằng số điện thoại và mã xác thực (OTP). Bạn chịu trách nhiệm giữ an toàn thiết bị và tài khoản của mình, và về mọi hoạt động thực hiện từ tài khoản đó.
- Quản trị viên có thể khoá tài khoản vi phạm điều khoản. Tài khoản bị khoá không đăng nhập và không thao tác được.
- Bạn có thể tự xoá tài khoản bất cứ lúc nào tại Trang cá nhân > Dữ liệu & tài khoản.

## 3. Đăng tin và nội dung người dùng
- Tin đăng, ảnh, video, mô tả, tin nhắn và đánh giá do người dùng tự cung cấp và tự chịu trách nhiệm về tính chính xác, hợp pháp. Bạn cam kết có quyền sử dụng ảnh và nội dung mình đăng.
- Không đăng nội dung lừa đảo, sai sự thật (giá, địa chỉ, hình ảnh), tin trùng lặp, hàng hoá cấm kinh doanh, nội dung xúc phạm, xâm phạm quyền và lợi ích hợp pháp của người khác hoặc vi phạm pháp luật Việt Nam.
- Tin có thể phải chờ quản trị viên duyệt trước khi hiển thị. Tin Trọ ơi hiển thị 30 ngày, sau đó tự hết hạn; chủ tin có thể gia hạn tại Kênh người đăng.
- Người dùng khác có thể báo cáo tin hoặc đánh giá vi phạm. Quản trị viên có quyền ẩn hoặc xoá nội dung vi phạm mà không cần báo trước; chủ tin nhận được thông báo kèm lý do (nếu có).
- Video được nhúng từ YouTube theo đường link chủ tin cung cấp và tuân theo điều khoản của YouTube.

## 4. Nhắn tin và đánh giá
- Tính năng nhắn tin (chữ và ảnh) dùng để trao đổi về tin đăng hoặc món đồ. Không gửi nội dung quấy rối, quảng cáo rác hoặc vi phạm pháp luật.
- Chỉ người đã nhắn tin trao đổi với nhau mới đánh giá được nhau. Đánh giá phải trung thực; quản trị viên có quyền xoá đánh giá vi phạm.

## 5. Giao dịch giữa người dùng và giới hạn trách nhiệm
- ${siteName} là nền tảng kết nối, không phải bên cho thuê, bên bán hay môi giới trong giao dịch. Người dùng tự kiểm tra thông tin, xem nhà / xem đồ trực tiếp và tự chịu trách nhiệm khi đặt cọc, thanh toán, ký hợp đồng.
- Không chuyển tiền đặt cọc khi chưa xem nhà, chưa xác minh người cho thuê hoặc chưa có thoả thuận bằng văn bản. Gặp dấu hiệu lừa đảo, hãy báo cáo tin và liên hệ cơ quan công an nơi gần nhất.
- Ban quản trị kiểm duyệt nội dung trong khả năng hợp lý nhưng không bảo đảm mọi tin đăng đều chính xác, và không chịu trách nhiệm về thiệt hại phát sinh từ giao dịch giữa người dùng, trừ trường hợp pháp luật quy định khác.
- Dịch vụ được cung cấp theo hiện trạng và có thể tạm gián đoạn để bảo trì, nâng cấp hoặc do sự cố ngoài tầm kiểm soát.

## 6. Thay đổi dịch vụ và điều khoản
Chúng tôi có thể thay đổi tính năng hoặc cập nhật điều khoản. Bản cập nhật có hiệu lực khi được đăng trên trang này (xem "Cập nhật ngày" ở đầu trang). Nếu tiếp tục sử dụng sau khi điều khoản thay đổi, bạn được xem là đồng ý với bản cập nhật.

## 7. Luật áp dụng và giải quyết tranh chấp
Điều khoản này được điều chỉnh bởi pháp luật nước Cộng hoà Xã hội Chủ nghĩa Việt Nam. Tranh chấp phát sinh được ưu tiên giải quyết bằng thương lượng, hoà giải; nếu không thành, các bên có quyền yêu cầu Toà án nhân dân có thẩm quyền giải quyết theo quy định của pháp luật.

## 8. Liên hệ
Mọi câu hỏi, khiếu nại về điều khoản xin gửi tới ${contactEmail}.`;
  },

  [PageSlug.PRIVACY]: (context) => {
    const { siteName, contactEmail, effectiveDate } = context;
    return `## 1. Phạm vi
Chính sách này mô tả cách ${siteName} (do Ban quản trị ${siteName} vận hành, liên hệ qua ${contactLine(context)}) thu thập, sử dụng và bảo vệ dữ liệu cá nhân của người dùng. Chính sách được xây dựng theo pháp luật Việt Nam về bảo vệ dữ liệu cá nhân (Luật Bảo vệ dữ liệu cá nhân và các văn bản hướng dẫn thi hành) và pháp luật về an ninh mạng. Có hiệu lực từ ngày ${effectiveDate}.
Bằng việc đăng nhập và sử dụng ${siteName}, bạn đồng ý cho chúng tôi xử lý dữ liệu cá nhân theo các mục đích nêu trong chính sách này. Bạn có thể rút lại sự đồng ý bằng cách xoá tài khoản hoặc liên hệ chúng tôi.

## 2. Dữ liệu chúng tôi thu thập
- Thông tin tài khoản: số điện thoại (để đăng nhập), tên hiển thị, email (nếu bạn cung cấp), ảnh đại diện, ảnh bìa, lời giới thiệu.
- Nội dung bạn đăng: tin cho thuê/mua bán, món đồ rao bán (ảnh, địa chỉ, vị trí ghim trên bản đồ, giá, mô tả, tiện ích, link video), đánh giá, báo cáo vi phạm.
- Tin nhắn (chữ và ảnh) trao đổi giữa bạn và người dùng khác.
- Dữ liệu sử dụng: tin và món đồ đã lưu, tìm kiếm đã lưu, thông báo, cài đặt nhận thông báo, số lượt xem tin (đếm chung, không gắn với danh tính người xem).
- Chúng tôi không thu thập dữ liệu cá nhân nhạy cảm (sức khoẻ, tôn giáo, sinh trắc học, tài chính...). Vui lòng không đăng các thông tin này trong tin đăng hoặc tin nhắn.

## 3. Mục đích sử dụng
- Xác thực đăng nhập và duy trì phiên đăng nhập.
- Hiển thị tin đăng, hồ sơ công khai và cho phép người dùng liên hệ với nhau.
- Gửi thông báo: tin được duyệt/bị ẩn (kèm lý do), tin sắp hết hạn, đánh giá mới, tin mới khớp tìm kiếm đã lưu, tin nhắn mới. Thông báo hiển thị trên website; ngoài ra qua thông báo đẩy của trình duyệt (khi bạn bật), email (khi bạn đã thêm email và chưa tắt) hoặc SMS (khi tính năng này được triển khai và bạn bật). Bạn bật / tắt từng kênh ở trang Thông báo.
- Kiểm duyệt nội dung, xử lý báo cáo vi phạm, ngăn chặn lừa đảo và lạm dụng.
Chúng tôi không bán dữ liệu cá nhân và không dùng dữ liệu cho quảng cáo.

## 4. Thông tin hiển thị công khai
- Hồ sơ công khai: tên, ảnh đại diện, ảnh bìa, vai trò, lời giới thiệu, ngày tham gia, các tin đang hiển thị và đánh giá. Hồ sơ công khai không hiển thị email.
- Trên trang tin đăng, số điện thoại của người đăng được hiển thị cho người xem khi bấm "Hiện số" và dùng cho nút liên hệ Zalo.
- Đánh giá hiển thị kèm tên và ảnh đại diện của người viết.
- Ảnh bạn tải lên có thể được truy cập công khai qua đường link ảnh.

## 5. Tin nhắn
Tin nhắn chỉ hiển thị cho hai người trong cuộc trò chuyện trên website. Ban quản trị không đọc nội dung tin nhắn, trừ khi: (a) một bên trong cuộc trò chuyện gửi báo cáo hoặc khiếu nại cần xem nội dung để xử lý lừa đảo, quấy rối; hoặc (b) có yêu cầu của cơ quan nhà nước có thẩm quyền theo quy định của pháp luật.

## 6. Cookie và lưu trữ trên trình duyệt
- Cookie đăng nhập (accessToken) để giữ phiên đăng nhập, hết hạn sau 7 ngày hoặc khi bạn đăng xuất.
- Cookie ghi nhớ lựa chọn giao diện sáng/tối.
- Lịch sử tin đã xem (tối đa 15 tin) lưu ngay trên trình duyệt của bạn, không gửi về máy chủ; bạn có thể xoá bằng cách xoá dữ liệu trang web trong trình duyệt.
- Khi bạn bật thông báo đẩy: trình duyệt cấp một mã thiết bị, mã này được lưu vào tài khoản để gửi thông báo và bị gỡ khi bạn tắt thông báo đẩy hoặc đăng xuất.
- Chúng tôi không dùng cookie quảng cáo hoặc công cụ phân tích hành vi của bên thứ ba.

## 7. Dịch vụ bên thứ ba
- Google Firebase: gửi và xác thực mã OTP qua số điện thoại; gửi thông báo đẩy tới trình duyệt (Firebase Cloud Messaging) khi bạn bật.
- Dịch vụ gửi email do Ban quản trị thuê (chỉ khi tính năng email được bật): nhận địa chỉ email và nội dung thông báo để gửi đi.
- SMS: hiện chưa sử dụng. Khi triển khai, chúng tôi sẽ cập nhật tên nhà cung cấp tại đây trước khi gửi tin.
- YouTube (chế độ youtube-nocookie): phát video nhúng trong tin đăng.
- OpenFreeMap (dữ liệu OpenStreetMap): tải bản đồ nền hiển thị vị trí tin đăng.
- Nominatim (OpenStreetMap): khi người đăng bấm "Tìm theo địa chỉ", địa chỉ đã nhập được gửi đi để tìm toạ độ.
- Lưu trữ ảnh tải lên: máy chủ hoặc dịch vụ lưu trữ đám mây do Ban quản trị thuê; nhà cung cấp chỉ lưu trữ, không được dùng dữ liệu cho mục đích khác.
- Zalo: chỉ khi bạn bấm nút liên hệ Zalo.
Các dịch vụ này có chính sách bảo mật riêng. Dữ liệu có thể được lưu trên máy chủ đặt ngoài Việt Nam của các nhà cung cấp nêu trên.

## 8. Thời gian lưu trữ
- Thông báo được tự động xoá sau 90 ngày.
- Tin đăng hết hạn sau 30 ngày được ẩn khỏi tìm kiếm nhưng vẫn lưu để chủ tin gia hạn, cho tới khi chủ tin hoặc quản trị viên xoá.
- Dữ liệu tài khoản, tin nhắn và đánh giá được lưu trong thời gian bạn sử dụng dịch vụ. Khi bạn xoá tài khoản, thông tin cá nhân bị xoá ngay; tin nhắn và đánh giá bạn đã viết chỉ còn ở dạng không gắn với danh tính.
- Nhật ký thao tác của quản trị viên được lưu để phục vụ xử lý khiếu nại và vi phạm.

## 9. Quyền của bạn
- Xem và sửa thông tin hồ sơ tại Trang cá nhân; sửa, ẩn hoặc xoá tin đăng tại Kênh người đăng; xoá đánh giá do mình viết.
- Tải toàn bộ dữ liệu của bạn (tệp JSON) tại Trang cá nhân > Dữ liệu & tài khoản.
- Tự xoá tài khoản tại Trang cá nhân > Dữ liệu & tài khoản: tin đăng, món đồ, tin đã lưu, tìm kiếm đã lưu, thông báo và đánh giá người khác viết về bạn bị xoá ngay; thông tin cá nhân (tên, ảnh, email, số điện thoại) bị gỡ khỏi tài khoản. Tin nhắn và đánh giá bạn đã viết được giữ lại để không làm hỏng cuộc trò chuyện của người khác, nhưng chỉ hiển thị là "Người dùng đã xoá". Ảnh bạn đã tải lên được xoá khỏi máy chủ lưu trữ khi bạn gửi yêu cầu qua email.
- Bạn có quyền được biết, đồng ý hoặc rút lại sự đồng ý, truy cập, chỉnh sửa, yêu cầu xoá, hạn chế hoặc phản đối việc xử lý dữ liệu cá nhân của mình, khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường thiệt hại theo quy định của pháp luật.
- Gửi yêu cầu về dữ liệu tới ${contactEmail}. Chúng tôi xử lý yêu cầu xoá hoặc cung cấp dữ liệu chậm nhất trong 72 giờ kể từ khi nhận đủ yêu cầu, các yêu cầu khác trong thời hạn pháp luật quy định.

## 10. Bảo mật
- Không dùng mật khẩu (đăng nhập bằng OTP). Phiên đăng nhập dùng token có thời hạn; tài khoản bị khoá mất quyền truy cập ngay.
- Chỉ quản trị viên được thao tác qua trang quản trị; mọi thao tác kiểm duyệt đều được ghi nhật ký.
- Ảnh trong tin nhắn chỉ nhận ảnh đã tải lên hệ thống (chặn ảnh từ trang ngoài có thể dùng để theo dõi người xem).
- Khi xảy ra sự cố lộ, mất dữ liệu cá nhân, chúng tôi thông báo cho người dùng bị ảnh hưởng và cơ quan có thẩm quyền theo quy định của pháp luật.

## 11. Liên hệ
Câu hỏi về dữ liệu cá nhân xin gửi tới ${contactEmail}.`;
  },
};
