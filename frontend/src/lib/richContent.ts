export const isRichHtml = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content);

export const stripHtml = (content: string) => {
  if (!isRichHtml(content) || typeof document === 'undefined') return content;
  const template = document.createElement('template');
  template.innerHTML = content;
  return template.content.textContent?.replace(/\s+/g, ' ').trim() || '';
};

export const sanitizeRichHtml = (content: string) => {
  if (!isRichHtml(content) || typeof document === 'undefined') return content;

  const template = document.createElement('template');
  template.innerHTML = content;

  template.content.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());

  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === 'A') {
      element.setAttribute('rel', 'noreferrer noopener');
      element.setAttribute('target', '_blank');
    }
  });

  return template.innerHTML;
};

export const addImageCaptions = (content: string) => {
  const sanitized = sanitizeRichHtml(content);
  if (!isRichHtml(sanitized) || typeof document === 'undefined') return sanitized;

  const template = document.createElement('template');
  template.innerHTML = sanitized;

  template.content.querySelectorAll<HTMLImageElement>('img[title]').forEach((image) => {
    const caption = image.getAttribute('title')?.trim();
    if (!caption || image.parentElement?.tagName === 'FIGURE') return;

    const figure = document.createElement('figure');
    const figcaption = document.createElement('figcaption');
    figcaption.textContent = caption;
    image.replaceWith(figure);
    figure.append(image);
    figure.append(figcaption);
  });

  return template.innerHTML;
};
