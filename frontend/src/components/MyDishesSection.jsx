import React from 'react'
import { PlusCircle, Info, Utensils, IndianRupee } from 'lucide-react'

export default function MyDishesSection({
  myStores,
  foodStoreId,
  setFoodStoreId,
  foodName,
  setFoodName,
  foodPrice,
  setFoodPrice,
  foodImage,
  setFoodImage,
  foodDesc,
  setFoodDesc,
  handleCreateFoodItem,
  loading
}) {
  // Only allow adding dishes to approved stores
  const approvedStores = myStores.filter((st) => st.status === 'APPROVED')
  
  // Find currently selected store to show its menu
  const selectedStore = approvedStores.find((st) => st.id.toString() === foodStoreId.toString())

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="p-6 brutalist-card space-y-4">
          <div className="h-6 w-48 brutalist-skeleton" />
          <div className="h-10 w-full brutalist-skeleton" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 brutalist-card h-64 brutalist-skeleton" />
          <div className="p-6 brutalist-card h-64 brutalist-skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title Banner */}
      <div className="bg-[#ff3e3e] text-white border-3 border-black p-6 md:p-8 brutalist-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none select-none">
          <Utensils className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="brutalist-badge bg-white text-black">Menu Configurator</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            Quản Lý Món Ăn
          </h2>
          <p className="text-sm font-semibold max-w-xl text-white/90">
            Create, expand, and update menus for your verified culinary spots. Select a spot below to view its live menu and add new offerings.
          </p>
        </div>
      </div>

      {approvedStores.length === 0 ? (
        <div className="brutalist-card bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <Info className="w-12 h-12 text-[#ff3e3e] mx-auto" />
          <h3 className="text-xl font-black uppercase">Chưa Có Quán Ăn Được Duyệt</h3>
          <p className="text-sm font-semibold text-neutral-600">
            Món ăn chỉ có thể được tạo sau khi quán ăn của bạn đã được Admin phê duyệt (Status: APPROVED). Hãy kiểm tra trạng thái quán ăn của bạn ở phần submissions hoặc tab Quán ăn của tôi!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 brutalist-card p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <h3 className="text-xl font-black uppercase border-b-3 border-black pb-3 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#ff3e3e]" /> Thêm Món Ăn Mới
            </h3>

            <form onSubmit={handleCreateFoodItem} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Chọn Quán Ăn</label>
                <select
                  required
                  value={foodStoreId}
                  onChange={(e) => setFoodStoreId(e.target.value)}
                  className="brutalist-input"
                >
                  <option value="">-- Chọn quán ăn của bạn --</option>
                  {approvedStores.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Tên Món Ăn</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bánh Mì Thịt Nướng"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="brutalist-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Giá Bán (VND)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 25000"
                  value={foodPrice}
                  onChange={(e) => setFoodPrice(parseInt(e.target.value) || 0)}
                  className="brutalist-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Đường Dẫn Hình Ảnh Món Ăn</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={foodImage}
                  onChange={(e) => setFoodImage(e.target.value)}
                  className="brutalist-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider block">Mô Tả Ngắn</label>
                <textarea
                  required
                  placeholder="Thịt nướng xém cạnh thơm nức mũi, đầy đủ dưa chua hành ngò..."
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  className="brutalist-input"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full brutalist-btn-red py-3 text-sm font-black"
              >
                Xác Nhận Thêm Món Ăn
              </button>
            </form>
          </div>

          {/* Right Column: Menu List Preview */}
          <div className="lg:col-span-7 brutalist-card p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <h3 className="text-xl font-black uppercase border-b-3 border-black pb-3">
              Thực Đơn Hiện Tại {selectedStore ? `(${selectedStore.name})` : ''}
            </h3>

            {!foodStoreId ? (
              <div className="p-12 text-center text-neutral-500 font-semibold bg-[#f7f6f2] border-3 border-dashed border-neutral-300 rounded">
                Vui lòng chọn quán ăn ở cột bên trái để hiển thị danh sách thực đơn hiện tại.
              </div>
            ) : !selectedStore?.foodItems || selectedStore.foodItems.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 font-semibold bg-[#f7f6f2] border-3 border-dashed border-neutral-300 rounded">
                Quán ăn này chưa được cập nhật món ăn nào trong thực đơn.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedStore.foodItems.map((food) => (
                  <div
                    key={food.id}
                    className="border-3 border-black bg-[#f7f6f2] flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="h-32 border-b-3 border-black relative bg-neutral-200 shrink-0">
                      <img
                        src={
                          food.imageUrl ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60'
                        }
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-sm text-black">{food.name}</p>
                        <p className="text-[10px] text-neutral-600 line-clamp-2 mt-1">{food.description}</p>
                      </div>
                      <p className="font-black text-xs text-[#ff3e3e] mt-2">
                        {food.price?.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
