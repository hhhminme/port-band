import { useState, useEffect } from 'react'
import { ArrowLeftIcon } from '../lib/icons'

const MIT_LICENSE = `MIT License

Copyright (c) Nico Verbruggen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

const intervalOptions = [
  { label: '1s', value: 1 },
  { label: '2s', value: 2 },
  { label: '5s', value: 5 }
]

export default function Settings({ onBack }) {
  const [prefs, setPrefs] = useState({ openAtLogin: false, scanInterval: 2 })

  useEffect(() => {
    if (window.portband) {
      window.portband.getPreferences().then(setPrefs)
    }
  }, [])

  const updatePref = (key, value) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    if (window.portband) {
      window.portband.setPreferences({ [key]: value })
    }
  }

  return (
    <div style={{ background: '#18181b', minHeight: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid #27272a'
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#71717a',
            display: 'flex',
            alignItems: 'center',
            padding: 4
          }}
        >
          <ArrowLeftIcon size={14} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginLeft: 8 }}>
          Settings
        </span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Open at Login */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: '1px solid #1f1f23'
          }}
        >
          <span style={{ fontSize: 13, color: '#e4e4e7' }}>Open at Login</span>
          <label style={{ position: 'relative', display: 'inline-block', width: 36, height: 20 }}>
            <input
              type="checkbox"
              checked={prefs.openAtLogin}
              onChange={(e) => updatePref('openAtLogin', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: prefs.openAtLogin ? '#34d399' : '#3f3f46',
                borderRadius: 10,
                transition: 'background-color 0.2s'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  height: 16,
                  width: 16,
                  left: prefs.openAtLogin ? 18 : 2,
                  bottom: 2,
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.2s'
                }}
              />
            </span>
          </label>
        </div>

        {/* Scan Interval */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: '1px solid #1f1f23'
          }}
        >
          <span style={{ fontSize: 13, color: '#e4e4e7' }}>Scan interval</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {intervalOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updatePref('scanInterval', opt.value)}
                style={{
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: prefs.scanInterval === opt.value ? '#34d399' : '#27272a',
                  color: prefs.scanInterval === opt.value ? '#09090b' : '#71717a',
                  transition: 'all 0.15s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div style={{ marginTop: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#52525b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            About
          </span>
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5 }}>
              PortBand v1.0.0
            </p>
            <p style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5, marginTop: 4 }}>
              PortBand is inspired by Portsly by Nico Verbruggen.
            </p>
            <p style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5, marginTop: 4 }}>
              Licensed under the MIT License.
            </p>
          </div>

          <details style={{ marginTop: 8 }}>
            <summary
              style={{
                fontSize: 10,
                color: '#52525b',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              View full license
            </summary>
            <pre
              style={{
                fontSize: 9,
                color: '#3f3f46',
                lineHeight: 1.4,
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {MIT_LICENSE}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
