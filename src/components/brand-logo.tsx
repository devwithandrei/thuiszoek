import Link from "next/link";

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  const wordmarkColor = footer ? "#ffffff" : "#14543E";

  return (
    <Link className={`brand${footer ? " footer-brand" : ""}`} href="/" aria-label="ThuisZoek startpagina" translate="no">
      <svg className="brand-logo-svg" width="190" height="40" viewBox="0 0 228 48" role="img" aria-label="ThuisZoek">
        <g fill="none" stroke="#157654" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 21.5 21 7l12.5 11" strokeWidth="3.5" />
          <path d="M10 19v20h13" strokeWidth="3.5" />
          <path d="M18 29v10" strokeWidth="3.5" />
          <circle cx="32.5" cy="29.5" r="8.5" fill="white" strokeWidth="3.5" />
          <path d="m38.5 35.5 5.2 5.2" strokeWidth="3.5" />
        </g>
        <text x="52" y="33.5" fill={wordmarkColor} fontFamily="Arial, Helvetica, sans-serif" fontSize="27" fontWeight="700" letterSpacing="-1.15">ThuisZoek</text>
      </svg>
    </Link>
  );
}
