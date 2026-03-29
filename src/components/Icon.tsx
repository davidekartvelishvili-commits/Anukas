type IconType =
  | "bell"
  | "spin"
  | "wallet"
  | "map"
  | "star"
  | "trophy"
  | "arrow-right"
  | "check"
  | "x"
  | "clock"
  | "flame"
  | "users"
  | "scan"
  | "game"
  | "user"
  | "home";

interface IconProps {
  name: IconType;
  size?: number;
  color?: string;
  className?: string;
}

export default function Icon({ name, size = 20, color = "currentColor", className }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "bell":
      return (
        <svg {...props}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );

    case "spin":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.2" stroke={color} />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" />
        </svg>
      );

    case "wallet":
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M22 6V5a2 2 0 00-2-2H6a4 4 0 00-4 4" />
          <circle cx="18" cy="14" r="1" fill={color} stroke="none" />
        </svg>
      );

    case "map":
      return (
        <svg {...props}>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );

    case "star":
      return (
        <svg {...props} fill={color} fillOpacity="0.15">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );

    case "trophy":
      return (
        <svg {...props}>
          <path d="M6 3h12v6a6 6 0 01-12 0V3z" fill={color} fillOpacity="0.1" />
          <path d="M6 5H4a1 1 0 00-1 1v1a4 4 0 004 4" />
          <path d="M18 5h2a1 1 0 011 1v1a4 4 0 01-4 4" />
          <path d="M12 13v3" />
          <path d="M8 19h8" />
          <path d="M9 19v-3h6v3" />
        </svg>
      );

    case "arrow-right":
      return (
        <svg {...props}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );

    case "check":
      return (
        <svg {...props}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );

    case "x":
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );

    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );

    case "flame":
      return (
        <svg {...props} fill={color} fillOpacity="0.2">
          <path d="M12 2c.5 4-2.5 6-2.5 10a5 5 0 0010 0c0-4-3-5.5-2.5-10a7.4 7.4 0 01-5 0z" />
          <path d="M12 18a2.5 2.5 0 002.5-2.5c0-2-2.5-3-2.5-5-.5 1.5-2.5 2.5-2.5 5A2.5 2.5 0 0012 18z" fill={color} fillOpacity="0.4" />
        </svg>
      );

    case "users":
      return (
        <svg {...props}>
          <circle cx="9" cy="7" r="4" />
          <path d="M1 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
          <circle cx="18" cy="8" r="3" />
          <path d="M23 21v-2a3 3 0 00-2-2.83" />
        </svg>
      );

    case "scan":
      return (
        <svg {...props}>
          <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2M17 21h2a2 2 0 002-2v-2" />
          <path d="M7 12h10" strokeWidth="2.5" />
          <path d="M12 7v10" strokeWidth="2.5" />
        </svg>
      );

    case "game":
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="4" />
          <circle cx="8" cy="12" r="1.5" fill={color} stroke="none" />
          <circle cx="16" cy="10" r="1" fill={color} stroke="none" />
          <circle cx="16" cy="14" r="1" fill={color} stroke="none" />
          <circle cx="14" cy="12" r="1" fill={color} stroke="none" />
          <circle cx="18" cy="12" r="1" fill={color} stroke="none" />
          <path d="M8 9v6M5 12h6" />
        </svg>
      );

    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="5" />
          <path d="M3 21c0-4.97 4.03-9 9-9s9 4.03 9 9" />
        </svg>
      );

    case "home":
      return (
        <svg {...props}>
          <path d="M3 12l9-9 9 9" />
          <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        </svg>
      );

    default:
      return null;
  }
}
