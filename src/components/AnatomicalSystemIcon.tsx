import React from 'react';
import { SystemId } from '../types/anatomy';

interface AnatomicalSystemIconProps {
  systemId: SystemId;
  className?: string;
}

export const AnatomicalSystemIcon: React.FC<AnatomicalSystemIconProps> = ({
  systemId,
  className = 'w-5 h-5',
}) => {
  switch (systemId) {
    case 'respiratory':
      // Trachea & bilateral lungs monoline atlas icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 3v7" />
          <path d="M10.5 5h3" />
          <path d="M10.5 7.5h3" />
          <path d="M12 10l-3.2 2.5" />
          <path d="M12 10l3.2 2.5" />
          <path d="M9.5 8.5C7 8.5 4 11.2 4 16c0 2.5 1.3 4 3.2 4 1.5 0 2.6-.9 2.8-2.4V11" />
          <path d="M14.5 8.5C17 8.5 20 11.2 20 16c0 2.5-1.3 4-3.2 4-1.5 0-2.6-.9-2.8-2.4V11" />
        </svg>
      );

    case 'digestive':
      // Esophagus, stomach & duodenum monoline icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M10 3v4.5c0 1.2-1 2-2.2 2.6C5.6 11.3 4.5 13.5 5 16c.5 2.4 2.7 4 5.5 4 3.8 0 7-2.6 7-6.3 0-2.8-1.9-5-4.3-5.2-.9-.1-1.2-.8-1.2-1.7V3" />
          <path d="M14.5 17.5c1.8.4 3 1.4 3 2.8 0 1-.6 1.7-1.5 1.7" />
        </svg>
      );

    case 'nervous':
      // Cerebrum & brainstem monoline icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 4.5C9 4.5 7 6.3 6.8 8.5 5 9 4 10.7 4 12.6c0 2.1 1.5 3.8 3.5 4.2.7 1.3 2 2.2 3.5 2.2h2c1.5 0 2.8-.9 3.5-2.2 2-.4 3.5-2.1 3.5-4.2 0-1.9-1-3.6-2.8-4.1C17 6.3 15 4.5 12 4.5Z" />
          <path d="M12 4.5v16.5" />
          <path d="M8.5 9.5c1 .5 1.8 1.2 2 2.3" />
          <path d="M15.5 9.5c-1 .5-1.8 1.2-2 2.3" />
          <path d="M7.5 14c1.2-.2 2.2.2 2.8 1" />
          <path d="M16.5 14c-1.2-.2-2.2.2-2.8 1" />
        </svg>
      );

    case 'female_reproductive':
      // Uterus, fallopian tubes & ovaries monoline icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M9 8.5h6l-1.3 6.2c-.2 1-.9 1.8-1.7 1.8s-1.5-.8-1.7-1.8L9 8.5Z" />
          <path d="M12 16.5V21" />
          <path d="M9 8.5C7 8.5 5 9.2 4 11" />
          <path d="M15 8.5c2 0 4 .7 5 2.5" />
          <circle cx="4.5" cy="13" r="1.5" />
          <circle cx="19.5" cy="13" r="1.5" />
        </svg>
      );

    case 'male_reproductive':
      // Paired anatomical gonads / ductal monoline icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 4v6.5" />
          <path d="M8.5 10.5h7a2 2 0 0 1 1.9 2.6l-.7 2.2a4.8 4.8 0 0 1-9.4 0l-.7-2.2a2 2 0 0 1 1.9-2.6Z" />
          <path d="M9.5 7.5c0-1.6 1.1-3 2.5-3s2.5 1.4 2.5 3" />
          <circle cx="9.2" cy="16.2" r="2.2" />
          <circle cx="14.8" cy="16.2" r="2.2" />
        </svg>
      );

    case 'urinary':
      // Kidneys, ureters & bladder monoline icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M7.5 4.5C5.5 4.5 4 6.2 4 8.5c0 2.2 1.4 3.8 3.2 3.8 1.2 0 2-.7 2-1.9 0-.8-.5-1.4-.5-2 0-.6.5-1.2.5-2 0-1.1-.7-1.9-1.7-1.9Z" />
          <path d="M16.5 4.5c2 0 3.5 1.7 3.5 4 0 2.2-1.4 3.8-3.2 3.8-1.2 0-2-.7-2-1.9 0-.8.5-1.4.5-2 0-.6-.5-1.2-.5-2 0-1.1.7-1.9 1.7-1.9Z" />
          <path d="M9.2 9.5c.8 1.5 1.3 4 1.3 6.5" />
          <path d="M14.8 9.5c-.8 1.5-1.3 4-1.3 6.5" />
          <path d="M9 16.5c0-1 1.3-1.5 3-1.5s3 .5 3 1.5c0 1.6-1.3 3-3 3s-3-1.4-3-3Z" />
          <path d="M12 19.5V21" />
        </svg>
      );

    case 'cardiovascular':
      // Anatomical heart & aortic arch monoline icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M10.5 7.5V5c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v3" />
          <path d="M13 3v2" />
          <path d="M8.5 8.5V6.5" />
          <path d="M12 8.8c-1.4-1.2-3.5-1.3-4.9-.1-1.6 1.4-1.8 4-.3 6 1.5 2 3.7 4.2 5.4 5.3.4.3 1 .3 1.4 0 1.7-1.1 3.8-3.2 5.1-5.2 1.4-2.1 1-4.8-.8-6-1.4-1-3.3-.8-4.5.3" />
          <path d="M8.5 13h2l1.2-2.2 1.5 4 1.2-1.8h1.8" />
        </svg>
      );

    case 'endocrine':
      // Butterfly thyroid gland & trachea monoline icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 3.5v17" />
          <path d="M10.2 5.5h3.6" />
          <path d="M10.2 17.5h3.6" />
          <path d="M12 10.5c-1.8-2.2-4.8-3-6.2-1.5-1.2 1.3-1 4.8.4 6.5 1.3 1.6 4.1 1 5.8-1.5" />
          <path d="M12 10.5c1.8-2.2 4.8-3 6.2-1.5 1.2 1.3 1 4.8-.4 6.5-1.3 1.6-4.1 1-5.8-1.5" />
        </svg>
      );
  }
};
