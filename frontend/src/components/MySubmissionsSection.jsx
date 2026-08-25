import React from 'react'
import { ClipboardList, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function MySubmissionsSection({ myStores, loading }) {
  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="p-6 brutalist-card space-y-4">
          <div className="h-6 w-48 brutalist-skeleton" />
          <div className="h-10 w-full brutalist-skeleton" />
        </div>
        <div className="space-y-4">
          <div className="h-24 w-full brutalist-skeleton" />
          <div className="h-24 w-full brutalist-skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title Banner */}
      <div className="bg-white text-black border-3 border-black p-6 md:p-8 brutalist-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none select-none">
          <ClipboardList className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="brutalist-badge bg-[#ff3e3e] text-white">Review Progress</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            Lịch Sử Đăng Quán
          </h2>
          <p className="text-sm font-semibold max-w-xl text-neutral-600">
            Track verification workflows of your submitted food tour spots. Approved items immediately sync to the explore map.
          </p>
        </div>
      </div>

      {myStores.length === 0 ? (
        <div className="brutalist-card bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <ClipboardList className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="text-xl font-black uppercase">Chưa Có Yêu Cầu Nào</h3>
          <p className="text-sm font-semibold text-neutral-500">
            Bạn chưa đăng bất kỳ địa điểm ăn uống nào để kiểm duyệt. Hãy sang tab "Quán ăn của tôi" để bắt đầu!
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {myStores.map((st) => {
            const isApproved = st.status === 'APPROVED'
            const isRejected = st.status === 'REJECTED'
            const isPending = !isApproved && !isRejected

            return (
              <div
                key={st.id}
                className={`brutalist-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                  isApproved
                    ? 'border-emerald-500 hover:border-emerald-600 bg-emerald-50/20'
                    : isRejected
                    ? 'border-red-500 hover:border-red-600 bg-red-50/20'
                    : 'border-yellow-500 hover:border-yellow-600 bg-yellow-50/20'
                }`}
              >
                {/* Left: Info */}
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-black uppercase text-black">{st.name}</h3>
                    <span className="brutalist-badge bg-white text-black border-black">
                      {st.categoryName || 'Dishes'}
                    </span>
                    
                    {/* Status Badges */}
                    {isApproved && (
                      <span className="brutalist-badge bg-emerald-500 text-white border-emerald-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Được Duyệt
                      </span>
                    )}
                    {isRejected && (
                      <span className="brutalist-badge bg-red-500 text-white border-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Từ Chối
                      </span>
                    )}
                    {isPending && (
                      <span className="brutalist-badge bg-yellow-500 text-black border-yellow-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Đang Chờ Duyệt
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-neutral-600">
                    <p>
                      <strong className="text-black uppercase text-[10px] tracking-wider block">Địa chỉ:</strong>
                      {st.addressLine || 'N/A'}
                    </p>
                    <p>
                      <strong className="text-black uppercase text-[10px] tracking-wider block">Giá tham khảo:</strong>
                      {st.priceMin?.toLocaleString()}đ - {st.priceMax?.toLocaleString()}đ
                    </p>
                  </div>

                  {/* Rejection Alert Box */}
                  {isRejected && st.rejectionReason && (
                    <div className="p-4 border-2 border-red-500 bg-red-50 text-red-700 font-medium text-xs rounded space-y-1">
                      <p className="font-extrabold uppercase text-[10px] text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Phản Hồi Từ Ban Quản Trị:
                      </p>
                      <p className="italic">“ {st.rejectionReason} ”</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
