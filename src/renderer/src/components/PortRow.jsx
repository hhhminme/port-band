import { memo } from 'react'
import { SvgIcon, ExternalLinkIcon, CopyIcon, CheckIcon, XIcon } from '../lib/icons'

const btnStyle = {
  height: 26,
  width: 26,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 5,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0
}

function PortRow({ port, onKill, onOpen, onCopy, killing, justCopied }) {
  const isCopied = justCopied === port.id

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '7px 12px',
        borderRadius: 6,
        opacity: killing ? 0.15 : 1,
        transform: killing ? 'translateX(80px)' : 'none',
        transition: 'all 0.35s ease'
      }}
    >
      <div style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <SvgIcon name={port.iconKey} size={15} />
      </div>

      <div style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#e4e4e7',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            :{port.port}
          </span>
          <span style={{ fontSize: 12, color: '#71717a' }}>{port.name}</span>
        </div>
        <span style={{ fontSize: 10, color: '#52525b', fontFamily: 'monospace' }}>
          PID {port.pid}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <button
          onClick={() => onOpen(port)}
          aria-label="Open in browser"
          style={{ ...btnStyle, color: '#52525b' }}
        >
          <ExternalLinkIcon size={12} />
        </button>
        <button
          onClick={() => onCopy(port)}
          aria-label="Copy URL"
          style={{ ...btnStyle, color: isCopied ? '#34d399' : '#52525b' }}
        >
          {isCopied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
        </button>
        <button
          onClick={() => onKill(port)}
          aria-label="Kill process"
          style={{ ...btnStyle, color: '#ef4444' }}
        >
          <XIcon size={12} />
        </button>
      </div>
    </div>
  )
}

export default memo(PortRow, (prev, next) => {
  return (
    prev.port === next.port &&
    prev.killing === next.killing &&
    prev.justCopied === next.justCopied &&
    prev.onKill === next.onKill &&
    prev.onOpen === next.onOpen &&
    prev.onCopy === next.onCopy
  )
})
