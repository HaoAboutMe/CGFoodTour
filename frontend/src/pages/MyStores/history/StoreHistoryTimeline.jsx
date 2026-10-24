import React from 'react'
import StoreHistoryEvent from './StoreHistoryEvent'

function dayKey(value) {
  const date = value instanceof Date ? value : value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'unknown'
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function dayLabel(value) {
  if (!value) return 'Không rõ ngày'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Không rõ ngày'
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(date) === dayKey(today)) return 'Hôm nay'
  if (dayKey(date) === dayKey(yesterday)) return 'Hôm qua'
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date)
}

export default function StoreHistoryTimeline({ events, onViewStore, onEditStore, onManageStore }) {
  const groups = []
  for (const event of events) {
    const key = dayKey(event.occurredAt)
    const lastGroup = groups[groups.length - 1]
    if (!lastGroup || lastGroup.key !== key) groups.push({ key, label: dayLabel(event.occurredAt), events: [event] })
    else lastGroup.events.push(event)
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`history-day-${group.key}`}>
          <h3 id={`history-day-${group.key}`} className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-neutral-600">{group.label}</h3>
          <ol className="relative space-y-0 before:absolute before:bottom-5 before:left-[1.06rem] before:top-2 before:w-0.5 before:bg-black sm:before:left-[1.31rem]">
            {group.events.map((event) => (
              <StoreHistoryEvent key={event.eventId} event={event} onViewStore={onViewStore} onEditStore={onEditStore} onManageStore={onManageStore} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
