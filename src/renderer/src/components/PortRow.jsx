import { memo, useState } from 'react'
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
  const [expanded, setExpanded] = useState(false)
  const isCopied = justCopied === port.id
  const displayName = port.projectName || port.name
  const hasDetails = port.cwd || port.fullCommand

  return (
    <div
      style={{
        borderRadius: 6,
        opacity: killing ? 0.15 : 1,
        transform: killing ? 'translateX(80px)' : 'none',
        transition: 'all 0.35s ease'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '7px 12px',
          cursor: hasDetails ? 'pointer' : 'default'
        }}
        onClick={() => hasDetails && setExpanded((v) => !v)}
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
            <span
              style={{
                fontSize: 12,
                color: '#a1a1aa',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {port.framework && (
              <>
                <span style={{ fontSize: 10, color: '#71717a' }}>{port.framework}</span>
                <span style={{ fontSize: 10, color: '#3f3f46' }}>&middot;</span>
              </>
            )}
            <span style={{ fontSize: 10, color: '#52525b', fontFamily: 'monospace' }}>
              PID {port.pid}
            </span>
          </div>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
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
            style={{ ...btnStyle, color: isCopied ? '#FB923C' : '#52525b' }}
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

      {expanded && hasDetails && (
        <div
          style={{
            padding: '2px 12px 8px 42px',
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#52525b',
            lineHeight: 1.6,
            wordBreak: 'break-all'
          }}
        >
          {port.cwd && (
            <div>
              <span style={{ color: '#3f3f46' }}>cwd </span>
              {port.cwd}
            </div>
          )}
          {port.fullCommand && (
            <div>
              <span style={{ color: '#3f3f46' }}>cmd </span>
              {port.fullCommand}
            </div>
          )}
        </div>
      )}
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
