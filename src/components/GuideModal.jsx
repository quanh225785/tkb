import React from "react";
import {
  X,
  Upload,
  Search,
  MousePointer,
  Download,
  Save,
  FolderOpen,
  BookOpen,
} from "lucide-react";

const steps = [
  {
    icon: <Upload size={24} />,
    color: "#93C5FD",
    title: "Tải file Excel TKB",
    desc: "Tải file Excel từ EsHUST (đăng nhập → Đăng ký học → Xuất Excel). Kéo thả hoặc click vào ô upload để chọn file.",
  },
  {
    icon: <Search size={24} />,
    color: "#6EE7B7",
    title: "Tìm kiếm môn học",
    desc: 'Nhập tên hoặc mã học phần vào ô tìm kiếm. Chọn chương trình học (CT Chuẩn, Tiên tiến...) rồi nhấn "Tìm lớp".',
  },
  {
    icon: <MousePointer size={24} />,
    color: "#C4B5FD",
    title: "Chọn kíp học",
    desc: 'Xem danh sách lớp hiện ra, click nút "+" để thêm vào TKB. Hệ thống sẽ báo nếu có trùng lịch với môn khác.',
  },
  {
    icon: <BookOpen size={24} />,
    color: "#FDE68A",
    title: "Xem thời khóa biểu",
    desc: 'Nhấn "Xem TKB" để xem lịch dạng bảng theo tuần. Các môn được tô màu khác nhau để dễ phân biệt.',
  },
  {
    icon: <Download size={24} />,
    color: "#FDA4AF",
    title: "Xuất & lưu lịch",
    desc: '"Xuất file" để tải về Excel. "Lưu" để lưu vào trình duyệt (không mất khi đóng tab). "Mở" để tải lại lịch đã lưu.',
  },
];

export default function GuideModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box guide-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={22} />
            <h2>Hướng dẫn sử dụng</h2>
          </div>
          <button
            id="btn-close-guide"
            className="modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <p className="guide-intro">
            App <strong>Xếp Lịch Học HUST</strong> giúp bạn lên kế hoạch thời
            khóa biểu trước khi đăng ký môn học chính thức.
          </p>

          <div className="guide-steps">
            {steps.map((step, i) => (
              <div key={i} className="guide-step">
                <div
                  className="step-icon"
                  style={{ background: `${step.color}20`, color: step.color }}
                >
                  {step.icon}
                </div>
                <div className="step-content">
                  <h4 className="step-title">
                    <span
                      className="step-num"
                      style={{ background: step.color }}
                    >
                      {i + 1}
                    </span>
                    {step.title}
                  </h4>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="guide-tips">
            <h4>💡 Mẹo hữu ích</h4>
            <ul>
              <li>File Excel TKB có thể tải về từ hệ thống EsHUST của HUST</li>
              <li>Khi lớp có ký hiệu ⚠️ nghĩa là trùng lịch với môn đã chọn</li>
              <li>Bạn có thể chọn nhiều kíp khác nhau cho mỗi môn học</li>
              <li>Dữ liệu được lưu trong trình duyệt — không cần đăng nhập</li>
              <li>Xuất Excel để in hoặc chia sẻ lịch học của bạn</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button id="btn-guide-ok" className="btn-primary" onClick={onClose}>
            Đã hiểu, bắt đầu thôi!
          </button>
        </div>
      </div>
    </div>
  );
}
