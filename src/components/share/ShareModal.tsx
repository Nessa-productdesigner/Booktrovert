import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ShelfType } from '../../lib/db';
import './ShareModal.css';

interface ShareModalProps {
  bookId: string;
  shelf: ShelfType;
  onClose: () => void;
}

export default function ShareModal({ bookId, shelf, onClose }: ShareModalProps) {
  const [customMessage, setCustomMessage] = useState(
    shelf === 'currently_reading' ? "I'm currently reading this..." :
    shelf === 'read' ? "I just finished this and it was..." : ""
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const requestBody = { book_id: bookId, custom_message: customMessage };
      console.log('Sending request to share-link edge function with body:', requestBody);
      const { data, error: invokeError } = await supabase.functions.invoke('share-link', {
        body: requestBody,
      });

      if (invokeError) {
        // Try to extract the true error message from the edge function response
        const errMsg = invokeError.context?.statusText || invokeError.message || JSON.stringify(invokeError);
        throw new Error(errMsg);
      }
      if (data?.url) {
        setShareUrl(data.url);
      }
    } catch (err: any) {
      console.error('Share error:', err);
      setError(`Failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.getElementById('share-modal-url') as HTMLInputElement;
      if (input) {
        input.select();
        try {
          await navigator.clipboard.writeText(input.value);
        } catch {
          // ignore
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div 
      className="share-modal__overlay" 
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div 
        className="share-modal__content" 
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--figma-ui3-bg, #fff)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '400px', position: 'relative' }}
      >
        <button className="share-modal__close" onClick={onClose}>✕</button>
        
        <h2 className="share-modal__title">Share this book</h2>
        
        {error && <div className="share-modal__error">{error}</div>}

        {!shareUrl ? (
          <div className="share-modal__form">
            <label className="share-modal__label">Add a custom message</label>
            <textarea
              className="share-modal__textarea"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="What did you think of this book?"
              rows={3}
            />
            <button 
              className="share-modal__generate-btn" 
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate link'}
            </button>
          </div>
        ) : (
          <div className="share-modal__result">
            <p className="share-modal__ready-text">Your share link is ready!</p>
            <div className="share-modal__copy-row">
              <input 
                id="share-modal-url" 
                className="share-modal__url-input" 
                value={shareUrl} 
                readOnly 
                onClick={e => (e.target as HTMLInputElement).select()} 
              />
              <button className="share-modal__copy-btn" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {copied && <p className="share-modal__toast">Link copied to clipboard!</p>}
          </div>
        )}
      </div>
    </div>
  );
}
