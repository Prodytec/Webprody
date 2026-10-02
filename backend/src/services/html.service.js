const sanitizeHtml = require('sanitize-html');

// Contenido de los artículos: se acepta solo el HTML que genera el editor del admin.
// Imágenes, videos y audios deben ser archivos propios (/uploads/...); los iframes, solo YouTube y Vimeo.
const STYLES = {
  color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s,.%]+\)$/i],
  'font-family': [/^[\w\s,'"-]+$/],
  'font-size': [/^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|[\d.]+(px|em|rem|%))$/],
  'text-align': [/^(left|right|center|justify)$/],
};

const OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'audio', 'iframe', 'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
    video: ['src', 'controls', 'preload'],
    audio: ['src', 'controls', 'preload'],
    iframe: ['src', 'allowfullscreen'],
    '*': ['style'],
  },
  allowedStyles: { '*': STYLES },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: 'noopener noreferrer', ...(/^https?:/i.test(attribs.href || '') ? { target: '_blank' } : {}) },
    }),
    video: (tagName, attribs) => ({ tagName, attribs: { ...attribs, controls: 'controls', preload: 'metadata' } }),
    audio: (tagName, attribs) => ({ tagName, attribs: { ...attribs, controls: 'controls', preload: 'metadata' } }),
  },
  exclusiveFilter: (frame) =>
    (['img', 'video', 'audio'].includes(frame.tag) && !/^\/uploads\/[\w.-]+$/.test(frame.attribs.src || '')) ||
    (frame.tag === 'iframe' && !frame.attribs.src),
};

const sanitizeBody = (html) => sanitizeHtml(String(html || ''), OPTIONS);

const hasContent = (html) =>
  /<(img|video|audio|iframe)\b/i.test(html) || sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim() !== '';

// Archivos propios referenciados dentro de un cuerpo.
const uploadRefs = (html) => [...new Set(String(html || '').match(/\/uploads\/[\w.-]+/g) || [])];

module.exports = { sanitizeBody, hasContent, uploadRefs };
