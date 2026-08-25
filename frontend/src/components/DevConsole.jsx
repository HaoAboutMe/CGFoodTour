import React from 'react'
import { Database, RefreshCw } from 'lucide-react'

export default function DevConsole({
  isConsoleOpen,
  setIsConsoleOpen,
  consoleLogs,
  clearConsole,
  token,
  handleRefreshToken
}) {
  return (
    <>
      {/* FLOATING DEVELOPER NETWORK LOGS CONSOLE */}
      <div
        className={`fixed bottom-0 right-4 z-40 bg-white border-t-3 border-x-3 border-black transition-all duration-300 flex flex-col shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] ${
          isConsoleOpen ? 'h-[360px] w-[500px]' : 'h-11 w-64'
        }`}
      >
        {/* Console Header bar */}
        <div
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className="px-4 py-3 bg-[#f7f6f2] border-b-3 border-black flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full border border-black ${isConsoleOpen ? 'bg-[#ff3e3e]' : 'bg-neutral-400'}`} />
            <span className="text-[10px] uppercase font-black tracking-wider text-black flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#ff3e3e]" /> API Logs Console
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isConsoleOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearConsole()
                }}
                className="brutalist-badge bg-white text-black border-black hover:bg-neutral-100 text-[8px] px-1.5 py-0.5 shadow-none"
              >
                Xóa Logs
              </button>
            )}
            <span className="text-[9px] font-black text-black uppercase tracking-wider">
              {isConsoleOpen ? 'Thu Nhỏ' : 'Phóng To'}
            </span>
          </div>
        </div>

        {/* Console logs body */}
        {isConsoleOpen && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[10px] leading-relaxed select-text bg-white">
            {consoleLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-neutral-500 font-extrabold bg-[#f7f6f2] border-2 border-dashed border-neutral-300 rounded">
                Chưa có yêu cầu API nào được ghi lại.
              </div>
            ) : (
              consoleLogs.map((log) => (
                <div
                  key={log.id}
                  className={`pl-3 border-l-3 py-1 ${
                    log.isSuccess ? 'border-emerald-500 bg-emerald-50/30' : 'border-red-500 bg-red-50/30'
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] text-neutral-500 font-bold mb-1">
                    <span>[{log.timestamp}]</span>
                    <span className={log.isSuccess ? 'text-emerald-600' : 'text-red-600 font-black'}>
                      {log.isSuccess ? 'HTTP 200 OK' : 'HTTP REQUEST FAILED'}
                    </span>
                  </div>
                  <p className="font-black text-black mb-1.5">
                    {log.method} {log.url}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <p className="text-neutral-500 font-bold uppercase tracking-wider text-[8px]">Payload:</p>
                      <pre className="text-blue-600 overflow-x-auto max-h-16 p-1 bg-white border border-neutral-300 rounded">
                        {log.requestBody ? JSON.stringify(log.requestBody, null, 2) : 'None'}
                      </pre>
                    </div>
                    <div>
                      <p className="text-neutral-500 font-bold uppercase tracking-wider text-[8px]">Response:</p>
                      <pre
                        className={`overflow-x-auto max-h-16 p-1 bg-white border border-neutral-300 rounded ${
                          log.isSuccess ? 'text-emerald-700 font-semibold' : 'text-red-600'
                        }`}
                      >
                        {JSON.stringify(log.responseData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Developer API status pill in bottom left corner */}
      <div className="fixed bottom-4 left-4 z-40 bg-white border-3 border-black px-3 py-1.5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
        <div className={`w-2.5 h-2.5 rounded-full border border-black ${token ? 'bg-emerald-500' : 'bg-[#ff3e3e]'}`} />
        <span className="text-[9px] font-black uppercase tracking-wider text-black">
          {token ? 'Token Đang Hoạt Động' : 'Chưa Đăng Nhập'}
        </span>
        {token && (
          <button
            onClick={handleRefreshToken}
            className="p-0.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-black transition-colors"
            title="Tải Lại Token"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    </>
  )
}
