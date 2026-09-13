import React from 'react'
import {
  Utensils,
  UtensilsCrossed,
  Soup,
  Coffee,
  CupSoda,
  IceCream,
  Cake,
  Sandwich,
  Pizza,
  Beef,
  Flame,
  Fish,
  Beer,
  Wine,
  GlassWater,
  Cookie,
  Donut,
  Croissant,
  Apple,
  Citrus,
  Popcorn,
  Milk,
  ChefHat,
  Store,
  ShoppingBag
} from 'lucide-react'

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'utensils', label: 'Cơm & Món Ăn', Icon: Utensils, tags: ['cơm', 'món ăn', 'nhà hàng', 'food'] },
  { id: 'soup', label: 'Phở, Bún & Lẩu', Icon: Soup, tags: ['phở', 'bún', 'lẩu', 'súp', 'nước'] },
  { id: 'sandwich', label: 'Bánh Mì & Sandwich', Icon: Sandwich, tags: ['bánh mì', 'sandwich', 'ăn nhanh'] },
  { id: 'pizza', label: 'Pizza & Bánh Nướng', Icon: Pizza, tags: ['pizza', 'bánh nướng', 'ý'] },
  { id: 'beef', label: 'Thịt & Món Nướng', Icon: Beef, tags: ['thịt', 'gà rán', 'bò', 'fastfood'] },
  { id: 'flame', label: 'BBQ & Món Nướng', Icon: Flame, tags: ['bbq', 'nướng', 'lẩu nướng', 'cháy'] },
  { id: 'fish', label: 'Hải Sản & Ôm Cá', Icon: Fish, tags: ['hải sản', 'cá', 'tôm', 'seafood'] },
  { id: 'coffee', label: 'Cà Phê & Ca Cao', Icon: Coffee, tags: ['cà phê', 'coffee', 'cafe'] },
  { id: 'cupsoda', label: 'Trà Sữa & Nước Ngọt', Icon: CupSoda, tags: ['trà sữa', 'nước ngọt', 'soda', 'boba'] },
  { id: 'glasswater', label: 'Sinh Tố & Nước Ép', Icon: GlassWater, tags: ['sinh tố', 'nước ép', 'nước lọc'] },
  { id: 'beer', label: 'Bia & Quán Nhậu', Icon: Beer, tags: ['bia', 'nhậu', 'quán bia', 'beer'] },
  { id: 'wine', label: 'Rượu & Bar Chill', Icon: Wine, tags: ['rượu', 'wine', 'bar', 'cocktail'] },
  { id: 'ice-cream', label: 'Kem & Giải Khát', Icon: IceCream, tags: ['kem', 'icecream', 'giải khát'] },
  { id: 'cake', label: 'Bánh Kem & Ngọt', Icon: Cake, tags: ['bánh kem', 'bánh sinh nhật', 'tráng miệng'] },
  { id: 'cookie', label: 'Bánh Quy & Ăn Vặt', Icon: Cookie, tags: ['bánh quy', 'ăn vặt', 'snack'] },
  { id: 'donut', label: 'Bánh Donut', Icon: Donut, tags: ['donut', 'bánh vòng', 'bánh ngọt'] },
  { id: 'croissant', label: 'Bánh Mì Pháp', Icon: Croissant, tags: ['bánh mì pháp', 'croissant', 'bánh sừng bò'] },
  { id: 'apple', label: 'Trái Cây Tươi', Icon: Apple, tags: ['trái cây', 'hoa quả', 'táo', 'fruit'] },
  { id: 'citrus', label: 'Nước Ép Cam Chanh', Icon: Citrus, tags: ['cam', 'chanh', 'nước ép', 'vitamin'] },
  { id: 'popcorn', label: 'Bắp Rạng & Ăn Vặt', Icon: Popcorn, tags: ['bắp rạng', 'popcorn', 'bỏng ngô'] },
  { id: 'milk', label: 'Sữa & Trà Sữa', Icon: Milk, tags: ['sữa', 'milk', 'trà sữa', 'bò'] },
  { id: 'chef-hat', label: 'Nhà Hàng Sang Trọng', Icon: ChefHat, tags: ['nhà hàng', 'bếp trưởng', 'chef', 'vips'] },
  { id: 'store', label: 'Cửa Hàng Tổng Hợp', Icon: Store, tags: ['cửa hàng', 'tổng hợp', 'tạp hóa'] },
  { id: 'shopping-bag', label: 'Mang Về & Delivery', Icon: ShoppingBag, tags: ['mang về', 'delivery', 'túi hàng'] }
]

export default function CategoryIcon({ icon, name, className = "w-4 h-4" }) {
  const str = `${icon || ''} ${name || ''}`.toLowerCase()

  // Match exact ID first
  const exact = AVAILABLE_CATEGORY_ICONS.find(item => item.id === icon)
  if (exact) {
    const Component = exact.Icon
    return <Component className={className} />
  }

  // Substring match
  const matched = AVAILABLE_CATEGORY_ICONS.find(item =>
    item.tags.some(tag => str.includes(tag)) || str.includes(item.id)
  )

  if (matched) {
    const Component = matched.Icon
    return <Component className={className} />
  }

  return <Utensils className={className} />
}
