import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';

export interface ChatMessageMetadata {
  provider?: string;
  dataContext?: Record<string, unknown>;
  uiPlan?: {
    planId?: string;
    intent?: string;
    totalSteps?: number;
    completionMessage?: string;
    steps?: Array<Record<string, unknown>>;
  };
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

interface InsightItem {
  label: string;
  value: string;
}

interface PlanStepSummary {
  id: string;
  label: string;
  status: string;
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

function pruneEmptyHtml(html: string) {
  if (!html || typeof window === 'undefined') {
    return html;
  }

  const template = window.document.createElement('template');
  template.innerHTML = html;

  const mediaTags = new Set(['AUDIO', 'IMG', 'TABLE', 'VIDEO']);
  const structuralTags = new Set(['BR', 'HR']);

  const pruneNode = (node: Element) => {
    Array.from(node.children).forEach((child) => pruneNode(child));

    const tagName = node.tagName.toUpperCase();
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    const hasMedia = mediaTags.has(tagName);
    const hasStructure = structuralTags.has(tagName);
    const hasMeaningfulChildren = Array.from(node.children).some((child) => {
      const childElement = child as Element;
      const childText = childElement.textContent?.replace(/\s+/g, ' ').trim() || '';
      return Boolean(
        childText ||
          mediaTags.has(childElement.tagName.toUpperCase()) ||
          structuralTags.has(childElement.tagName.toUpperCase()),
      );
    });

    if (!text && !hasMedia && !hasStructure && !hasMeaningfulChildren) {
      node.remove();
    }
  };

  Array.from(template.content.children).forEach((child) => pruneNode(child as Element));

  const normalizedHtml = template.innerHTML.trim();
  const plainText = template.content.textContent?.replace(/\s+/g, ' ').trim() || '';
  const hasRenderableMedia = template.content.querySelector('img, audio, table, video');

  if (!plainText && !hasRenderableMedia) {
    return '';
  }

  return normalizedHtml;
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

function normalizeInsightValue(value: unknown) {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number') {
    return value.toLocaleString('vi-VN');
  }
  if (typeof value === 'boolean') {
    return value ? 'Có' : 'Không';
  }
  return null;
}

function buildInsightItems(metadata?: ChatMessageMetadata | null): InsightItem[] {
  const context = metadata?.dataContext;
  if (!isRecord(context)) return [];

  const items: InsightItem[] = [];

  const pushIfPresent = (label: string, value: unknown) => {
    const normalized = normalizeInsightValue(value);
    if (normalized) {
      items.push({ label, value: normalized });
    }
  };

  pushIfPresent('Số dư tổng', context.balance);
  pushIfPresent('Chi tiêu tháng', context.expense);
  pushIfPresent('Ngân sách còn lại', context.remainingBudget);
  pushIfPresent('Số ví đang hoạt động', context.accountsCount);
  pushIfPresent('Số giao dịch gần đây', context.transactionCount);
  pushIfPresent('Mức dùng ngân sách', typeof context.spentPercent === 'number' ? `${context.spentPercent}%` : null);
  pushIfPresent('Tháng đang soi', context.month);

  if (Array.isArray(context.topCategories) && context.topCategories.length > 0) {
    const topCategories = context.topCategories
      .slice(0, 3)
      .map((item) => {
        if (!isRecord(item)) return null;
        const categoryName = normalizeInsightValue(item.categoryName);
        const percent = normalizeInsightValue(
          typeof item.percent === 'number' ? `${item.percent}%` : item.percent,
        );
        return categoryName && percent ? `${categoryName} ${percent}` : categoryName;
      })
      .filter((item): item is string => Boolean(item))
      .join(', ');

    pushIfPresent('Nhóm chi nổi bật', topCategories);
  }

  if (isRecord(context.primaryWallet)) {
    const walletName = normalizeInsightValue(context.primaryWallet.name);
    const walletBalance = normalizeInsightValue(context.primaryWallet.balance);
    if (walletName && walletBalance) {
      items.push({
        label: 'Ví nổi bật',
        value: `${walletName} · ${walletBalance}`,
      });
    }
  }

  return items;
}

function buildPlanSteps(metadata?: ChatMessageMetadata | null): PlanStepSummary[] {
  const steps = metadata?.uiPlan?.steps;
  if (!Array.isArray(steps)) return [];

  return steps
    .map((step, index) => {
      if (!isRecord(step)) return null;
      const label = normalizeInsightValue(step.label);
      const status = normalizeInsightValue(step.status);
      if (!label || !status) return null;

      return {
        id: typeof step.id === 'string' ? step.id : `step-${index}`,
        label,
        status,
      };
    })
    .filter((step): step is PlanStepSummary => Boolean(step));
}

export function AssistantMessageContent({
  content,
  metadata,
  onQuickReply,
}: AssistantMessageContentProps) {
  const htmlSource = getCandidateHtml(metadata, content);
  const sanitizedHtml = htmlSource ? pruneEmptyHtml(sanitizeRichHtml(htmlSource)) : '';
  const insightItems = sanitizedHtml ? [] : buildInsightItems(metadata);
  const planSteps = sanitizedHtml ? [] : buildPlanSteps(metadata);
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
            const buttonActions = Array.isArray(card.buttons)
              ? card.buttons.filter((button) => (button.title?.trim() || button.payload?.trim()))
              : [];
            const imageUrl = typeof card.image_url === 'string' && card.image_url.trim()
              ? card.image_url
              : typeof card.thumbnail === 'string' && card.thumbnail.trim()
                ? card.thumbnail
                : null;
            const cardText = typeof card.text === 'string' ? card.text.trim() : '';
            const shouldRenderText = cardText && cardText !== content.trim() && !isLikelyHtmlSnippet(cardText);

            if (
              !card.title?.trim() &&
              !card.subtitle?.trim() &&
              !shouldRenderText &&
              !imageUrl &&
              !card.audio_url &&
              buttonActions.length === 0
            ) {
              return null;
            }

            return (
              <div key={`${card.type || 'card'}-${index}`} className="smartbot-card">
                {card.title && <div className="smartbot-card-title">{card.title}</div>}
                {card.subtitle && <div className="smartbot-card-subtitle">{card.subtitle}</div>}
                {shouldRenderText && (
                  <div className="smartbot-card-text">{cardText}</div>
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

      {!sanitizedHtml && (insightItems.length > 0 || planSteps.length > 0) && (
        <div className="pockie-evidence-stack">
          {insightItems.length > 0 && (
            <section className="pockie-evidence-card">
              <div className="pockie-evidence-title">Pockie đang thấy dữ liệu thật</div>
              <div className="pockie-evidence-grid">
                {insightItems.map((item) => (
                  <div key={item.label} className="pockie-evidence-item">
                    <div className="pockie-evidence-label">{item.label}</div>
                    <div className="pockie-evidence-value">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {planSteps.length > 0 && (
            <section className="pockie-evidence-card">
              <div className="pockie-evidence-title">
                Kế hoạch thao tác
                {typeof metadata?.uiPlan?.totalSteps === 'number' ? ` · ${metadata.uiPlan.totalSteps} bước` : ''}
              </div>
              <div className="pockie-plan-list">
                {planSteps.map((step, index) => (
                  <div key={step.id} className="pockie-plan-step">
                    <div className="pockie-plan-index">{index + 1}</div>
                    <div className="pockie-plan-copy">
                      <div className="pockie-plan-label">{step.label}</div>
                      <div className="pockie-plan-status">{step.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
