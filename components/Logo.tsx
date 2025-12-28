import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo image - contains full logo with GMGN text and snowflake */}
      <img 
        src="/GMGNLogoDark.png" 
        alt="GMGN" 
        className="h-full w-auto object-contain"
        style={{ imageRendering: 'pixelated' }}
        onError={(e) => {
          // Fallback to SVG if image not found
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.logo-svg-fallback')) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'logo-svg-fallback');
            svg.setAttribute('width', '28');
            svg.setAttribute('height', '28');
            svg.setAttribute('viewBox', '0 0 28 28');
            svg.setAttribute('style', 'image-rendering: pixelated');
            svg.innerHTML = `
              <rect x="7" y="14" width="14" height="10" fill="#90EE90" />
              <rect x="9" y="16" width="10" height="6" fill="#7CFC00" />
              <rect x="9" y="7" width="10" height="9" fill="#90EE90" />
              <rect x="11" y="9" width="6" height="5" fill="#7CFC00" />
              <rect x="12" y="10" width="2" height="2" fill="#FFFFFF" />
              <rect x="16" y="10" width="2" height="2" fill="#FFFFFF" />
              <rect x="12.5" y="10.5" width="1" height="1" fill="#000000" />
              <rect x="16.5" y="10.5" width="1" height="1" fill="#000000" />
              <rect x="9" y="3" width="10" height="4" fill="#FF0000" />
              <rect x="11" y="1" width="6" height="2" fill="#FF0000" />
              <rect x="19" y="3" width="2" height="2" fill="#FFFFFF" />
              <rect x="19" y="5" width="2" height="2" fill="#FFFFFF" />
              <rect x="11" y="18" width="6" height="5" fill="#F5DEB3" />
            `;
            parent.appendChild(svg);
          }
        }}
      />
    </div>
  );
};

export default Logo;

