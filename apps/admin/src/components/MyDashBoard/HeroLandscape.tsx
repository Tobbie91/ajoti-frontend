import { useId } from "react";

/** Decorative, responsive landscape matching the dashboard's growth theme. */
export function HeroLandscape() {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      viewBox="0 0 1200 340"
      preserveAspectRatio="xMaxYMax slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-sun`} x2="0.8" y2="1">
          <stop stopColor="#ffe58a" />
          <stop offset="1" stopColor="#ffdc65" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x2="1" y2="1">
          <stop stopColor="#75ac65" />
          <stop offset="1" stopColor="#226246" />
        </linearGradient>
      </defs>
      <path
        d="M360 340 C560 225 735 178 900 78 L1040 340Z"
        fill="#fff6cf"
        opacity=".6"
      />
      <circle cx="960" cy="123" r="101" fill={`url(#${id}-sun)`} />
      <path
        d="M160 340 C330 315 443 244 608 265 S800 343 952 265 S1121 184 1200 215 V340Z"
        fill="#d8edc5"
      />
      <path
        d="M480 340 C635 251 680 171 800 174 S940 268 1028 239 S1144 166 1200 171 V340Z"
        fill="#4d8b66"
      />
      <path
        d="M525 340 C654 269 755 226 845 234 S1004 291 1091 253 S1174 227 1200 225 V340Z"
        fill="#287354"
      />
      <path
        d="M430 340 C584 318 645 255 765 252 S965 320 1069 273 S1167 240 1200 243 V340Z"
        fill="#0b5142"
      />
      <path
        d="M690 340 C823 271 895 291 987 298 S1109 268 1200 288 V340Z"
        fill="#143f3c"
      />
      <g stroke="#225c3e" strokeLinecap="round" fill="none">
        <path d="M1131 252 C1130 211 1125 180 1136 143" strokeWidth="4" />
        <path d="M1130 210 C1115 191 1103 181 1094 168" strokeWidth="3" />
      </g>
      <path
        d="M1134 165 C1116 134 1144 99 1181 86 C1189 115 1168 153 1134 165Z"
        fill={`url(#${id}-leaf)`}
      />
      <path
        d="M1127 201 C1092 202 1072 181 1079 155 C1108 158 1126 176 1127 201Z"
        fill={`url(#${id}-leaf)`}
      />
      <path
        d="M1137 155 C1147 135 1160 117 1174 102 M1119 192 C1107 180 1096 170 1086 163"
        stroke="#b1cf8e"
        strokeWidth="1"
        opacity=".45"
        fill="none"
      />
    </svg>
  );
}
