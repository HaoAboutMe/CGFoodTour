import React from 'react'
import { AlertTriangle, CheckCircle2, Edit3, Eye, EyeOff, FileClock, RefreshCcw, Send, Store, Trash2 } from 'lucide-react'
import { actorLabel, getStoreHistoryPresentation, getStoreStatusLabel } from './storeHistoryPresentation'

const TONE_CLASSES = {
  success: 'border-emerald-700 bg-[var(--color-success-bg)]',
  danger: 'border-[var(--color-danger-text)] bg-[var(--color-danger-bg)]',
  waiting: 'border-amber-700 bg-[var(--color-warning-bg)]',
  deleted: 'border-neutral-500 bg-neutral-100',
  neutral: 'border-black bg-white'
}

const ICONS = {
  alert: AlertTriangle,
  check: CheckCircle2,
  deleted: Trash2,
  edit: Edit3,
  hidden: EyeOff,
  history: FileClock,
  refresh: RefreshCcw,
  restore: Eye,
  send: Send
}

function eventTime(value) {
  if (!value) return 'Không rõ thời gian'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date)
}

export default function StoreHistoryEvent({ event, onViewStore, onEditStore, onManageStore }) {
  const presentation = getStoreHistoryPresentation(event.action, event.actorType)
  const Icon = ICONS[presentation.icon] || Store
  const canAct = event.resourceAvailable && event.recommendedAction && event.recommendedAction !== 'NONE'

  const handleAction = () => {
    if (event.recommendedAction === 'EDIT_AND_RESUBMIT') onEditStore?.(event.storeId)
    else if (event.recommendedAction === 'REQUEST_RECOVERY') onManageStore?.(event.storeId)
    else onViewStore?.(event.storeId)
  }

  const actionLabel = event.recommendedAction === 'EDIT_AND_RESUBMIT'
    ? 'Chỉnh sửa và gửi lại'
    : event.recommendedAction === 'REQUEST_RECOVERY' ? 'Quản lý quán' : 'Xem quán'

  return (
    <li className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-4">
      <div className="relative flex justify-center">
        <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-black shadow-[2px_2px_0_0_#111] sm:h-11 sm:w-11 ${TONE_CLASSES[presentation.tone] || TONE_CLASSES.neutral}`}>
          <Icon aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>

      <article className={`mb-5 min-w-0 rounded-2xl border-2 p-4 shadow-[3px_3px_0_0_#111] sm:p-5 ${TONE_CLASSES[presentation.tone] || TONE_CLASSES.neutral}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="text-base font-black text-black sm:text-lg">{presentation.title}</h4>
            <p className="mt-1 line-clamp-2 text-sm font-extrabold text-neutral-800">{event.storeName}</p>
          </div>
          <time dateTime={event.occurredAt || undefined} className="shrink-0 text-xs font-bold text-neutral-600">
            {eventTime(event.occurredAt)}
          </time>
        </div>

        <p className="mt-2 text-sm font-medium leading-6 text-neutral-700">{presentation.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-700">
          <span className="rounded-full border border-black bg-white px-2.5 py-1">Thực hiện bởi: {actorLabel(event.actorType)}</span>
          {(event.statusBefore || event.statusAfter) && (
            <span className="rounded-full border border-black bg-white px-2.5 py-1" aria-label={`Trạng thái từ ${getStoreStatusLabel(event.statusBefore)} sang ${getStoreStatusLabel(event.statusAfter)}`}>
              {getStoreStatusLabel(event.statusBefore)} → {getStoreStatusLabel(event.statusAfter)}
            </span>
          )}
        </div>

        {event.reason && (
          <div className="mt-4 rounded-xl border-2 border-black bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase text-[var(--color-danger-text)]">
              <AlertTriangle aria-hidden="true" className="h-4 w-4" /> Phản hồi
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-neutral-800">{event.reason}</p>
          </div>
        )}

        {!event.resourceAvailable && (
          <p className="mt-4 flex items-center gap-2 text-xs font-bold text-neutral-600">
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Dữ liệu quán không còn khả dụng.
          </p>
        )}

        {canAct && (
          <div className="mt-4 border-t-2 border-black/20 pt-4">
            <button
              type="button"
              onClick={handleAction}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-black bg-black px-4 text-xs font-black uppercase text-white transition hover:-translate-y-0.5 sm:w-auto"
            >
              {event.recommendedAction === 'EDIT_AND_RESUBMIT' ? <Edit3 aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              {actionLabel}
            </button>
          </div>
        )}
      </article>
    </li>
  )
}
