import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';

export interface ChatMessageMetadata {
  provider?: string;
  render?: {
    format?: string;
    html?: string;
    markdown?: string;
    plainText?: string;
  };
  cardData?: SmartbotCardData[];
  [key: string]: unknown;
}

interface SmartbotCardButton {
  title?: string;
  payload?: string;
  payload_id?: string;
  type?: string;
}

interface SmartbotCardData {
  type?: string;
  text?: string;
  title?: string;
  subtitle?: string;
  html?: string;
  content?: string;
  image_url?: string | null;
  thumbnail?: string | null;
  audio_url?: string | null;
  play_type?: string;
  buttons?: SmartbotCardButton[];
}

interface AssistantMessageContentProps {
  content: string;
  metadata?: ChatMessageMetadata | null;
  onQuickReply: (message: string) => void;
}

const ALLOWED_HTML_TAGS = [
  'a',
  'article',
  'b',
  'blockquote',
  'br',
  'button',
  'code',
  'del',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];

const ALLOWED_HTML_ATTRS = [
  'align',
  'alt',
  'class',
  'colspan',
  'height',
  'href',
  'rel',
  'rowspan',
  'src',
  'style',
  'target',
  'title',
  'width',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLikelyHtmlSnippet(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed.startsWith('```')) {
    return false;
  }

  if (!trimmed.includes('<') || !trimmed.includes('>')) {
    return false;
  }

  return /<(article|aside|blockquote|br|button|code|div|figure|figcaption|footer|h[1-6]|header|hr|img|li|ol|p|pre|section|small|span|strong|sub|sup|table|tbody|td|th|thead|tr|ul)\b[^>]*>/i.test(
    trimmed,
  );
}

function sanitizeRichHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_HTML_TAGS,
    ALLOWED_ATTR: ALLOWED_HTML_ATTRS,
    FORBID_TAGS: ['form', 'iframe', 'input', 'object', 'option', 'script', 'select', 'style', 'textarea'],
  }).trim();
}

function normalizeCardData(metadata?: ChatMessageMetadata | null) {
  if (!metadata || !('cardData' in metadata) || !Array.isArray(metadata.cardData)) {
    return [];
  }

  return metadata.cardData.filter((card): card is SmartbotCardData => isRecord(card));
}

function getCandidateHtml(metadata: ChatMessageMetadata | null | undefined, content: string) {
  const render = metadata?.render;

  if (render?.format === 'html' && typeof render.html === 'string' && render.html.trim()) {
    return render.html;
  }

  for (const card of normalizeCardData(metadata)) {
    const candidates = [card.html, card.content, card.text];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && isLikelyHtmlSnippet(candidate)) {
        return candidate;
      }
    }
  }

  if (isLikelyHtmlSnippet(content)) {
    return content;
  }

  return null;
}

function hasRichCardContent(card: SmartbotCardData) {
  return Boolean(
    (typeof card.title === 'string' && card.title.trim()) ||
      (typeof card.subtitle === 'string' && card.subtitle.trim()) ||
      (typeof card.text === 'string' && card.text.trim()) ||
      (typeof card.image_url === 'string' && card.image_url.trim()) ||
      (typeof card.thumbnail === 'string' && card.thumbnail.trim()) ||
      (typeof card.audio_url === 'string' && card.audio_url.trim()) ||
      (Array.isArray(card.buttons) && card.buttons.length > 0),
  );
}

export function AssistantMessageContent({
  content,
  metadata,
  onQuickReply,
}: AssistantMessageContentProps) {
  const htmlSource = getCandidateHtml(metadata, content);
  const sanitizedHtml = htmlSource ? sanitizeRichHtml(htmlSource) : '';
  const richCards = sanitizedHtml
    ? []
    : normalizeCardData(metadata).filter(
        (card) => hasRichCardContent(card) && !isLikelyHtmlSnippet(card.text || ''),
      );

  return (
    <div className="assistant-message-stack">
      {sanitizedHtml ? (
        <div
          className="chat-rich-html"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      ) : (
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}

      {richCards.length > 0 && (
        <div className="smartbot-card-list">
          {richCards.map((card, index) => {
            const buttonActions = Array.isArray(card.buttons) ? card.buttons : [];
            const imageUrl = typeof card.image_url === 'string' && card.image_url.trim()
              ? card.image_url
              : typeof card.thumbnail === 'string' && card.thumbnail.trim()
                ? card.thumbnail
                : null;

            return (
              <div key={`${card.type || 'card'}-${index}`} className="smartbot-card">
                {card.title && <div className="smartbot-card-title">{card.title}</div>}
                {card.subtitle && <div className="smartbot-card-subtitle">{card.subtitle}</div>}
                {card.text && card.text.trim() !== content.trim() && (
                  <div className="smartbot-card-text">{card.text}</div>
                )}
                {imageUrl && (
                  <img
                    className="smartbot-card-image"
                    src={imageUrl}
                    alt={card.title || 'Pockie rich content'}
                    loading="lazy"
                  />
                )}
                {card.audio_url && (
                  <audio className="smartbot-card-audio" controls preload="none" src={card.audio_url} />
                )}
                {buttonActions.length > 0 && (
                  <div className="smartbot-card-actions">
                    {buttonActions.map((button, buttonIndex) => {
                      const nextPrompt = button.title?.trim() || button.payload?.trim() || '';

                      return (
                        <button
                          key={`${button.payload_id || button.payload || button.title || 'action'}-${buttonIndex}`}
                          type="button"
                          className="smartbot-card-action"
                          onClick={() => nextPrompt && onQuickReply(nextPrompt)}
                          disabled={!nextPrompt}
                        >
                          {button.title || 'Chon'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
