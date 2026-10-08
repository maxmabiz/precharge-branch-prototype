function Icon({ name, size = 16 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 3v5h5"></path>
        <path d="M8 13h8M8 17h5"></path>
      </svg>
    );
  }
  if (name === "grid") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.2"></rect>
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"></rect>
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"></rect>
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"></rect>
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6"></circle>
        <path d="M16 16.5 20 20.5"></path>
      </svg>
    );
  }
  if (name === "moon") {
    return (
      <svg {...common}>
        <path d="M20.5 14.2A8.2 8.2 0 1 1 9.8 3.5 6.6 6.6 0 0 0 20.5 14.2z"></path>
      </svg>
    );
  }
  if (name === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3.5"></circle>
        <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg {...common}>
        <path d="M6.2 9a5.8 5.8 0 1 1 11.6 0c0 6.2 2.4 6.6 2.4 8.2H3.8c0-1.6 2.4-2 2.4-8.2z"></path>
        <path d="M10 20a2 2 0 0 0 4 0"></path>
      </svg>
    );
  }
  if (name === "download") {
    return (
      <svg {...common}>
        <path d="M12 4v10"></path>
        <path d="M8 10.5 12 14.5l4-4"></path>
        <path d="M5 19h14"></path>
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2"></rect>
        <path d="M8 3.5v3.5M16 3.5v3.5M4 10h16"></path>
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg {...common}>
        <path d="M7 7l10 10M17 7 7 17"></path>
      </svg>
    );
  }
  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="M6.5 9.5 12 15l5.5-5.5"></path>
      </svg>
    );
  }
  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14"></path>
      </svg>
    );
  }
  if (name === "info") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5"></circle>
        <path d="M12 11v5"></path>
        <path d="M12 8h.01"></path>
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...common}>
        <path d="M5 12.5 9.5 17 19 7.5"></path>
      </svg>
    );
  }
  if (name === "chevL") {
    return (
      <svg {...common}>
        <path d="M14.5 6.5 9 12l5.5 5.5"></path>
      </svg>
    );
  }
  if (name === "chevR") {
    return (
      <svg {...common}>
        <path d="M9.5 6.5 15 12l-5.5 5.5"></path>
      </svg>
    );
  }
  return <svg {...common}></svg>;
}

Object.assign(window, { Icon });
