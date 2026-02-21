import { useState, useEffect, useRef } from 'react'
import BandStage from './components/BandStage'
import PortRow from './components/PortRow'
import LivePulse from './components/LivePulse'
import Settings from './components/Settings'
import { SettingsIcon } from './lib/icons'
import { getBpmInterval } from './lib/constants'

export default function App() {
  const [ports, setPorts] = useState([])
  const [killingId, setKillingId] = useState(null)
  const [copied, setCopied] = useState(null)
  const [frame, setFrame] = useState(0)
  const [view, setView] = useState('main') // 'main' | 'settings'
  const [showKillAll, setShowKillAll] = useState(false)

  const count = ports.length
  const speed = getBpmInterval(count)

  // Animation timer
  useEffect(() => {
    const iv = setInterval(() => setFrame((f) => f + 1), speed)
    return () => clearInterval(iv)
  }, [speed])

  // Listen for port updates from main process
  useEffect(() => {
    if (window.portband) {
      window.portband.onPortsUpdate((data) => {
        setPorts(data)
      })
    }
  }, [])

  const handleKill = (port) => {
    setKillingId(port.id)
    if (window.portband) {
      window.portband.killProcess(port.pid)
    }
    setTimeout(() => {
      setPorts((p) => p.filter((x) => x.id !== port.id))
      setKillingId(null)
    }, 400)
  }

  const handleOpen = (port) => {
    if (window.portband) {
      window.portband.openInBrowser(port.port)
    }
  }

  const handleCopy = (port) => {
    if (window.portband) {
      window.portband.copyUrl(port.port)
    }
    setCopied(port.id)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleKillAll = () => {
    if (window.portband) {
      window.portband.killAll(ports.map((p) => p.pid))
    }
    setPorts([])
    setShowKillAll(false)
  }

  if (view === 'settings') {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          background: '#18181b',
          borderRadius: 12,
          border: '1px solid #27272a',
          overflow: 'hidden',
          fontFamily: '-apple-system, "SF Pro Display", "Segoe UI", sans-serif'
        }}
      >
        <Settings onBack={() => setView('main')} />
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: '#18181b',
        borderRadius: 12,
        border: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '-apple-system, "SF Pro Display", "Segoe UI", sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>PortBand</span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 8px',
              borderRadius: 9999,
              fontWeight: 500,
              background: count > 0 ? 'rgba(52,211,153,0.1)' : '#27272a',
              color: count > 0 ? '#34d399' : '#71717a',
              border: `1px solid ${count > 0 ? 'rgba(52,211,153,0.2)' : '#3f3f46'}`
            }}
          >
            {count} active
          </span>
        </div>
        <button
          onClick={() => setView('settings')}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6,
            color: '#71717a'
          }}
        >
          <SettingsIcon size={14} />
        </button>
      </div>

      {/* Content */}
      {count === 0 ? (
        /* Empty state */
        <div style={{ padding: '0 8px 8px' }}>
          <div
            style={{
              height: 144,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px dashed #27272a'
            }}
          >
            <p style={{ fontSize: 12, color: '#52525b' }}>No active ports</p>
          </div>
        </div>
      ) : (
        <>
          {/* Band Stage */}
          <div style={{ padding: '0 8px 8px' }}>
            <BandStage count={count} frame={frame} />
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: '#27272a' }} />

          {/* Port list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 4px',
              maxHeight: 256
            }}
          >
            {ports.map((p) => (
              <PortRow
                key={p.id}
                port={p}
                onKill={handleKill}
                onOpen={handleOpen}
                onCopy={handleCopy}
                killing={killingId === p.id}
                justCopied={copied}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer separator */}
      <div style={{ height: 1, background: '#27272a' }} />

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          marginTop: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {count > 0 && <LivePulse />}
          <span style={{ fontSize: 10, color: '#52525b' }}>
            {count > 0 ? 'Watching ports' : 'Idle'}
          </span>
        </div>
        {count > 0 && (
          <button
            onClick={() => setShowKillAll(true)}
            style={{
              height: 24,
              padding: '0 10px',
              fontSize: 12,
              color: '#f87171',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 4,
              fontWeight: 500
            }}
          >
            Kill All
          </button>
        )}
      </div>

      {/* Kill All Confirmation Dialog */}
      {showKillAll && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowKillAll(false)}
        >
          <div
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 12,
              padding: 20,
              width: 280,
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 6 }}>
              Kill all {count} processes?
            </h3>
            <p style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 16 }}>
              This will send SIGTERM to all listening processes.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowKillAll(false)}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #3f3f46',
                  background: '#27272a',
                  color: '#e4e4e7',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleKillAll}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Kill All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
