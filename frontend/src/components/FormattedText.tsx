import React, { useMemo } from 'react';

interface FormattedTextProps {
  content?: string | null;
  className?: string;
  inline?: boolean;
}

/**
 * Normalizes HTML string from iCal feeds:
 * - Fixes line folding tag spaces (e.g. "</ b>" -> "</b>", "<b >" -> "<b>", "</ ol>" -> "</ol>")
 * - Replaces non-breaking spaces with normal spaces
 */
export function normalizeFoldedTags(html: string): string {
  if (!html) return '';
  return html
    // Fix closing tags with whitespace inside: </ b> -> </b>
    .replace(/<\s*\/\s*([a-zA-Z0-9]+)\s*>/gi, '</$1>')
    // Fix opening tags with whitespace inside: <b > -> <b>
    .replace(/<\s*([a-zA-Z0-9]+)\s*>/gi, '<$1>')
    // Fix opening tags with attributes and extra whitespace
    .replace(/<\s*([a-zA-Z0-9]+)(\s+[^>]+)>/gi, '<$1$2>')
    // Fix non-breaking space entity
    .replace(/&nbsp;/gi, ' ');
}

/**
 * Recursively converts a sanitized DOM Node into React elements.
 * Supports: b, strong, i, em, u, s, del, strike, ol, ul, li, p, div, br, a, span.
 */
function domNodeToReact(node: Node, key: string, inline: boolean): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as HTMLElement;
  const tagName = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map((child, idx) =>
    domNodeToReact(child, `${key}-${idx}`, inline)
  );

  if (inline) {
    // In inline mode, block containers and list elements render as inline spans
    switch (tagName) {
      case 'b':
      case 'strong':
        return <strong key={key} className="font-bold">{children}</strong>;
      case 'i':
      case 'em':
        return <em key={key} className="italic">{children}</em>;
      case 'u':
        return <u key={key} className="underline underline-offset-2 decoration-current">{children}</u>;
      case 's':
      case 'del':
      case 'strike':
        return <s key={key} className="line-through opacity-80">{children}</s>;
      case 'br':
        return <span key={key}> </span>;
      case 'li':
        return <span key={key} className="inline-block mr-2">• {children}</span>;
      case 'ol':
      case 'ul':
      case 'p':
      case 'div':
      case 'span':
        return <span key={key}>{children}</span>;
      case 'a': {
        const href = el.getAttribute('href') || '';
        const isSafe = /^https?:\/\//i.test(href);
        if (!isSafe) return <span key={key}>{children}</span>;
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 dark:text-emerald-400 underline font-medium"
          >
            {children}
          </a>
        );
      }
      default:
        return <React.Fragment key={key}>{children}</React.Fragment>;
    }
  }

  // Full block mode
  switch (tagName) {
    case 'b':
    case 'strong':
      return <strong key={key} className="font-bold text-stone-950 dark:text-stone-50">{children}</strong>;
    case 'i':
    case 'em':
      return <em key={key} className="italic">{children}</em>;
    case 'u':
      return <u key={key} className="underline underline-offset-2 decoration-current">{children}</u>;
    case 's':
    case 'del':
    case 'strike':
      return <s key={key} className="line-through opacity-80">{children}</s>;
    case 'ol':
      return (
        <ol key={key} className="list-decimal list-outside ml-5 sm:ml-6 my-1.5 space-y-0.5 text-stone-800 dark:text-stone-200">
          {children}
        </ol>
      );
    case 'ul':
      return (
        <ul key={key} className="list-disc list-outside ml-5 sm:ml-6 my-1.5 space-y-0.5 text-stone-800 dark:text-stone-200">
          {children}
        </ul>
      );
    case 'li':
      return <li key={key} className="leading-snug pl-0.5">{children}</li>;
    case 'p':
      return <p key={key} className="my-1 leading-relaxed">{children}</p>;
    case 'div':
      return <div key={key} className="my-0.5 leading-relaxed">{children}</div>;
    case 'br':
      return <br key={key} />;
    case 'a': {
      const href = el.getAttribute('href') || '';
      const isSafe = /^https?:\/\//i.test(href);
      if (!isSafe) return <span key={key}>{children}</span>;
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors font-medium break-all"
        >
          {children}
        </a>
      );
    }
    case 'span':
      return <span key={key}>{children}</span>;
    default:
      return <React.Fragment key={key}>{children}</React.Fragment>;
  }
}

/**
 * FormattedText: Safely renders rich text formatting from Google Calendar iCal feeds and user notes.
 * Supports:
 * - Bold (<b>, <strong>, *bold*)
 * - Italic (<i>, <em>, _italic_)
 * - Underline (<u>)
 * - Strikethrough (<s>, <del>, ~strike~)
 * - Lists (<ol><li>, <ul><li>) with proper Tailwind numbers and bullets
 * - Nested tags (<b><i><u>...</u></i></b>)
 * - Line breaks (<br>, newlines)
 * - External safe links (<a>)
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  content,
  className = '',
  inline = false
}) => {
  const elements = useMemo(() => {
    if (!content || typeof content !== 'string') return null;

    let normalized = normalizeFoldedTags(content);

    // If string has newlines but no <br> or block tags, convert newlines to <br />
    const hasHtmlBlockTags = /<(?:br|p|div|ol|ul|li)\b/i.test(normalized);
    if (!hasHtmlBlockTags && /\n/.test(normalized)) {
      normalized = normalized.replace(/\r?\n/g, '<br />');
    }

    // Markdown conversion for common formatting if entered in plain text
    normalized = normalized
      .replace(/(^|[^\w*])\*\*([^*\n\r]+?)\*\*([^\w*]|$)/g, '$1<strong>$2</strong>$3')
      .replace(/(^|[^\w*])\*([^*\n\r]+?)\*([^\w*]|$)/g, '$1<strong>$2</strong>$3')
      .replace(/(^|[^\w_])_([^_\n\r]+?)_([^\w_]|$)/g, '$1<em>$2</em>$3')
      .replace(/(^|[^\w~])~([^~\n\r]+?)~([^\w~]|$)/g, '$1<s>$2</s>$3');

    try {
      if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(normalized, 'text/html');
        const bodyNodes = Array.from(doc.body.childNodes);
        return bodyNodes.map((node, i) => domNodeToReact(node, `fmt-${i}`, inline));
      }
    } catch {
      // Fallback: plain text
    }

    return content;
  }, [content, inline]);

  if (!content) return null;

  if (inline) {
    return <span className={className}>{elements}</span>;
  }

  return <div className={className}>{elements}</div>;
};
