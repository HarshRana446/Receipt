'use client'

import { useState, useCallback } from 'react'

type AlertType = 'confirm' | 'success' | 'error' | 'info'

interface AlertConfig {
  type: AlertType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface AlertState extends AlertConfig {
  resolve: (value: boolean) => void
}

let alertRef: ((config: AlertConfig) => Promise<boolean>) | null = null

export function useAlert() {
  return alertRef!
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null)

  const showAlert = useCallback((config: AlertConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlert({ ...config, resolve })
    })
  }, [])

  alertRef = showAlert

  function handleConfirm() {
    alert?.resolve(true)
    setAlert(null)
  }

  function handleCancel() {
    alert?.resolve(false)
    setAlert(null)
  }

  const icons: Record<AlertType, React.ReactNode> = {
    confirm: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  }

  const colors: Record<AlertType, { icon: string; bg: string; btn: string; btnHover: string }> = {
    confirm: { icon: '#c28a22', bg: '#fdf8ee', btn: '#781f16', btnHover: '#5e1710' },
    success: { icon: '#2e7d52', bg: '#f0f9f4', btn: '#2e7d52', btnHover: '#1e5235' },
    error:   { icon: '#c84136', bg: '#fef2f2', btn: '#c84136', btnHover: '#a3332a' },
    info:    { icon: '#1a6fa6', bg: '#eff6ff', btn: '#1a6fa6', btnHover: '#145a88' },
  }

  return (
    <>
      {children}
      {alert && (
        <div
          className="custom-alert-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleCancel() }}
        >
          <div className="custom-alert-box">
            <div
              className="custom-alert-icon-wrap"
              style={{ background: colors[alert.type].bg, color: colors[alert.type].icon }}
            >
              {icons[alert.type]}
            </div>
            <div className="custom-alert-content">
              <h3 className="custom-alert-title">{alert.title}</h3>
              <p className="custom-alert-message">{alert.message}</p>
            </div>
            <div className="custom-alert-actions">
              {alert.cancelText && (
                <button className="custom-alert-cancel" onClick={handleCancel}>
                  {alert.cancelText}
                </button>
              )}
              <button
                className="custom-alert-confirm"
                style={{ background: colors[alert.type].btn }}
                onClick={handleConfirm}
              >
                {alert.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
