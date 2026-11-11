import React from 'react';

interface BrainSvgPlateProps {
  activePartId?: string;
  className?: string;
}

export const BrainSvgPlate: React.FC<BrainSvgPlateProps> = ({ activePartId, className = '' }) => {
  const isHighlighted = (part: string) => activePartId === part;

  const partFill = (part: string, baseFill: string) =>
    isHighlighted(part) ? '#BAE6FD' : baseFill;

  const partStroke = (part: string) =>
    isHighlighted(part) ? '#0369A1' : '#3F3226';

  const partStrokeWidth = (part: string) =>
    isHighlighted(part) ? 2.6 : 1.6;

  return (
    <svg
      viewBox="0 0 800 600"
      className={`w-full h-full select-none ${className}`}
      role="img"
      aria-label="แผนภาพกายวิภาคสมองมนุษย์ ด้านข้างและภาคตัดกลาง"
    >
      <defs>
        <radialGradient id="paperBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#FAF8F3" />
          <stop offset="100%" stopColor="#F1ECE1" />
        </radialGradient>
        <pattern id="subtleGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5DFD2" strokeWidth="0.6" />
        </pattern>
      </defs>

      <rect width="800" height="600" fill="url(#paperBg)" />
      <rect width="800" height="600" fill="url(#subtleGrid)" opacity="0.55" />

      {/* Center subtle divider line between lateral & midsagittal views */}
      <line x1="400" y1="70" x2="400" y2="530" stroke="#D8D0C0" strokeWidth="1" strokeDasharray="4 6" />

      {/* ================= LEFT: LATERAL VIEW ================= */}
      <g id="lateral-view">
        {/* Frontal Lobe */}
        <path
          d="M 65 275 C 62 200, 102 135, 175 125 C 200 122, 218 124, 224 134 C 216 176, 210 218, 200 264 C 175 274, 146 290, 114 300 C 84 306, 67 296, 65 275 Z"
          fill={partFill('frontal', '#EBDAC6')}
          stroke={partStroke('frontal')}
          strokeWidth={partStrokeWidth('frontal')}
          strokeLinejoin="round"
        />
        {/* Parietal Lobe */}
        <path
          d="M 224 134 C 258 130, 304 146, 332 184 C 338 192, 344 214, 332 238 C 304 248, 260 256, 200 264 C 210 218, 216 176, 224 134 Z"
          fill={partFill('parietal', '#E6D2BC')}
          stroke={partStroke('parietal')}
          strokeWidth={partStrokeWidth('parietal')}
          strokeLinejoin="round"
        />
        {/* Occipital Lobe */}
        <path
          d="M 332 184 C 362 215, 376 262, 362 308 C 352 332, 330 342, 302 338 C 300 302, 314 268, 332 238 Z"
          fill={partFill('occipital', '#E2CCB4')}
          stroke={partStroke('occipital')}
          strokeWidth={partStrokeWidth('occipital')}
          strokeLinejoin="round"
        />
        {/* Temporal Lobe */}
        <path
          d="M 114 300 C 146 290, 175 274, 200 264 C 260 256, 304 248, 332 238 C 314 268, 300 302, 302 338 C 280 356, 232 364, 180 358 C 134 352, 108 328, 114 300 Z"
          fill={partFill('temporal', '#EAD7C2')}
          stroke={partStroke('temporal')}
          strokeWidth={partStrokeWidth('temporal')}
          strokeLinejoin="round"
        />
        {/* Cerebellum (Lateral) */}
        <path
          d="M 244 354 C 272 346, 312 342, 346 356 C 356 382, 340 418, 304 426 C 270 432, 240 410, 238 380 C 238 368, 240 358, 244 354 Z"
          fill={partFill('cerebellum', '#D9BF9F')}
          stroke={partStroke('cerebellum')}
          strokeWidth={partStrokeWidth('cerebellum')}
          strokeLinejoin="round"
        />
        {/* Cerebellar Folia lines */}
        <g stroke="#6B533E" strokeWidth="1" fill="none" opacity="0.65">
          <path d="M 248 370 Q 294 360 346 368" />
          <path d="M 244 382 Q 294 374 344 384" />
          <path d="M 246 394 Q 294 388 336 398" />
          <path d="M 254 406 Q 292 402 324 410" />
        </g>
        {/* Brainstem stub on lateral */}
        <path
          d="M 212 358 C 218 390, 224 438, 228 476 L 258 476 C 254 440, 250 408, 246 384"
          fill="#E4D2BE"
          stroke="#3F3226"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Cortical Gyri & Sulci details (Lateral) */}
        <g stroke="#5A4636" strokeWidth="1.25" fill="none" strokeLinecap="round" opacity="0.72">
          {/* Central Sulcus */}
          <path d="M 224 134 C 218 164, 212 198, 200 254" strokeWidth="2" />
          {/* Lateral Sulcus (Sylvian fissure) */}
          <path d="M 116 298 C 165 280, 220 264, 290 250" strokeWidth="2" />
          {/* Frontal gyri */}
          <path d="M 96 218 C 122 204, 152 212, 174 198" />
          <path d="M 112 174 C 142 162, 174 168, 198 158" />
          <path d="M 88 260 C 118 250, 148 254, 176 238" />
          <path d="M 188 152 C 184 188, 178 220, 168 254" />
          {/* Parietal gyri */}
          <path d="M 246 154 C 242 184, 236 214, 230 242" />
          <path d="M 264 172 C 288 166, 308 178, 318 196" />
          <path d="M 254 214 C 282 206, 306 212, 322 222" />
          {/* Temporal gyri */}
          <path d="M 140 322 C 186 306, 236 296, 286 286" />
          <path d="M 164 342 C 208 332, 250 324, 286 312" />
          {/* Occipital gyri */}
          <path d="M 328 264 C 344 268, 354 282, 348 298" />
          <path d="M 316 308 C 332 312, 344 322, 342 332" />
        </g>
      </g>

      {/* ================= RIGHT: MIDSAGITTAL VIEW ================= */}
      <g id="midsagittal-view">
        {/* Outer Cerebral Cortex shell */}
        <path
          d="M 434 268 C 434 188, 496 125, 594 125 C 686 125, 750 184, 754 262 C 756 306, 734 344, 692 344 C 668 344, 646 322, 622 308 C 584 290, 526 296, 480 298 C 450 298, 434 286, 434 268 Z"
          fill="#EBDAC6"
          stroke="#3F3226"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        {/* Gyral folds along medial wall */}
        <g stroke="#5A4636" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7">
          <path d="M 476 210 C 498 188, 536 172, 586 168 C 642 166, 694 184, 718 224" />
          <path d="M 520 138 L 532 172" />
          <path d="M 588 128 L 588 166" />
          <path d="M 656 142 L 642 176" />
          <path d="M 712 178 L 686 202" />
          <path d="M 446 244 L 486 238" />
          <path d="M 700 264 L 748 264" />
          <path d="M 678 300 L 726 318" />
        </g>

        {/* Corpus Callosum (C-shaped white matter arch) */}
        <path
          d="M 498 250 C 494 218, 532 192, 590 192 C 644 192, 682 216, 682 244 C 682 256, 668 264, 654 256 C 646 234, 622 218, 586 218 C 546 218, 524 234, 520 256 C 510 262, 500 258, 498 250 Z"
          fill={partFill('corpus-callosum', '#F7EFE4')}
          stroke={partStroke('corpus-callosum')}
          strokeWidth={partStrokeWidth('corpus-callosum')}
          strokeLinejoin="round"
        />

        {/* Fornix & Septum Pellucidum */}
        <path
          d="M 526 254 C 546 232, 594 226, 636 244 C 610 244, 578 248, 558 268"
          fill="#EFE5D6"
          stroke="#5A4636"
          strokeWidth="1.2"
        />

        {/* Thalamus (oval center) */}
        <ellipse
          cx="584"
          cy="270"
          rx="36"
          ry="23"
          fill={partFill('thalamus', '#DEC4A8')}
          stroke={partStroke('thalamus')}
          strokeWidth={partStrokeWidth('thalamus')}
        />
        {/* Interthalamic adhesion */}
        <circle cx="584" cy="268" r="5" fill="#B8997A" opacity="0.65" />

        {/* Hypothalamus & Pituitary stalk */}
        <path
          d="M 548 282 C 540 296, 540 314, 548 326 C 556 328, 566 314, 570 292 Z"
          fill="#E5CFB7"
          stroke="#3F3226"
          strokeWidth="1.3"
        />

        {/* Brainstem (Midbrain, Pons, Medulla) */}
        <path
          d="M 564 294 C 578 292, 598 294, 608 308 C 602 322, 600 338, 600 356 C 604 378, 606 410, 608 448 L 608 486 L 574 486 L 572 442 C 568 416, 558 394, 554 372 C 544 358, 542 338, 552 324 C 558 314, 560 304, 564 294 Z"
          fill={partFill('brainstem', '#EAD8C4')}
          stroke={partStroke('brainstem')}
          strokeWidth={partStrokeWidth('brainstem')}
          strokeLinejoin="round"
        />
        {/* Pons bulge & Medulla boundary lines */}
        <path d="M 556 330 Q 578 334 598 326" fill="none" stroke="#5A4636" strokeWidth="1.2" opacity="0.7" />
        <path d="M 558 378 Q 580 384 602 376" fill="none" stroke="#5A4636" strokeWidth="1.2" opacity="0.7" />

        {/* Midsagittal Cerebellum (Arbor Vitae) */}
        <path
          d="M 608 332 C 634 316, 682 322, 706 352 C 718 378, 702 418, 664 424 C 632 428, 608 408, 606 376 Z"
          fill={partFill('cerebellum', '#D9BF9F')}
          stroke={partStroke('cerebellum')}
          strokeWidth={partStrokeWidth('cerebellum')}
          strokeLinejoin="round"
        />
        {/* Arbor vitae tree branching */}
        <g stroke="#FAF4EB" strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d="M 612 368 L 656 364" />
          <path d="M 632 366 L 648 338" />
          <path d="M 648 364 L 682 346" />
          <path d="M 656 364 L 688 372" />
          <path d="M 644 366 L 674 398" />
          <path d="M 628 368 L 642 404" />
        </g>
      </g>
    </svg>
  );
};
