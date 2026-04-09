import React from 'react';

// Renderizado exclusivamente en entorno Web
export function WebBackground() {
  return (
    <div className="cyber-loader-bg">
      <style>{`
        .cyber-loader-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: -1; /* Forzar al fondo */
          overflow: hidden;
          background-color: #020617; /* Slate 950 base */
        }
        
        .cyber-loader-bg .main-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          width: 100%;
          opacity: 0.4; /* Opacidad sutil para fondo */
          transform: scale(2); /* Hacer circuito gigante para background */
        }

        .cyber-loader-bg .loader {
          width: 100%;
        }

        .cyber-loader-bg .trace-bg {
          stroke: #1e293b;
          stroke-width: 1.8;
          fill: none;
        }

        .cyber-loader-bg .trace-flow {
          stroke-width: 1.8;
          fill: none;
          stroke-dasharray: 40 400;
          stroke-dashoffset: 438;
          filter: drop-shadow(0 0 6px currentColor);
          animation: flow 3s cubic-bezier(0.5, 0, 0.9, 1) infinite;
        }

        .cyber-loader-bg .yellow { stroke: #fbbf24; color: #fbbf24; }
        .cyber-loader-bg .blue { stroke: #38bdf8; color: #38bdf8; }
        .cyber-loader-bg .green { stroke: #4ade80; color: #4ade80; }
        .cyber-loader-bg .purple { stroke: #c084fc; color: #c084fc; }
        .cyber-loader-bg .red { stroke: #f87171; color: #f87171; }

        @keyframes flow {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <div className="main-container">
        <div className="loader">
          <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chipGradient" x1={0} y1={0} x2={0} y2={1}>
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="textGradient" x1={0} y1={0} x2={0} y2={1}>
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <linearGradient id="pinGradient" x1={1} y1={0} x2={0} y2={0}>
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            <g id="traces">
              <path d="M100 100 H200 V210 H326" className="trace-bg" />
              <path d="M100 100 H200 V210 H326" className="trace-flow purple" />
              <path d="M80 180 H180 V230 H326" className="trace-bg" />
              <path d="M80 180 H180 V230 H326" className="trace-flow blue" />
              <path d="M60 260 H150 V250 H326" className="trace-bg" />
              <path d="M60 260 H150 V250 H326" className="trace-flow yellow" />
              <path d="M100 350 H200 V270 H326" className="trace-bg" />
              <path d="M100 350 H200 V270 H326" className="trace-flow green" />
              <path d="M700 90 H560 V210 H474" className="trace-bg" />
              <path d="M700 90 H560 V210 H474" className="trace-flow blue" />
              <path d="M740 160 H580 V230 H474" className="trace-bg" />
              <path d="M740 160 H580 V230 H474" className="trace-flow green" />
              <path d="M720 250 H590 V250 H474" className="trace-bg" />
              <path d="M720 250 H590 V250 H474" className="trace-flow red" />
              <path d="M680 340 H570 V270 H474" className="trace-bg" />
              <path d="M680 340 H570 V270 H474" className="trace-flow yellow" />
            </g>
            <rect x={330} y={190} width={140} height={100} rx={20} ry={20} fill="url(#chipGradient)" stroke="#0f172a" strokeWidth={3} filter="drop-shadow(0 0 10px rgba(0,0,0,0.5))" />
            <g>
              {/* Pins Izquierda */}
              <rect x={322} y={205} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={322} y={225} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={322} y={245} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={322} y={265} width={8} height={10} fill="url(#pinGradient)" rx={2} />
            </g>
            <g>
              {/* Pins Derecha */}
              <rect x={470} y={205} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={470} y={225} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={470} y={245} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={470} y={265} width={8} height={10} fill="url(#pinGradient)" rx={2} />
            </g>
            <text x={400} y={240} fontFamily="Arial, sans-serif" fontSize={22} fill="url(#textGradient)" textAnchor="middle" alignmentBaseline="middle">
              TokaVerse
            </text>
            <circle cx={100} cy={100} r={5} fill="#1e293b" />
            <circle cx={80} cy={180} r={5} fill="#1e293b" />
            <circle cx={60} cy={260} r={5} fill="#1e293b" />
            <circle cx={100} cy={350} r={5} fill="#1e293b" />
            <circle cx={700} cy={90} r={5} fill="#1e293b" />
            <circle cx={740} cy={160} r={5} fill="#1e293b" />
            <circle cx={720} cy={250} r={5} fill="#1e293b" />
            <circle cx={680} cy={340} r={5} fill="#1e293b" />
          </svg>
        </div>
      </div>
    </div>
  );
}
