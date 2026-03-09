import React from 'react';
import type { Metadata } from 'next';
import { Icon } from '@/components/shared/Icon';
import Link from 'next/link';

interface ChangeLogItem {
    version: string;
    date: string;
    changes: {
        type: 'feature' | 'fix' | 'improvement' | 'removal';
        content: string;
    }[];
}

const changelogData: ChangeLogItem[] = [
    
    {
        version: '3.1.0',
        date: '15/02/2026',
        changes: [
            { type: 'feature', content: 'Ra mắt "Lộ trình học tập thông minh" tự động điều chỉnh theo năng lực.' },
            { type: 'improvement', content: 'Cập nhật giao diện trang chủ SuniSVG 3.0 hiện đại hơn.' },
            { type: 'fix', content: 'Sửa lỗi hiển thị sai avatar trong phần bình luận.' },
            { type: 'removal', content: 'Gỡ bỏ hoàn toàn các mã nguồn cũ liên quan đến hệ thống lớp học.' },
        ]
    },
    {
        version: '3.0.0',
        date: '01/02/2026',
        changes: [
            { type: 'removal', content: 'Ngừng hoạt động hệ thống PLTA.svg (Phòng luyện thi ảo) để chuyển sang mô hình thi tự do.' },
            { type: 'removal', content: 'Loại bỏ tính năng "Quản lý lớp học" (Classroom) đối với tài khoản Giáo viên.' },
            { type: 'removal', content: 'Gỡ bỏ công cụ "Tạo và Giao đề thi" thủ công.' },
            { type: 'feature', content: 'Chuyển đổi toàn bộ dữ liệu cũ sang định dạng Khóa học số mới.' },
        ]
    },
    {
        version: '2.9.0',
        date: '15/01/2026',
        changes: [
            { type: 'feature', content: 'Chia sẻ thành tích học tập lên mạng xã hội với khung ảnh đẹp mắt.' },
            { type: 'fix', content: 'Sửa lỗi liên kết gãy trong các khóa học cũ.' },
            { type: 'improvement', content: 'Cải thiện tốc độ phản hồi của máy chủ tại khu vực miền Nam.' },
            { type: 'fix', content: 'Sửa lỗi không nhận diện được mã giảm giá trong một số trường hợp.' },
        ]
    },
    {
        version: '2.8.0',
        date: '01/01/2026',
        changes: [
            { type: 'feature', content: 'Hỗ trợ các dạng câu hỏi tương tác mới: Kéo thả, Điền khuyết.' },
            { type: 'fix', content: 'Đồng bộ hóa đồng hồ đếm ngược trên mọi thiết bị.' },
            { type: 'improvement', content: 'Nâng cấp tính năng Accessibility (Hỗ trợ người khiếm thị).' },
            { type: 'feature', content: 'Sự kiện "Chào năm mới 2026" với nhiều phần quà hấp dẫn.' },
        ]
    },
    {
        version: '2.7.0',
        date: '15/12/2025',
        changes: [
            { type: 'feature', content: 'Hỗ trợ đa ngôn ngữ (Tiếng Anh, Tiếng Việt) cho giao diện.' },
            { type: 'fix', content: 'Sửa lỗi chính tả trong phần chân trang.' },
            { type: 'improvement', content: 'Tối ưu hóa SEO cho các trang chi tiết tài liệu.' },
            { type: 'fix', content: 'Khắc phục lỗi không tải được ảnh bìa khóa học trên Safari.' },
        ]
    },
    {
        version: '2.6.0',
        date: '01/12/2025',
        changes: [
            { type: 'feature', content: 'Giao diện chủ đề Giáng Sinh.' },
            { type: 'fix', content: 'Sửa lỗi thông báo đẩy bị chậm trễ.' },
            { type: 'improvement', content: 'Vá các lỗ hổng bảo mật tiềm ẩn trong API.' },
            { type: 'improvement', content: 'Tăng giới hạn tải lên tài liệu cho thành viên VIP.' },
        ]
    },
    {
        version: '2.5.0',
        date: '25/11/2025',
        changes: [
            { type: 'feature', content: 'Bảng phân tích hiệu quả học tập (Analytics) chi tiết.' },
            { type: 'fix', content: 'Sửa lỗi upload ảnh đại diện bị xoay ngang.' },
            { type: 'improvement', content: 'Tối ưu hóa cơ sở dữ liệu, giảm thời gian truy vấn.' },
            { type: 'fix', content: 'Sửa lỗi hiển thị sai ngày hết hạn của Voucher.' },
        ]
    },
    {
        version: '2.4.0',
        date: '20/11/2025',
        changes: [
            { type: 'feature', content: 'Tính năng tặng Voucher cho bạn bè.' },
            { type: 'fix', content: 'Sửa lỗi cổng thanh toán khi giao dịch quá tải.' },
            { type: 'improvement', content: 'Tinh chỉnh UI/UX trang thanh toán mượt mà hơn.' },
            { type: 'feature', content: 'Chương trình tri ân ngày Nhà giáo Việt Nam.' },
        ]
    },
    {
        version: '2.3.0',
        date: '18/11/2025',
        changes: [
            { type: 'feature', content: 'Hệ thống huy hiệu thành tích mới.' },
            { type: 'fix', content: 'Sửa lỗi tự động đăng xuất khi đang học.' },
            { type: 'improvement', content: 'Cải thiện công cụ tìm kiếm, hỗ trợ từ khóa không dấu.' },
            { type: 'fix', content: 'Sửa lỗi hiển thị sai số lượng bài viết trong diễn đàn.' },
        ]
    },
    {
        version: '2.2.0',
        date: '15/11/2025',
        changes: [
            { type: 'feature', content: 'Nút chuyển đổi chế độ Sáng/Tối (Dark Mode) trên thanh menu.' },
            { type: 'fix', content: 'Sửa lỗi menu trên thiết bị di động bị che khuất.' },
            { type: 'improvement', content: 'Tăng tốc độ tải trang lần đầu (First Contentful Paint).' },
            { type: 'improvement', content: 'Cập nhật bộ icon mới đồng bộ hơn.' },
        ]
    },
    {
        version: '2.1.1',
        date: '13/11/2025',
        changes: [
            { type: 'feature', content: 'Ra mắt trang "Nhật ký thay đổi" để theo dõi cập nhật hệ thống.' },
            { type: 'fix', content: 'Sửa lỗi đăng nhập đối với mật khẩu dạng số.' },
            { type: 'improvement', content: 'Cải thiện logic nhận diện khóa học đã mua (so sánh mềm).' },
            { type: 'fix', content: 'Sửa lỗi validation khi nhập mã Voucher.' },
        ]
    },
    {
        version: '2.1.0',
        date: '10/11/2025',
        changes: [
            { type: 'feature', content: 'Thêm tính năng Pomodoro "Study with me" ở thanh bên phải.' },
            { type: 'feature', content: 'Tích hợp Live Chat widget trong khu vực diễn đàn.' },
            { type: 'fix', content: 'Sửa lỗi sắp xếp tin nhắn trong khung chat.' },
            { type: 'improvement', content: 'Hiển thị trạng thái online của người dùng.' },
        ]
    },
    {
        version: '2.0.1',
        date: '07/11/2025',
        changes: [
            { type: 'fix', content: 'Khắc phục lỗi rò rỉ bộ nhớ trong bộ đếm giờ thi.' },
            { type: 'improvement', content: 'Tối ưu hóa bundle size, giảm 20% dung lượng tải trang.' },
            { type: 'fix', content: 'Sửa lỗi mất trạng thái đăng nhập khi tải lại trang.' },
            { type: 'improvement', content: 'Cải thiện thông báo lỗi khi mất kết nối mạng.' },
        ]
    },
    {
        version: '2.0.0',
        date: '04/11/2025',
        changes: [
            { type: 'feature', content: 'Nâng cấp toàn diện trang "Khóa học của tôi" với theo dõi tiến độ.' },
            { type: 'feature', content: 'Tính năng cấp chứng chỉ tự động khi hoàn thành khóa học.' },
            { type: 'improvement', content: 'Thiết kế lại giao diện Dashboard người dùng hiện đại hơn.' },
            { type: 'fix', content: 'Sửa lỗi thanh tiến độ bị kẹt ở mức 99%.' },
        ]
    },
    {
        version: '1.9.1',
        date: '01/11/2025',
        changes: [
            { type: 'fix', content: 'Sửa lỗi vòng lặp chuyển hướng trên các URL Sách ID cũ.' },
            { type: 'improvement', content: 'Cập nhật FAQ liên quan đến việc chuyển đổi số.' },
            { type: 'fix', content: 'Khôi phục ảnh bìa bị thiếu cho các nội dung đã chuyển đổi.' },
            { type: 'improvement', content: 'Tăng tốc độ xử lý bằng cách loại bỏ mã nguồn cũ.' },
        ]
    },
    {
        version: '1.9.0',
        date: '29/10/2025',
        changes: [
            { type: 'feature', content: 'Chuyển đổi hoàn toàn nội dung "Sách ID" sang "Khóa học số".' },
            { type: 'improvement', content: 'Loại bỏ nút "Kích hoạt Sách ID", thay thế bằng nhập Voucher.' },
            { type: 'fix', content: 'Dọn dẹp các trường dữ liệu thừa liên quan đến sách vật lý.' },
            { type: 'improvement', content: 'Hợp nhất "Sách của tôi" vào thư viện khóa học chung.' },
        ]
    },
    {
        version: '1.8.1',
        date: '26/10/2025',
        changes: [
            { type: 'improvement', content: 'Nâng cấp bộ tìm kiếm với bộ lọc theo môn học và giáo viên.' },
            { type: 'fix', content: 'Sửa lỗi kết quả tìm kiếm không được làm mới.' },
            { type: 'improvement', content: 'Thêm gợi ý từ khóa thông minh khi gõ.' },
            { type: 'fix', content: 'Sửa lỗi tìm kiếm với các ký tự đặc biệt.' },
        ]
    },
    {
        version: '1.8.0',
        date: '23/10/2025',
        changes: [
            { type: 'feature', content: 'Ra mắt hệ thống đổi Voucher nhận ưu đãi.' },
            { type: 'feature', content: 'Trang "Kho Voucher" giúp quản lý mã giảm giá.' },
            { type: 'fix', content: 'Sửa lỗi hiển thị voucher đã hết hạn.' },
            { type: 'improvement', content: 'Tự động áp dụng mã giảm giá tốt nhất khi thanh toán.' },
        ]
    },
    {
        version: '1.7.1',
        date: '20/10/2025',
        changes: [
            { type: 'improvement', content: 'Bổ sung 500+ câu hỏi mới vào ngân hàng đề Vật Lý.' },
            { type: 'fix', content: 'Sửa lỗi chính tả trong câu hỏi Sinh học #402.' },
            { type: 'improvement', content: 'Cải thiện hiển thị công thức Toán học (LaTeX).' },
            { type: 'fix', content: 'Sửa lỗi phóng to hình ảnh trong chi tiết câu hỏi.' },
        ]
    },
    {
        version: '1.7.0',
        date: '17/10/2025',
        changes: [
            { type: 'feature', content: 'Hệ thống cấp bậc và danh hiệu người dùng.' },
            { type: 'feature', content: 'Phần thưởng chuỗi đăng nhập hàng ngày.' },
            { type: 'fix', content: 'Sửa lỗi không cộng điểm sau khi hoàn thành bài thi.' },
            { type: 'improvement', content: 'Bảng xếp hạng học sinh xuất sắc.' },
        ]
    },
    {
        version: '1.6.1',
        date: '14/10/2025',
        changes: [
            { type: 'feature', content: 'Trung tâm thông báo trong ứng dụng.' },
            { type: 'feature', content: 'Hỗ trợ thông báo đẩy (Push Notification) trên mobile.' },
            { type: 'fix', content: 'Sửa lỗi nhận thông báo trùng lặp.' },
            { type: 'improvement', content: 'Thêm nút "Đánh dấu tất cả là đã đọc".' },
        ]
    },
    {
        version: '1.6.0',
        date: '11/10/2025',
        changes: [
            { type: 'feature', content: 'Tích hợp lớp học trực tuyến (Live Class).' },
            { type: 'feature', content: 'Lịch học cá nhân hóa trong Dashboard.' },
            { type: 'fix', content: 'Sửa lỗi lệch múi giờ trong lịch học.' },
            { type: 'improvement', content: 'Email nhắc nhở 15 phút trước giờ học.' },
        ]
    },
    {
        version: '1.5.1',
        date: '08/10/2025',
        changes: [
            { type: 'fix', content: 'Sửa lỗi phân biệt hoa thường khi nhập mã kích hoạt.' },
            { type: 'improvement', content: 'Hỗ trợ kích hoạt hàng loạt nhiều sách cùng lúc.' },
            { type: 'fix', content: 'Sửa thông báo lỗi khi không tìm thấy ID sách.' },
            { type: 'improvement', content: 'Thêm hiệu ứng tải khi hiển thị bìa sách.' },
        ]
    },
    {
        version: '1.5.0',
        date: '05/10/2025',
        changes: [
            { type: 'feature', content: 'Ra mắt cổng kích hoạt "Sách ID".' },
            { type: 'feature', content: 'Liên kết sách vật lý với tài khoản số.' },
            { type: 'fix', content: 'Sửa lỗi quét mã vạch trên ứng dụng di động.' },
            { type: 'improvement', content: 'Thêm mục "Sách của tôi" vào trang quản lý.' },
        ]
    },
    {
        version: '1.4.1',
        date: '02/10/2025',
        changes: [
            { type: 'improvement', content: 'Làm mới thiết kế banner trang chủ.' },
            { type: 'improvement', content: 'Hỗ trợ chế độ tối (Dark Mode - Beta).' },
            { type: 'fix', content: 'Sửa lỗi độ tương phản màu sắc trên các nút bấm.' },
            { type: 'fix', content: 'Sửa lỗi menu mobile tự động đóng.' },
        ]
    },
    {
        version: '1.4.0',
        date: '29/09/2025',
        changes: [
            { type: 'feature', content: 'Ra mắt trang danh sách Giáo viên.' },
            { type: 'feature', content: 'Hiển thị tiểu sử và khóa học của từng giáo viên.' },
            { type: 'improvement', content: 'Tìm kiếm hỗ trợ lọc theo tên giáo viên.' },
            { type: 'fix', content: 'Sửa lỗi vỡ giao diện ảnh đại diện giáo viên.' },
        ]
    },
    {
        version: '1.3.1',
        date: '26/09/2025',
        changes: [
            { type: 'improvement', content: 'Tăng cường bảo mật API với giới hạn truy cập.' },
            { type: 'fix', content: 'Xử lý lỗi hết phiên đăng nhập (Session timeout).' },
            { type: 'improvement', content: 'Tối ưu truy vấn cơ sở dữ liệu cho danh sách khóa học.' },
            { type: 'fix', content: 'Vá lỗ hổng XSS nhỏ trong thanh tìm kiếm.' },
        ]
    },
    {
        version: '1.3.0',
        date: '23/09/2025',
        changes: [
            { type: 'feature', content: 'Tích hợp cổng thanh toán SePay (Chuyển khoản tự động).' },
            { type: 'feature', content: 'Nhật ký giao dịch nạp tiền.' },
            { type: 'fix', content: 'Sửa lỗi định dạng tiền tệ trong giá khóa học.' },
            { type: 'improvement', content: 'Tạo mã QR thanh toán nhanh.' },
        ]
    },
    {
        version: '1.2.1',
        date: '20/09/2025',
        changes: [
            { type: 'fix', content: 'Sửa lỗi không tải được ảnh trong bài viết diễn đàn.' },
            { type: 'improvement', content: 'Thêm bộ lọc "Mới nhất" và "Nổi bật" cho diễn đàn.' },
            { type: 'fix', content: 'Sửa lỗi phân trang khi chủ đề quá dài.' },
            { type: 'improvement', content: 'Hiển thị huy hiệu khi có phản hồi mới.' },
        ]
    },
    {
        version: '1.2.0',
        date: '17/09/2025',
        changes: [
            { type: 'feature', content: 'Ra mắt Diễn đàn thảo luận cộng đồng (Beta).' },
            { type: 'feature', content: 'Cho phép tạo chủ đề thảo luận mới.' },
            { type: 'feature', content: 'Hệ thống bình luận và trả lời bài viết.' },
            { type: 'improvement', content: 'Hỗ trợ định dạng Markdown cho bài viết.' },
        ]
    },
    {
        version: '1.1.1',
        date: '14/09/2025',
        changes: [
            { type: 'feature', content: 'Trang hồ sơ người dùng với tính năng đổi avatar.' },
            { type: 'improvement', content: 'Thanh đo độ mạnh mật khẩu khi đăng ký.' },
            { type: 'fix', content: 'Sửa lỗi avatar không cập nhật ngay lập tức.' },
            { type: 'fix', content: 'Sửa lỗi liên kết xác thực email bị hết hạn sớm.' },
        ]
    },
    {
        version: '1.1.0',
        date: '11/09/2025',
        changes: [
            { type: 'feature', content: 'Hệ thống thi thử Online với bộ đếm giờ.' },
            { type: 'feature', content: 'Xem lại kết quả thi và đáp án chi tiết.' },
            { type: 'fix', content: 'Sửa lỗi tính điểm sai trong đề thi Hóa học.' },
            { type: 'improvement', content: 'Giao diện làm bài thi tập trung.' },
        ]
    },
    {
        version: '1.0.1',
        date: '08/09/2025',
        changes: [
            { type: 'fix', content: 'Sửa lỗi đăng nhập trên thiết bị di động.' },
            { type: 'improvement', content: 'Cải thiện tốc độ tải trang chủ.' },
            { type: 'fix', content: 'Sửa các liên kết hỏng ở chân trang.' },
            { type: 'improvement', content: 'Điều chỉnh giao diện cho máy tính bảng.' },
        ]
    },
    {
        version: '1.0.0',
        date: '05/09/2025',
        changes: [
            { type: 'feature', content: 'Chính thức ra mắt nền tảng học tập SuniSVG.' },
            { type: 'feature', content: 'Hệ thống quản lý khóa học trực tuyến.' },
            { type: 'feature', content: 'Thư viện tài liệu học tập đa dạng.' },
            { type: 'feature', content: 'Hệ thống xác thực và quản lý tài khoản người dùng.' },
        ]
    }
];

const typeConfig = {
    feature: { label: 'Tính năng mới', color: 'bg-green-100 text-green-700', icon: 'star' },
    fix: { label: 'Sửa lỗi', color: 'bg-red-100 text-red-700', icon: 'tool' },
    improvement: { label: 'Cải thiện', color: 'bg-blue-100 text-blue-700', icon: 'zap' },
    removal: { label: 'Đã gỡ bỏ', color: 'bg-gray-100 text-gray-600', icon: 'trash' },
};

export const metadata: Metadata = {
    title: 'Nhật ký thay đổi - SuniSVG | Cập nhật tính năng và tài liệu mới',
    description: 'Theo dõi các bản cập nhật mới nhất của nền tảng học tập SuniSVG. Tính năng mới, sửa lỗi và cải thiện hiệu năng cho hệ thống tài liệu và khóa học.',
    keywords: ['nhật ký thay đổi', 'changelog sunisvg', 'cập nhật sunisvg', 'tính năng mới'],
};

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Nhật ký thay đổi</h1>
                    <p className="text-gray-500">Theo dõi các cập nhật mới nhất của SuniSVG</p>
                </div>

                <div className="space-y-8">
                    {changelogData.map((item, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                            {/* Timeline connector */}
                            {index !== changelogData.length - 1 && (
                                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gray-100 -z-10"></div>
                            )}
                            
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold text-lg shadow-sm border border-green-100">
                                            v{item.version.split('.')[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Phiên bản {item.version}</h2>
                                            <p className="text-sm text-gray-500">{item.date}</p>
                                        </div>
                                    </div>
                                    {index === 0 && (
                                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                                            Mới nhất
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4 pl-4 sm:pl-16">
                                    {item.changes.map((change, idx) => {
                                        const config = typeConfig[change.type];
                                        return (
                                            <div key={idx} className="flex items-start gap-3">
                                                <span className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${config.color} w-24 text-center`}>
                                                    {config.label}
                                                </span>
                                                <p className="text-gray-700 text-sm leading-relaxed pt-0.5">
                                                    {change.content}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 font-medium transition-colors">
                        <Icon name="arrowLeft" className="w-4 h-4" />
                        Quay về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}