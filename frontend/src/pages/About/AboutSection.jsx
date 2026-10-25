import React from 'react'
import { Compass, Mail, MapPin, ShieldCheck, Utensils, Store, Heart, ArrowUpRight } from 'lucide-react'

export default function AboutSection({ switchTab, setShowAuthModal, setAuthMode, currentUser }) {
  return (
    <div className="space-y-6 sm:space-y-10 animate-fade-in-up pb-16">
      {/* ========================================================================= */}
      {/* 📱 1. MOBILE RESPONSIVE APPROACH (< 768px) */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-5">
        {/* Mobile Compact Hero Card */}
        <div className="border-4 border-black bg-[#c92a2a] text-white p-5 space-y-3 rounded-2xl shadow-[5px_5px_0px_0px_#111]">
          <div className="flex items-center gap-1.5">
            <span className="brutalist-badge bg-white text-black text-[10px] font-black uppercase px-2.5 py-0.5 shadow-[1.5px_1.5px_0px_0px_#111]">
              ℹ️ Về Chúng Tôi
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-tight">
            Cần Giuộc Food Tour
          </h1>
          <p className="text-xs font-bold text-white/95 leading-relaxed">
            Dự án bản đồ ẩm thực mở và miễn phí, giúp thực khách dễ dàng tìm kiếm quán ăn ngon và góc phố ẩm thực độc đáo tại Cần Giuộc.
          </p>
        </div>

        {/* Mobile Concise Purpose & Values Card */}
        <div className="brutalist-card bg-white p-5 space-y-4 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#111]">
          <h2 className="text-sm font-black uppercase text-black flex items-center gap-2 border-b-2 border-black pb-2">
            <Compass className="w-4 h-4 text-[#c92a2a]" />
            <span>Mục Đích Dự Án</span>
          </h2>

          <div className="space-y-2.5 text-xs font-semibold text-neutral-800 leading-relaxed">
            <p>
              Cần Giuộc nổi tiếng với nhiều món đặc sản dân dã, nhưng du khách thường khó tìm được địa chỉ chuẩn xác hoặc thực đơn rõ ràng.
            </p>
            <p className="bg-[#f7f6f2] p-3 border-2 border-black rounded-xl font-bold">
              💡 Chúng tôi kết nối bạn trực tiếp với các quán ăn địa phương hoàn toàn minh bạch và miễn phí.
            </p>
          </div>

          {/* 3 Compact Value Chips */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2.5 p-3 bg-neutral-50 border-2 border-black rounded-xl">
              <Utensils className="w-4 h-4 text-[#c92a2a] shrink-0" />
              <span className="text-xs font-black text-black">Tôn vinh ẩm thực địa phương Cần Giuộc</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 bg-neutral-50 border-2 border-black rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-black text-black">Vị trí GPS & Thực đơn minh bạch</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 bg-neutral-50 border-2 border-black rounded-xl">
              <Store className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-black text-black">Miễn phí 100% cho chủ quán đăng bài</span>
            </div>
          </div>
        </div>

        {/* Mobile Contact & Action Card */}
        <div className="brutalist-card bg-[#fff9db] p-5 space-y-4 border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#111]">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#c92a2a]" />
              <span>Đóng Góp & Liên Hệ</span>
            </h3>
            <p className="text-[11px] font-semibold text-neutral-700">
              Bạn muốn thêm quán ăn mới hoặc góp ý tính năng?
            </p>
          </div>

          <a
            href="mailto:cangiuocfoodtour@gmail.com"
            className="w-full brutalist-btn-white text-xs py-2.5 px-3 flex items-center justify-center gap-2 no-underline text-black font-black rounded-xl"
          >
            <Mail className="w-3.5 h-3.5 text-[#c92a2a]" />
            <span>cangiuocfoodtour@gmail.com</span>
          </a>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => switchTab('explore')}
              className="brutalist-btn-red py-2.5 text-xs font-black rounded-xl"
            >
              Khám Phá ↗
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  switchTab('my-stores')
                } else {
                  setAuthMode('login')
                  setShowAuthModal(true)
                }
              }}
              className="brutalist-btn-white py-2.5 text-xs font-black rounded-xl"
            >
              Mở Quán ↗
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 2. DESKTOP TAILORED APPROACH (>= 768px) */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-8">
        {/* Desktop Hero Banner */}
        <section
          className="bg-[#c92a2a] text-white border-4 border-black p-8 lg:p-12 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
          aria-label="Giới thiệu Cần Giuộc Food Tour"
        >
          <div className="absolute right-6 bottom-0 opacity-15 pointer-events-none select-none text-white">
            <Compass className="w-72 h-72" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-3.5">
            <span className="brutalist-badge bg-white text-black border-2 border-black font-black uppercase text-xs px-3.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ℹ️ Về Chúng Tôi • Cần Giuộc Food Tour
            </span>
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] leading-tight">
              Bản Đồ Ẩm Thực Mở Đất Cần Giuộc
            </h1>
            <p className="text-sm lg:text-base font-extrabold text-white/95 leading-relaxed pt-1">
              Dự án phi lợi nhuận nhằm kết nối thực khách với những hương vị truyền thống độc đáo, bình dị mà đậm đà tình người tại Cần Giuộc, Long An.
            </p>
          </div>
        </section>

        {/* Desktop 2-Column Grid Story */}
        <div className="grid grid-cols-12 gap-8 items-stretch">
          {/* Story left */}
          <div className="col-span-7 brutalist-card p-8 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b-3 border-black pb-3">
                <Compass className="w-6 h-6 text-[#c92a2a]" />
                <h2 className="text-xl lg:text-2xl font-black uppercase tracking-wide text-black">
                  Mục Đích Phát Triển Dự Án
                </h2>
              </div>
              <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
                Cần Giuộc là vùng đất cửa ngõ miền Tây với kho tàng món ngon độc đáo như bánh xèo giòn rụm, lẩu mắm, chả cá tươi ngon, bánh mì xíu mại và chè truyền thống.
              </p>
              <p className="text-sm font-semibold text-neutral-800 leading-relaxed bg-[#f7f6f2] p-4 border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <strong className="text-[#c92a2a]">Cần Giuộc Food Tour</strong> được xây dựng như một kênh tra cứu ẩm thực độc lập và minh bạch, hỗ trợ thực khách tìm quán ngon có GPS chính xác và giúp các chủ quán địa phương giới thiệu món ăn hoàn toàn miễn phí.
              </p>
            </div>
          </div>

          {/* Contact & Community right */}
          <div className="col-span-5 brutalist-card p-8 bg-[#fff9db] border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="border-b-3 border-black pb-3">
                <h3 className="text-lg lg:text-xl font-black uppercase tracking-wide text-black flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#c92a2a]" />
                  <span>Đóng Góp & Kết Nối</span>
                </h3>
              </div>
              <p className="text-xs font-semibold text-neutral-800 leading-relaxed">
                Mọi ý kiến đóng góp, đề xuất thêm quán ăn mới hoặc hỗ trợ kỹ thuật, xin vui lòng gửi thư cho chúng tôi:
              </p>
              <a
                href="mailto:cangiuocfoodtour@gmail.com"
                className="brutalist-btn-red py-3 px-4 text-xs font-black flex items-center justify-center gap-2 no-underline rounded-xl shadow-[3px_3px_0px_0px_#111] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>cangiuocfoodtour@gmail.com</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-3 border-t-2 border-black/20 flex items-center gap-2 text-xs font-extrabold text-neutral-700">
              <MapPin className="w-4 h-4 text-[#c92a2a] shrink-0" />
              <span>Cần Giuộc, Long An, Việt Nam</span>
            </div>
          </div>
        </div>

        {/* Desktop 3-Column Core Values */}
        <section className="space-y-5" aria-labelledby="core-values-heading">
          <div className="border-b-3 border-black pb-2">
            <h2
              id="core-values-heading"
              className="text-xl font-black uppercase tracking-wide text-black flex items-center gap-2.5"
            >
              <Heart className="w-5 h-5 text-[#c92a2a]" />
              <span>Giá Trị Cốt Lõi</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="brutalist-card bg-white p-6 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all space-y-2.5">
              <div className="w-11 h-11 bg-[#c92a2a] text-white border-2 border-black rounded-xl flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#111]">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black uppercase text-black">Tôn Vinh Ẩm Thực</h3>
              <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
                Quảng bá những gánh hàng rong đặc sản và quán ăn địa phương lâu đời của quê hương Cần Giuộc.
              </p>
            </div>

            <div className="brutalist-card bg-white p-6 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all space-y-2.5">
              <div className="w-11 h-11 bg-black text-white border-2 border-black rounded-xl flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#111]">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-black uppercase text-black">Thông Tin Xác Thực</h3>
              <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
                Tọa độ GPS, thực đơn và hình ảnh đều được kiểm duyệt minh bạch trước khi hiển thị công khai.
              </p>
            </div>

            <div className="brutalist-card bg-white p-6 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all space-y-2.5">
              <div className="w-11 h-11 bg-[#f7f6f2] text-black border-2 border-black rounded-xl flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#111]">
                <Store className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-black uppercase text-black">Hỗ Trợ Chủ Quán</h3>
              <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
                Hỗ trợ các chủ quán địa phương tạo hồ sơ quán và quản lý thực đơn hoàn toàn miễn phí trọn đời.
              </p>
            </div>
          </div>
        </section>

        {/* Desktop Call To Action Banner */}
        <section
          className="bg-black text-white border-4 border-black p-8 lg:p-10 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row items-center justify-between gap-6"
          aria-label="Kêu gọi hành động"
        >
          <div className="space-y-1.5 max-w-xl text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-black uppercase text-white tracking-tight">
              Bắt Đầu Trải Nghiệm Food Tour
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-neutral-300">
              Khám phá ngay danh sách quán ngon hoặc đăng ký quán ăn của bạn vào bản đồ ẩm thực Cần Giuộc.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => switchTab('explore')}
              className="brutalist-btn-red py-3 px-6 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl shadow-[3px_3px_0px_0px_#fff] cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Khám Phá Quán Ăn ↗</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  switchTab('my-stores')
                } else {
                  setAuthMode('login')
                  setShowAuthModal(true)
                }
              }}
              className="brutalist-btn-white py-3 px-6 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl shadow-[3px_3px_0px_0px_#fff] cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Đăng Ký Quán Ăn ↗</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
