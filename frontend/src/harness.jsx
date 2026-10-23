import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {
  Button,
  IconButton,
  FormField,
  Input,
  NativeSelect,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter
} from './components/ui'
import ConfirmActionModal from './components/modals/ConfirmActionModal'
import AuthModal from './components/modals/AuthModal'
import { Trash2, Search, Check } from 'lucide-react'

function HarnessApp() {
  const [clickCount, setClickCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [verifyTokenVal, setVerifyTokenVal] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [lastVerifyToken, setLastVerifyToken] = useState('')
  const [lastResendEmail, setLastResendEmail] = useState('')
  const [textValue, setTextValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [showError, setShowError] = useState(false)

  const cityOptions = [
    { value: 'can-giuoc', label: 'Cần Giuộc' },
    { value: 'ben-luc', label: 'Bến Lức' },
    { value: 'tan-an', label: 'Tân An' }
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <header className="border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">Component Test Harness (Batch 2B)</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Interactive testing environment for accessible shared primitives.</p>
      </header>

      {/* Button Section */}
      <section className="space-y-4" aria-labelledby="section-buttons">
        <h2 id="section-buttons" className="text-lg font-black uppercase">1. Buttons & IconButtons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            id="action-btn"
            variant="action"
            onClick={() => setClickCount((c) => c + 1)}
          >
            Action ({clickCount})
          </Button>
          <Button id="brand-btn" variant="brand">Brand</Button>
          <Button id="surface-btn" variant="surface">Surface</Button>
          <Button id="outline-btn" variant="outline">Outline</Button>
          <Button id="danger-btn" variant="danger">Danger</Button>
          <Button
            id="toggle-loading-btn"
            isLoading={loading}
            loadingText="Đang tải..."
            onClick={() => setLoading(true)}
          >
            Bấm Để Tải
          </Button>
          <Button id="disabled-btn" disabled>Bị Vô Hiệu</Button>
          <IconButton
            id="icon-btn-delete"
            icon={<Trash2 className="w-5 h-5" />}
            aria-label="Xóa dữ liệu mẫu"
            variant="surface"
          />
        </div>
      </section>

      {/* FormField & Input Section */}
      <section className="space-y-4" aria-labelledby="section-inputs">
        <h2 id="section-inputs" className="text-lg font-black uppercase">2. FormField & Input</h2>
        <FormField
          id="test-username"
          label="Tên đăng nhập"
          hint="Ít nhất 3 ký tự"
          error={showError ? 'Tên đăng nhập không được chứa ký tự đặc biệt' : undefined}
          required
        >
          <Input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Nhập tên đăng nhập..."
            leftAdornment={<Search className="w-4 h-4" />}
          />
        </FormField>
        <div className="flex gap-2">
          <Button
            id="toggle-error-btn"
            size="sm"
            variant="outline"
            onClick={() => setShowError(!showError)}
          >
            Toggle Lỗi Form
          </Button>
        </div>
      </section>

      {/* NativeSelect Section */}
      <section className="space-y-4" aria-labelledby="section-select">
        <h2 id="section-select" className="text-lg font-black uppercase">3. NativeSelect</h2>
        <FormField id="test-city" label="Khu vực hoạt động" hint="Chọn chi nhánh áp dụng" optional>
          <NativeSelect
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            placeholder="-- Chọn khu vực --"
            options={cityOptions}
          />
        </FormField>
        <p id="selected-city-display" className="text-xs font-bold">
          Đã chọn: {selectValue || '(chưa chọn)'}
        </p>
      </section>

      {/* Dialog Section */}
      <section className="space-y-4" aria-labelledby="section-dialog">
        <h2 id="section-dialog" className="text-lg font-black uppercase">4. Dialog Modal</h2>
        <Button
          id="open-dialog-trigger"
          variant="brand"
          onClick={() => setIsDialogOpen(true)}
        >
          Mở Hộp Thoại Thử Nghiệm
        </Button>

        <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          role="dialog"
        >
          <DialogHeader>
            <DialogTitle>Xác Nhận Hành Động</DialogTitle>
            <DialogDescription>
              Kiểm tra focus trap, phím Escape, và khôi phục focus khi đóng.
            </DialogDescription>
          </DialogHeader>
          <DialogContent className="space-y-4">
            <FormField id="dialog-input-field" label="Ghi chú xác nhận">
              <Input id="dialog-input" placeholder="Nhập lý do..." />
            </FormField>
            <FormField id="dialog-select-field" label="Mức độ ưu tiên">
              <NativeSelect
                id="dialog-select"
                options={[
                  { value: 'LOW', label: 'Thấp' },
                  { value: 'MEDIUM', label: 'Bình thường' },
                  { value: 'HIGH', label: 'Khẩn cấp' }
                ]}
              />
            </FormField>
          </DialogContent>
          <DialogFooter>
            <Button
              id="dialog-cancel-btn"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Hủy Bỏ
            </Button>
            <Button
              id="dialog-confirm-btn"
              variant="action"
              leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
              onClick={() => setIsDialogOpen(false)}
            >
              Đồng Ý
            </Button>
          </DialogFooter>
        </Dialog>
      </section>

      {/* ConfirmActionModal (Pilot 1) Section */}
      <section className="space-y-4" aria-labelledby="section-confirm-modal">
        <h2 id="section-confirm-modal" className="text-lg font-black uppercase">5. ConfirmActionModal (Pilot 1)</h2>
        <Button
          id="open-confirm-modal-trigger"
          variant="danger"
          onClick={() => setIsConfirmModalOpen(true)}
        >
          Xóa Mục Dữ Liệu Nguy Hiểm
        </Button>

        <ConfirmActionModal
          isOpen={isConfirmModalOpen}
          title="Xóa cửa hàng thử nghiệm"
          description="Toàn bộ dữ liệu cửa hàng sẽ bị xóa vĩnh viễn khỏi hệ thống."
          confirmLabel="Xóa Vĩnh Viễn"
          expectedText="delete-me"
          reasonRequired={true}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={async () => {
            await new Promise((r) => setTimeout(r, 100))
            return true
          }}
        />
      </section>

      {/* AuthModal (Batch 2D-2B.2A) Section */}
      <section className="space-y-4" aria-labelledby="section-auth-modal">
        <h2 id="section-auth-modal" className="text-lg font-black uppercase">6. AuthModal (Batch 2D-2B.2A)</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            id="open-auth-verify-trigger"
            variant="surface"
            onClick={() => {
              setAuthMode('verify')
              setShowAuthModal(true)
            }}
          >
            Mở Xác Thực Email
          </Button>
        </div>
        <p id="harness-verify-result" className="text-xs font-mono">
          Last Verify: {lastVerifyToken} | Last Resend: {lastResendEmail}
        </p>

        <AuthModal
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          authMode={authMode}
          setAuthMode={setAuthMode}
          verifyTokenVal={verifyTokenVal}
          setVerifyTokenVal={setVerifyTokenVal}
          handleVerifyEmail={(e) => {
            e.preventDefault()
            setLastVerifyToken(verifyTokenVal)
          }}
          resendEmail={resendEmail}
          setResendEmail={setResendEmail}
          handleResendVerification={(e) => {
            e?.preventDefault?.()
            setLastResendEmail(resendEmail)
          }}
        />
      </section>
    </div>
  )
}

export default HarnessApp

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(<HarnessApp />)
}
