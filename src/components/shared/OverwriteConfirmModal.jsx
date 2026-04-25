/**
 * OverwriteConfirmModal - blocks restore until the user explicitly confirms
 * that all current data will be overwritten with the backup file.
 */

import { useEffect } from 'react'

export default function OverwriteConfirmModal({ fileName, keysCount, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overwrite-confirm-title"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel restore"
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl leading-none min-h-[44px] min-w-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          &times;
        </button>
        <h2 id="overwrite-confirm-title" className="text-lg font-semibold text-gray-900 pr-8">
          Restore this backup?
        </h2>
        {fileName && (
          <p className="text-sm font-mono text-gray-600 bg-gray-50 rounded px-2 py-1 break-all">
            {fileName}
          </p>
        )}
        <p className="text-sm text-gray-700 leading-relaxed">
          This will overwrite your current data ({keysCount ?? 'all'} stored value
          {keysCount !== 1 ? 's' : ''}) with the contents of the backup file.
          This action cannot be undone.
        </p>
        <p className="text-xs text-gray-500">
          Your browser will reload after the restore to apply all settings.
        </p>
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors min-h-[44px]"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  )
}
