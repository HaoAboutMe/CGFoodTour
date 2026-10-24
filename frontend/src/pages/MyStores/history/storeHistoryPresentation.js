export const HISTORY_GROUP_OPTIONS = [
  { value: 'ALL', label: 'Tất cả hoạt động' },
  { value: 'WAITING', label: 'Đang chờ xử lý' },
  { value: 'SUCCESS', label: 'Đã hoàn tất' },
  { value: 'ACTION_REQUIRED', label: 'Cần bạn xử lý' },
  { value: 'HIDDEN', label: 'Ẩn và khôi phục' },
  { value: 'DELETED', label: 'Đã xóa' }
]

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  HIDDEN: 'Đang ẩn',
  DELETED: 'Đã xóa'
}

const PRESENTATIONS = {
  SUBMIT: {
    title: 'Đã gửi quán để kiểm duyệt',
    description: 'Thông tin quán đang được Ban quản trị xem xét.',
    tone: 'waiting',
    icon: 'send'
  },
  APPROVE: {
    title: 'Quán đã được duyệt',
    description: 'Quán đã đủ điều kiện hiển thị trên Cần Giuộc FoodTour.',
    tone: 'success',
    icon: 'check'
  },
  REJECT: {
    title: 'Quán bị từ chối',
    description: 'Bạn cần cập nhật thông tin theo phản hồi trước khi gửi lại.',
    tone: 'danger',
    icon: 'alert'
  },
  EDIT_PENDING: {
    title: 'Đã cập nhật hồ sơ đang chờ duyệt',
    description: 'Thông tin mới đã được lưu và tiếp tục chờ kiểm duyệt.',
    tone: 'neutral',
    icon: 'edit'
  },
  RESUBMIT_AFTER_EDIT: {
    title: 'Đã chỉnh sửa và gửi duyệt lại',
    description: 'Phiên bản mới của quán đang được Ban quản trị xem xét.',
    tone: 'waiting',
    icon: 'refresh'
  },
  EDIT_HIDDEN: {
    title: 'Đã cập nhật quán đang bị ẩn',
    description: 'Thông tin đã được lưu nhưng quán vẫn chưa hiển thị công khai.',
    tone: 'neutral',
    icon: 'edit'
  },
  HIDE: {
    title: 'Quán đã bị ẩn',
    description: 'Quán hiện không còn xuất hiện trong khu vực khám phá công khai.',
    tone: 'danger',
    icon: 'hidden'
  },
  RECOVER: {
    title: 'Quán đã được hiển thị lại',
    description: 'Trạng thái công khai của quán đã được khôi phục.',
    tone: 'success',
    icon: 'restore'
  },
  REQUEST_RECOVERY: {
    title: 'Đã gửi yêu cầu khôi phục',
    description: 'Ban quản trị sẽ xem xét yêu cầu và phản hồi cho bạn.',
    tone: 'waiting',
    icon: 'send'
  },
  REJECT_RECOVERY_REQUEST: {
    title: 'Yêu cầu khôi phục bị từ chối',
    description: 'Quán vẫn đang bị ẩn. Hãy xem phản hồi để cập nhật phù hợp.',
    tone: 'danger',
    icon: 'alert'
  },
  HARD_DELETE: {
    title: 'Quán đã bị xóa vĩnh viễn',
    description: 'Thông tin quán không còn khả dụng để xem hoặc chỉnh sửa.',
    tone: 'deleted',
    icon: 'deleted'
  }
}

export function getStoreHistoryPresentation(action, actorType) {
  const base = PRESENTATIONS[action] || {
    title: 'Hoạt động của quán đã được cập nhật',
    description: 'Một thay đổi mới đã được ghi nhận trong lịch sử.',
    tone: 'neutral',
    icon: 'history'
  }

  if (action === 'HIDE') {
    return {
      ...base,
      title: actorType === 'OWNER' ? 'Bạn đã tạm ẩn quán' : 'Quán đã bị quản trị viên ẩn'
    }
  }
  return base
}

export function getStoreStatusLabel(status) {
  return STATUS_LABELS[status] || status || 'Chưa xác định'
}

export function actorLabel(actorType) {
  if (actorType === 'OWNER') return 'Bạn'
  if (actorType === 'ADMIN') return 'Ban quản trị'
  return 'Hệ thống'
}
