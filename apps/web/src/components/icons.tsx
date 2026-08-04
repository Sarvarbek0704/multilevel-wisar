// Chiziqli SVG ikonlar (stroke-width 1.5, fill yo'q) — dizayn bo'yicha emoji ishlatilmaydi.

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Svg>
);

export const BookIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" />
    <path d="M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z" />
  </Svg>
);

export const FileIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 3H6v18h12V7z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6M9 16h6" />
  </Svg>
);

export const LayersIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 5h7v14H4zM13 5h7v14h-7z" />
  </Svg>
);

export const CalendarIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 6h16v15H4z" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </Svg>
);

export const ArrowLeft = (props: IconProps) => (
  <Svg {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const ArrowRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const CloseIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const CheckIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 12.5l5 5L20 6.5" />
  </Svg>
);

export const PlayIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);

export const PauseIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M7 4h4v16H7zM13 4h4v16h-4z" />
  </svg>
);

export const TelegramIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.4 13.1 1.5 11.6c-1-.3-1-1 .2-1.5l19-7.3c.9-.3 1.6.2 1.2 1.5z" />
  </svg>
);

export const GoogleIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="#4285F4"
      d="M22.5 12.2c0-.8-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-7.8z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7a6.6 6.6 0 0 1-9.9-3.5H2.2v2.8A11 11 0 0 0 12 23z"
    />
    <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.2V7.2H2.2a11 11 0 0 0 0 9.8z" />
    <path
      fill="#EA4335"
      d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.2 7.2l3.6 2.8A6.6 6.6 0 0 1 12 5.4z"
    />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 6h18v12H3z" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const PhoneIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 3h10v18H7z" />
    <path d="M10.5 18h3" />
  </Svg>
);

export const MicIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-5 0v-6A2.5 2.5 0 0 1 12 3z" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
  </Svg>
);
