export default function LivePulse() {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
      <span
        style={{
          position: 'absolute',
          display: 'inline-flex',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: '#FB923C',
          opacity: 0.75,
          animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
        }}
      />
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#F59E0B'
        }}
      />
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </span>
  )
}
