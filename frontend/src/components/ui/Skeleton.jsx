import React from 'react'

/**
 * Base Brutalist Skeleton primitive
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`brutalist-skeleton ${className}`}
      {...props}
    />
  )
}

/**
 * Skeleton matching StoreCard geometry (Mobile, Compact, Grid)
 */
export function StoreCardSkeleton({ viewMode = 'responsive', className = '' }) {
  // Mobile horizontal card
  const renderMobile = () => (
    <div
      aria-hidden="true"
      className="md:hidden brutalist-card bg-white p-2.5 relative flex items-center gap-3 w-full rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#111111] select-none"
    >
      <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-lg" />
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 gap-2 pr-6">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <div className="flex items-center gap-2 pt-1 border-t border-neutral-200">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-12 rounded-full ml-auto" />
        </div>
      </div>
    </div>
  )

  // Desktop compact card
  const renderCompact = () => (
    <div
      aria-hidden="true"
      className="hidden md:flex brutalist-card bg-white p-3.5 relative flex-col justify-between gap-3 w-full rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none h-full"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1 pr-24">
        <Skeleton className="w-18 h-18 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200">
        <Skeleton className="h-3.5 w-32 rounded" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
    </div>
  )

  // Desktop grid card (standard)
  const renderGrid = () => (
    <div
      aria-hidden="true"
      className="hidden md:flex brutalist-card bg-white overflow-hidden flex-col justify-between group relative w-full h-full min-h-[350px] rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none"
    >
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <Skeleton className="h-44 w-full rounded-none border-b-2 border-black shrink-0" />
        <div className="p-3.5 space-y-3 relative flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-5 w-4/5 rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
          <div className="pt-2 border-t-2 border-dashed border-neutral-200 flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )

  if (viewMode === 'mobile') {
    return <div className={`w-full ${className}`}>{renderMobile()}</div>
  }

  if (viewMode === 'compact') {
    return <div className={`w-full ${className}`}>{renderCompact()}</div>
  }

  if (viewMode === 'grid') {
    return <div className={`w-full ${className}`}>{renderGrid()}</div>
  }

  // Responsive: renders mobile on small screens, grid on md+
  return (
    <div className={`w-full ${className}`}>
      {renderMobile()}
      {renderGrid()}
    </div>
  )
}

/**
 * Metric Card Skeleton for Admin Dashboard KPI metrics
 */
export function MetricCardSkeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`brutalist-card bg-white p-5 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      </div>
      <div className="flex items-baseline justify-between pt-1">
        <Skeleton className="h-9 w-16 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  )
}

/**
 * Table Skeleton for Admin users and stores management
 */
export function TableSkeleton({ rows = 5, cols = 4, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-x-auto border-2 border-black rounded-xl bg-white ${className}`}
    >
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#f7f6f2] border-b-2 border-black">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-3.5">
                <Skeleton className="h-4 w-20 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-neutral-200 bg-white">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="hover:bg-neutral-50">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-3.5">
                  <Skeleton className={`h-4 ${c === 0 ? 'w-36' : c === cols - 1 ? 'w-16 ml-auto' : 'w-24'} rounded`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Detail Drawer Skeleton for direct URL deep-linking (/quan/:id)
 */
export function DetailDrawerSkeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`space-y-6 pb-12 ${className}`}
    >
      {/* Banner placeholder */}
      <Skeleton className="h-52 sm:h-64 w-full rounded-none border-b-4 border-black" />

      {/* Header Info Block */}
      <div className="px-5 sm:px-7 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 sm:h-9 w-3/4 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t-2 border-black">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl col-span-2 sm:col-span-1" />
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-2 pt-4 border-t-2 border-neutral-200">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Menu Dish Cards */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="brutalist-card bg-white p-3 border-2 border-black rounded-xl flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Profile Form Skeleton
 */
export function ProfileFormSkeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`space-y-8 pb-16 ${className}`}
    >
      <div className="p-8 brutalist-card bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_#111] space-y-4">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 p-6 brutalist-card bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_#111] space-y-5">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="lg:col-span-5 p-6 brutalist-card bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_#111] space-y-5">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
