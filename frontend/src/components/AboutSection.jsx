import React from 'react'
import { Compass, Mail, MapPin, Heart, ShieldCheck, Users, Utensils, Award, Store, ArrowRight } from 'lucide-react'

export default function AboutSection({ switchTab, setShowAuthModal, setAuthMode, currentUser }) {
  return (
    <div className="space-y-12 animate-fade-in-up pb-12">
      {/* 1. HERO & ORIGIN STORY BANNER */}
      <div className="bg-[#ff3e3e] text-white border-4 border-black p-6 md:p-12 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none select-none text-white hidden md:block">
          <Compass className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="brutalist-badge bg-white text-black border-2 border-black font-black uppercase text-xs px-3.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ℹ️ Về Chúng Tôi • Cần Giuộc Food Tour
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] leading-none">
            Hành Trình Khám Phá Ẩm Thực Đất Cần Giuộc
          </h1>
          <p className="text-base sm:text-lg font-extrabold text-white/95 leading-relaxed pt-2">
            Nơi kết nối thực khách với những hương vị truyền thống độc đáo, bình dị mà đậm đà tình người tại vùng đất Cần Giuộc, Long An.
          </p>
        </div>
      </div>

      {/* 2. ORIGIN STORY DETAIL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 brutalist-card p-6 md:p-8 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-4 border-black pb-3">
              <Compass className="w-6 h-6 text-[#ff3e3e]" />
              <h2 className="text-2xl font-black uppercase tracking-wide text-black">
                Tại Sao Cần Giuộc Food Tour Ra Đời?
              </h2>
            </div>
            <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
              Cần Giuộc là vùng đất cửa ngõ miền Tây nổi tiếng với nhiều món ngon nức tiếng như bánh xèo giòn rụm, lẩu mắm đậm đà, chả cá tươi ngon, bánh mì xíu mại, chè truyền thống và các quán cà phê sân vườn góc quê thanh bình.
            </p>
            <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
              Tuy nhiên, du khách hay thậm chí người dân địa phương thường gặp khó khăn trong việc tìm kiếm thông tin quán ăn chuẩn xác, minh bạch về địa chỉ GPS, bảng giá thực đơn và đánh giá thực tế. 
            </p>
            <p className="text-sm font-semibold text-neutral-800 leading-relaxed bg-[#f7f6f2] p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <strong className="text-[#ff3e3e]">Cần Giuộc Food Tour</strong> được xây dựng như một bản đồ ẩm thực mở, độc lập và hoàn toàn miễn phí, giúp tôn vinh ẩm thực quê hương và hỗ trợ các chủ quán địa phương đưa thương hiệu của mình tiếp cận đông đảo thực khách.
            </p>
          </div>
        </div>

        {/* STATS & MILESTONES CARD */}
        <div className="lg:col-span-5 brutalist-card p-6 md:p-8 bg-[#f7f6f2] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 flex flex-col justify-between">
          <div className="border-b-4 border-black pb-3">
            <h3 className="text-xl font-black uppercase tracking-wide text-black flex items-center gap-2">
              <Award className="w-5 h-5 text-[#ff3e3e]" /> Những Con Số Nổi Bật
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center space-y-1">
              <span className="text-3xl md:text-4xl font-black text-[#ff3e3e] block">50+</span>
              <span className="text-xs font-black uppercase text-black block">Quán Ăn Địa Phương</span>
            </div>

            <div className="bg-white p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center space-y-1">
              <span className="text-3xl md:text-4xl font-black text-black block">100+</span>
              <span className="text-xs font-black uppercase text-neutral-700 block">Món Ăn Đặc Sản</span>
            </div>

            <div className="bg-white p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center space-y-1">
              <span className="text-3xl md:text-4xl font-black text-[#ff3e3e] block">1,000+</span>
              <span className="text-xs font-black uppercase text-black block">Lượt Trải Nghiệm</span>
            </div>

            <div className="bg-white p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center space-y-1">
              <span className="text-3xl md:text-4xl font-black text-emerald-600 block">100%</span>
              <span className="text-xs font-black uppercase text-neutral-700 block">Miễn Phí & Minh Bạch</span>
            </div>
          </div>

          <div className="bg-white p-3 border-2 border-black rounded-xl text-xs font-bold text-center text-neutral-700">
            Dữ liệu được cập nhật và kiểm duyệt liên tục bởi quản trị viên & cộng đồng.
          </div>
        </div>
      </div>

      {/* 3. MISSION & CORE VALUES */}
      <div className="space-y-6">
        <div className="border-b-4 border-black pb-3">
          <h2 className="text-2xl font-black uppercase tracking-wide text-black flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#ff3e3e]" /> Sứ Mệnh & Giá Trị Cốt Lõi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Value 1 */}
          <div className="brutalist-card bg-white p-6 border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="w-12 h-12 bg-[#ff3e3e] text-white border-2 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase text-black">Tôn Vinh Ẩm Thực</h3>
            <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
              Ghi nhận và quảng bá những quán ăn lâu đời, những gánh hàng rong đặc sản của Cần Giuộc tới bạn bè khắp nơi.
            </p>
          </div>

          {/* Value 2 */}
          <div className="brutalist-card bg-white p-6 border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="w-12 h-12 bg-black text-white border-2 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-black uppercase text-black">Thông Tin Xác Thực</h3>
            <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
              Mọi vị trí địa lý, giá cả thực đơn và hình ảnh đại diện đều được xác thực minh bạch trước khi hiển thị công khai.
            </p>
          </div>

          {/* Value 3 */}
          <div className="brutalist-card bg-white p-6 border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="w-12 h-12 bg-[#fff9db] text-black border-2 border-black rounded-xl flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Users className="w-6 h-6 text-[#b45309]" />
            </div>
            <h3 className="text-lg font-black uppercase text-black">Đồng Hành Cùng Chủ Quán</h3>
            <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
              Tạo điều kiện cho các chủ quán đăng tải thông tin hoàn toàn miễn phí, quản lý món ăn và nhận phản hồi trực tiếp từ thực khách.
            </p>
          </div>
        </div>
      </div>

      {/* 4. TEAM & FOUNDER INFO SECTION */}
      <div className="brutalist-card p-6 md:p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="border-b-4 border-black pb-3">
          <h2 className="text-2xl font-black uppercase tracking-wide text-black flex items-center gap-2">
            <Users className="w-6 h-6 text-[#ff3e3e]" /> Đội Ngũ Phát Triển & Liên Hệ
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 bg-[#f7f6f2] p-6 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-28 h-28 bg-[#ff3e3e] text-white border-3 border-black rounded-full flex items-center justify-center font-black text-4xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
            CG
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <span className="brutalist-badge bg-[#ff3e3e] text-white border border-black text-[10px]">
                Founder & Developer
              </span>
              <h3 className="text-xl md:text-2xl font-black uppercase text-black mt-1">
                Cần Giuộc Food Tour Team
              </h3>
              <p className="text-xs font-bold text-neutral-600">
                Nhóm phát triển dự án Bản Đồ & Tour Khám Phá Ẩm Thực Cần Giuộc
              </p>
            </div>

            <p className="text-xs font-semibold text-neutral-700 leading-relaxed max-w-2xl">
              Nếu bạn có bất kỳ đóng góp ý kiến, yêu cầu cập nhật thông tin quán ăn, hoặc mong muốn hợp tác phát triển cộng đồng ẩm thực Cần Giuộc, xin vui lòng liên hệ trực tiếp với chúng tôi qua email:
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <a
                href="mailto:cangiuocfoodtour@gmail.com"
                className="brutalist-btn-red py-2 px-4 text-xs font-black flex items-center gap-2 no-underline"
              >
                <Mail className="w-4 h-4" />
                cangiuocfoodtour@gmail.com
              </a>
              <span className="text-xs font-extrabold text-neutral-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#ff3e3e]" /> Cần Giuộc, Long An, Việt Nam
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CALL TO ACTION (CTA) */}
      <div className="bg-black text-white border-4 border-black p-8 md:p-12 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tight">
          Sẵn Sàng Bắt Đầu Chuyến Food Tour Của Bạn?
        </h2>
        <p className="text-sm font-semibold max-w-xl mx-auto text-neutral-300">
          Khám phá ngay danh sách quán ăn ngon hàng đầu hoặc đăng ký quán ăn của bạn vào hệ thống bản đồ ẩm thực Cần Giuộc.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => switchTab('explore')}
            className="brutalist-btn-red py-3 px-6 text-sm font-black flex items-center gap-2"
          >
            <Compass className="w-5 h-5" />
            Khám Phá Quán Ăn Ngay ↗
          </button>

          <button
            onClick={() => {
              if (currentUser) {
                switchTab('my-stores')
              } else {
                setAuthMode('login')
                setShowAuthModal(true)
              }
            }}
            className="brutalist-btn-white py-3 px-6 text-sm font-black flex items-center gap-2"
          >
            <Store className="w-5 h-5" />
            Đăng Ký Mở Quán Ăn ↗
          </button>
        </div>
      </div>
    </div>
  )
}
