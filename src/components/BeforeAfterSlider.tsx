import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
  caption?: string;
  figureNumber?: string;
  width?: string;
  initialPosition?: number; // 0-100, default 50
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeAlt = "Before image",
  afterAlt = "After image",
  caption,
  figureNumber,
  width = "70%",
  initialPosition = 50
}) => {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug log to ensure component is loaded
  useEffect(() => {
    console.log('BeforeAfterSlider mounted');
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSliderPosition(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    updateSliderPosition(touch.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || isDragging) return;
    updateSliderPosition(e.clientX);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div style={{ textAlign: 'center', margin: '0 auto', width }}>
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{
          position: 'relative',
          display: 'inline-block',
          width: '100%',
          maxWidth: '100%',
          cursor: 'ew-resize',
          userSelect: 'none',
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* After image (background) */}
        <img
          src={afterImage}
          alt={afterAlt}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '8px'
          }}
          draggable={false}
        />
        
        {/* Before image (clipped overlay) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
          }}
        >
          <img
            src={beforeImage}
            alt={beforeAlt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
            draggable={false}
          />
        </div>

        {/* Slider line and handle */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${sliderPosition}%`,
            width: '3px',
            height: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(-50%)',
            zIndex: 10
          }}
        />
        
        {/* Slider handle */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${sliderPosition}%`,
            width: '40px',
            height: '40px',
            backgroundColor: '#ffffff',
            border: '3px solid #3A5D44',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'ew-resize',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isDragging ? 'none' : 'all 0.2s ease',
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* Handle arrows */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderRight: '6px solid #3A5D44'
            }} />
            <div style={{
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderLeft: '6px solid #3A5D44'
            }} />
          </div>
        </div>

        {/* Labels */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            pointerEvents: 'none'
          }}
        >
          A
        </div>
        
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            pointerEvents: 'none'
          }}
        >
          B
        </div>
      </div>
      
      {/* Caption */}
      {caption && (
        <p style={{ 
          fontSize: '0.8em', 
          marginTop: '1rem',
          marginBottom: '2rem',
          color: '#666',
          lineHeight: '1.4',
          textAlign: 'center',
          maxWidth: '100%'
        }}>
          {figureNumber && <b>{figureNumber}</b>}
          {figureNumber && ': '}
          <span dangerouslySetInnerHTML={{ __html: caption }} />
        </p>
      )}
    </div>
  );
};

export default BeforeAfterSlider;
