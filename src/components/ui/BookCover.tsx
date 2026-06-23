import { useState, useCallback } from 'react';

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  className?: string;
}

export default function BookCover({ coverUrl, title, className }: BookCoverProps) {
  const [zoom, setZoom] = useState<3 | 2 | 1 | 0>(coverUrl ? 3 : 0);

  const getUrl = useCallback((z: number): string | null => {
    if (!coverUrl) return null;
    const https = coverUrl.replace(/^http:\/\//i, 'https://');
    return https.replace(/&edge=curl/i, '').replace(/zoom=\d/, `zoom=${z}`);
  }, [coverUrl]);

  const handleError = useCallback(() => {
    if (zoom === 3) setZoom(2);
    else if (zoom === 2) setZoom(1);
    else setZoom(0);
  }, [zoom]);

  const currentUrl = zoom > 0 ? getUrl(zoom) : null;

  if (!currentUrl) {
    return (
      <div
        className={className}
        style={{
          background: 'var(--figma-ui3-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--figma-ui3-text-tertiary)',
          fontSize: '12px',
          textAlign: 'center',
          padding: '8px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {title}
      </div>
    );
  }

  return (
    <img
      src={currentUrl}
      alt={title}
      className={className}
      onError={handleError}
    />
  );
}
