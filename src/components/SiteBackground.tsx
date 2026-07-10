const iconClass = 'h-full w-full fill-none stroke-current stroke-[1.35] [stroke-linecap:round] [stroke-linejoin:round]';

const SportCarIcon = () => (
  <svg viewBox="0 0 96 48" className={iconClass} aria-hidden="true">
    <path d="M10 31h8l8-10c3-4 8-6 14-6h13c6 0 11 2 15 7l7 9h11" />
    <path d="M22 31h52" />
    <path d="M34 18l-7 10h24l-4-10" />
    <path d="M52 18l10 10h11" />
    <circle cx="29" cy="33" r="6" />
    <circle cx="69" cy="33" r="6" />
    <path d="M8 31c2 7 8 9 17 9h48c8 0 14-3 16-9" />
  </svg>
);

const PressureGunIcon = () => (
  <svg viewBox="0 0 72 72" className={iconClass} aria-hidden="true">
    <path d="M13 25h31l10-7h9" />
    <path d="M19 25v12h19l8-12" />
    <path d="M31 37l9 21h-9l-8-21" />
    <path d="M44 25l6 10" />
    <path d="M57 17l8-4" />
    <path d="M58 23h10" />
    <path d="M56 29l8 4" />
  </svg>
);

const SprayDropIcon = () => (
  <svg viewBox="0 0 72 72" className={iconClass} aria-hidden="true">
    <path d="M35 10s17 19 17 33a17 17 0 0 1-34 0C18 29 35 10 35 10Z" />
    <path d="M43 44c-1 6-5 9-11 9" />
    <path d="M51 15l8-6" />
    <path d="M56 25h9" />
    <path d="M53 34l8 5" />
  </svg>
);

const PolishSparklesIcon = () => (
  <svg viewBox="0 0 72 72" className={iconClass} aria-hidden="true">
    <path d="M35 8l5 17 17 5-17 5-5 17-5-17-17-5 17-5 5-17Z" />
    <path d="M56 45l3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" />
    <path d="M15 43l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />
  </svg>
);

const PolisherIcon = () => (
  <svg viewBox="0 0 72 72" className={iconClass} aria-hidden="true">
    <path d="M23 36h25a10 10 0 0 1 10 10v3H13v-3a10 10 0 0 1 10-10Z" />
    <path d="M26 36l5-16h14l5 16" />
    <path d="M29 20h19l5 6" />
    <path d="M18 49c3 7 9 11 18 11s15-4 18-11" />
    <path d="M15 27c-3-1-5-3-5-6 0-4 4-6 8-4" />
    <path d="M58 30c5 0 8 2 8 6 0 3-2 5-5 6" />
  </svg>
);

const floatingIcons = [
  { Icon: SportCarIcon, className: 'left-[5%] top-[9%] h-28 w-44 float-delay-0' },
  { Icon: PressureGunIcon, className: 'right-[8%] top-[16%] h-24 w-24 float-delay-2' },
  { Icon: SprayDropIcon, className: 'left-[14%] top-[46%] h-20 w-20 float-delay-4' },
  { Icon: PolishSparklesIcon, className: 'right-[18%] top-[52%] h-24 w-24 float-delay-1' },
  { Icon: PolisherIcon, className: 'left-[48%] top-[76%] h-24 w-24 float-delay-3' },
  { Icon: SportCarIcon, className: 'right-[4%] top-[82%] h-24 w-40 float-delay-5' },
];

const SiteBackground = () => (
  <div className="site-background" aria-hidden="true">
    <div className="site-background__hex" />
    <div className="site-background__glow site-background__glow--one" />
    <div className="site-background__glow site-background__glow--two" />
    <div className="site-background__icons">
      {floatingIcons.map(({ Icon, className }, index) => (
        <div key={index} className={`floating-line-icon ${className}`}>
          <Icon />
        </div>
      ))}
    </div>
  </div>
);

export default SiteBackground;
