import { describe, it, expect } from 'vitest';
import { renderChatMarkdown } from '../renderChatMarkdown';

describe('renderChatMarkdown', () => {
  it('renders a markdown link as a button-styled anchor', () => {
    const out = renderChatMarkdown('[Terminar en la web](https://alquilatucarro.com/armenia/x)');
    expect(out).toBe(
      '<a href="https://alquilatucarro.com/armenia/x" target="_blank" ' +
        'rel="noopener noreferrer" class="cc-link-btn">Terminar en la web</a>',
    );
  });

  it('linkifies wa.me and preserves surrounding text + line breaks', () => {
    const out = renderChatMarkdown(
      'Lo siento.\n[Escribir a un asesor](https://wa.me/573016729250?text=hola)',
    );
    expect(out).toContain('Lo siento.<br>');
    expect(out).toContain('href="https://wa.me/573016729250?text=hola"');
    expect(out).toContain('>Escribir a un asesor</a>');
  });

  it('escapes HTML in plain text so markup cannot be injected', () => {
    expect(renderChatMarkdown('hola <b>x</b> & "y"')).toBe(
      'hola &lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;',
    );
  });

  it('does NOT linkify non-http/tel schemes — left as escaped text', () => {
    const out = renderChatMarkdown('[x](javascript:alert(1))');
    expect(out).not.toContain('<a ');
    expect(out).toContain('[x](javascript:alert(1))');
  });

  it('escapes the label so a link cannot smuggle markup', () => {
    const out = renderChatMarkdown('[<img src=x>](https://a.co)');
    expect(out).toContain('class="cc-link-btn">&lt;img src=x&gt;</a>');
  });

  it('renders **bold** as <strong>', () => {
    expect(renderChatMarkdown('Total a pagar: **$1.103.873 COP**')).toBe(
      'Total a pagar: <strong>$1.103.873 COP</strong>',
    );
    expect(renderChatMarkdown('Número de solicitud: **AVO2Y3949OP**')).toBe(
      'Número de solicitud: <strong>AVO2Y3949OP</strong>',
    );
  });

  it('renders bold and a link together, still escaping the rest', () => {
    const out = renderChatMarkdown(
      '**Listo** <ok>\n[Web](https://a.co)',
    );
    expect(out).toContain('<strong>Listo</strong>');
    expect(out).toContain('&lt;ok&gt;');
    expect(out).toContain('<br>');
    expect(out).toContain('class="cc-link-btn">Web</a>');
  });

  it('keeps bold safe — inner markup stays escaped', () => {
    expect(renderChatMarkdown('**<b>x</b>**')).toBe(
      '<strong>&lt;b&gt;x&lt;/b&gt;</strong>',
    );
  });
});
