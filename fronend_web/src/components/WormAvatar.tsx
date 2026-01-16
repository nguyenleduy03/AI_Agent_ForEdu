import { motion } from 'framer-motion';

interface WormAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: 0.5,
  md: 0.7,
  lg: 0.9,
  xl: 1.1,
};

const WormAvatar = ({ 
  size = 'md', 
  className = '',
  animate = true,
}: WormAvatarProps) => {
  const scale = sizeMap[size];

  return (
    <motion.div 
      className={`relative ${className}`}
      style={{ 
        width: 80 * scale, 
        height: 80 * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'center'
      }}
      animate={animate ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Main Container */}
      <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-lg">
        <defs>
          {/* 3D Gradient for body */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#90EE90" />
            <stop offset="30%" stopColor="#7CCD7C" />
            <stop offset="70%" stopColor="#5CB85C" />
            <stop offset="100%" stopColor="#4A9F4A" />
          </linearGradient>
          
          {/* Highlight gradient */}
          <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B8F4B8" />
            <stop offset="100%" stopColor="#90EE90" />
          </linearGradient>

          {/* Shadow filter */}
          <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#2D5A2D" floodOpacity="0.3"/>
          </filter>

          {/* Inner shadow for 3D effect */}
          <filter id="innerShadow">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="2" result="offset-blur"/>
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
            <feFlood floodColor="#3D7A3D" floodOpacity="0.4" result="color"/>
            <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
            <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
          </filter>
        </defs>

        {/* Body segments - back to front for 3D layering */}
        {/* Segment 5 (tail) */}
        <motion.ellipse
          cx="105" cy="70" rx="10" ry="9"
          fill="url(#bodyGrad)"
          filter="url(#shadow3d)"
          animate={animate ? { cx: [105, 107, 105], cy: [70, 68, 70] } : {}}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        />
        
        {/* Segment 4 */}
        <motion.ellipse
          cx="90" cy="65" rx="12" ry="11"
          fill="url(#bodyGrad)"
          filter="url(#shadow3d)"
          animate={animate ? { cx: [90, 92, 90], cy: [65, 63, 65] } : {}}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
        />
        
        {/* Segment 3 */}
        <motion.ellipse
          cx="73" cy="58" rx="14" ry="13"
          fill="url(#bodyGrad)"
          filter="url(#shadow3d)"
          animate={animate ? { cx: [73, 75, 73], cy: [58, 56, 58] } : {}}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
        />
        
        {/* Segment 2 */}
        <motion.ellipse
          cx="54" cy="50" rx="16" ry="15"
          fill="url(#bodyGrad)"
          filter="url(#shadow3d)"
          animate={animate ? { cx: [54, 56, 54], cy: [50, 48, 50] } : {}}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
        />

        {/* Head */}
        <motion.ellipse
          cx="32" cy="42" rx="22" ry="20"
          fill="url(#bodyGrad)"
          filter="url(#shadow3d)"
          animate={animate ? { cy: [42, 40, 42] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Belly (lighter area) */}
        <ellipse cx="32" cy="48" rx="14" ry="10" fill="#C8F7C8" opacity="0.7" />

        {/* Antenna left */}
        <motion.g
          animate={animate ? { rotate: [-8, 8, -8] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: '24px 26px' }}
        >
          <path d="M24 26 Q18 12 14 8" stroke="#5CB85C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="14" cy="8" r="4" fill="#5CB85C" />
          <circle cx="13" cy="7" r="1.5" fill="#90EE90" />
        </motion.g>

        {/* Antenna right */}
        <motion.g
          animate={animate ? { rotate: [8, -8, 8] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ transformOrigin: '40px 26px' }}
        >
          <path d="M40 26 Q46 12 50 8" stroke="#5CB85C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="8" r="4" fill="#5CB85C" />
          <circle cx="49" cy="7" r="1.5" fill="#90EE90" />
        </motion.g>

        {/* Eyes - white part */}
        <ellipse cx="24" cy="38" rx="8" ry="9" fill="white" />
        <ellipse cx="40" cy="38" rx="8" ry="9" fill="white" />

        {/* Eyes - pupils */}
        <motion.g
          animate={animate ? { x: [0, 1, 0, -1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <ellipse cx="26" cy="40" rx="4" ry="5" fill="#2D3748" />
          <ellipse cx="42" cy="40" rx="4" ry="5" fill="#2D3748" />
          {/* Eye shine */}
          <circle cx="24" cy="37" r="2" fill="white" />
          <circle cx="40" cy="37" r="2" fill="white" />
        </motion.g>

        {/* Eyelashes */}
        <path d="M17 32 Q19 30 21 32" stroke="#4A5568" strokeWidth="1.5" fill="none" />
        <path d="M43 32 Q45 30 47 32" stroke="#4A5568" strokeWidth="1.5" fill="none" />

        {/* Cheeks (blush) */}
        <ellipse cx="14" cy="48" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="50" cy="48" rx="5" ry="3" fill="#FFB6C1" opacity="0.6" />

        {/* Smile */}
        <motion.path
          d="M24 52 Q32 60 40 52"
          stroke="#4A9F4A"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          animate={animate ? { d: ['M24 52 Q32 60 40 52', 'M24 52 Q32 58 40 52', 'M24 52 Q32 60 40 52'] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Small hands/feet */}
        <ellipse cx="20" cy="58" rx="4" ry="3" fill="#5CB85C" />
        <ellipse cx="44" cy="58" rx="4" ry="3" fill="#5CB85C" />

        {/* Highlight on head for 3D effect */}
        <ellipse cx="26" cy="30" rx="8" ry="4" fill="white" opacity="0.3" />
      </svg>
    </motion.div>
  );
};

export default WormAvatar;
