
const BLOCK_PREVIEW_TSX = `
'use client'
import { useState, useRef, useCallback } from 'react'
import type { CSSProperties, ReactNode } from 'react'

function pxFromSizeProp(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

interface FreeElement {
  id: string; type: string; label: string; value?: string
  color?: string; bg?: string; radius?: number; size?: number
  width?: string | number; height?: number; placeholder?: string; align?: string
  src?: string
  links?: unknown; href?: string; isExternal?: boolean
  x?: number; y?: number
}

function resolveDisplayImageUrl(src: string) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  const baseUrl = process.env.NEXT_PUBLIC_CMS_API_URL?.replace('/api/v2', '') || 'http://202.179.6.77:4000';
  return \`\${baseUrl}/uploads/\${src}\`;
}

function wrapLink(el: FreeElement, child: React.ReactNode) {
  if (!el.href) return <>{child}</>
  return (
    <a href={el.href} target={el.isExternal ? '_blank' : undefined} rel={el.isExternal ? 'noopener noreferrer' : undefined} style={{ textDecoration: 'none', display: 'contents' }}>
      {child}
    </a>
  )
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function SkeletonLine({ w = '100%', h = 14, color = '#1e293b', mb = 0 }: {
  w?: string | number; h?: number; color?: string; mb?: number
}) {
  return <div style={{ width: w, height: h, background: color, opacity: 0.15, borderRadius: 4, marginBottom: mb }} />
}

// ── Renders free elements as REAL HTML content for the live site ──────────────

export function renderFreeElement(el: FreeElement, accentColor: string, textColor: string) {
  switch (el.type) {
    case 'text':
      return wrapLink(el,
        <p style={{
          fontSize: el.size || 16,
          color: el.color || textColor,
          margin: '4px 0',
          lineHeight: 1.6,
        }}>
          {el.value || el.label || ''}
        </p>
      )

    case 'button':
      return wrapLink(el,
        <span style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: el.bg || accentColor,
          color: '#fff',
          borderRadius: el.radius ?? 10,
          fontWeight: 700,
          fontSize: el.size || 14,
          cursor: 'pointer',
          textDecoration: 'none',
          lineHeight: 1,
        }}>
          {el.label || el.value || 'Button'}
        </span>
      )

    case 'input':
      return (
        <input
          type="text"
          placeholder={el.placeholder || el.label || ''}
          style={{
            width: el.width || '100%',
            height: el.height || 46,
            padding: '0 14px',
            borderRadius: el.radius ?? 8,
            border: \`1px solid \${textColor}33\`,
            fontSize: el.size || 14,
            background: el.bg || '#fff',
            color: textColor,
            boxSizing: 'border-box',
          }}
        />
      )

    case 'image': {
      const displaySrc = el.src ? resolveDisplayImageUrl(el.src) : ''
      if (displaySrc) {
        return wrapLink(el,
          <img
            src={displaySrc}
            alt={el.label || ''}
            style={{
              width: el.width || '100%',
              maxWidth: '100%',
              height: el.height ? el.height : 'auto',
              maxHeight: el.height || 320,
              objectFit: 'cover',
              borderRadius: el.radius ?? 12,
              display: 'block',
            }}
          />
        )
      }
      return null
    }

    case 'card':
      return wrapLink(el,
        <div style={{
          width: el.width || '100%',
          minHeight: el.height || 120,
          background: el.bg || '#ffffff',
          borderRadius: el.radius ?? 12,
          border: \`1px solid \${textColor}15\`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: 24,
        }}>
          {el.value && <p style={{ color: textColor, opacity: 0.8, fontSize: 15 }}>{el.value}</p>}
        </div>
      )

    case 'section':
      return (
        <div style={{
          width: el.width || '100%',
          minHeight: el.height || 80,
          background: el.bg || 'transparent',
          borderRadius: 8,
        }}>
          {el.value && <p style={{ color: textColor, opacity: 0.8 }}>{el.value}</p>}
        </div>
      )

    case 'divider':
      return (
        <hr style={{
          width: el.width || '100%',
          height: el.height || 1,
          background: el.color || textColor,
          opacity: 0.15,
          border: 'none',
          borderRadius: 99,
          margin: '12px 0',
        }} />
      )

    case 'badge':
      return wrapLink(el,
        <span style={{
          display: 'inline-block',
          padding: '3px 12px',
          background: el.bg || accentColor,
          color: '#fff',
          borderRadius: el.radius ?? 999,
          fontSize: el.size || 12,
          fontWeight: 600,
          opacity: 0.9,
        }}>
          {el.label || el.value || ''}
        </span>
      )

    case 'menu': {
      const navLinks = Array.isArray(el.links) ? el.links : []
      if (navLinks.length === 0) return null
      return (
        <nav style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: (el.align as any) || 'center' }}>
          {navLinks.map((link: any, i: number) => (
            <a
              key={i}
              href={link.href || '#'}
              style={{
                fontSize: el.size || 14,
                fontWeight: 600,
                color: el.color || textColor,
                textDecoration: 'none',
                opacity: 0.88,
              }}
            >
              {link.label || link.href || 'Link'}
            </a>
          ))}
        </nav>
      )
    }

    default:
      return null
  }
}

function FreeElementsRenderer({ elements, accentColor, textColor }: {
  elements: FreeElement[]; accentColor: string; textColor: string
}) {
  if (!elements || elements.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'flex-start' }}>
      {elements.map((el) => {
        const rendered = renderFreeElement(el, accentColor, textColor)
        if (!rendered) return null
        const isAbsolute = el.x !== undefined || el.y !== undefined
        return (
          <div
            key={el.id}
            style={isAbsolute ? {
              position: 'absolute',
              left: el.x,
              top: el.y,
              zIndex: 10,
            } : {
              width: ['section', 'card', 'input', 'divider', 'menu'].includes(el.type) ? (el.width || '100%') : 'fit-content',
              maxWidth: '100%',
            }}
          >
            {rendered}
          </div>
        )
      })}
    </div>
  )
}

export function BlockPreview({ block }: { block: any }) {
  const { componentType: type, props: p = {} } = block
  const bg     = p.bgColor     || '#ffffff'
  const text   = p.textColor   || '#1e293b'
  const accent = p.accentColor || '#6366f1'
  const font   = p.fontFamily  || 'Inter'
  const px     = p.paddingX    ?? 48
  const py     = p.paddingY    ?? 60
  const animationClass = p.animation && p.animation !== 'none' ? \`animate-\${p.animation}\` : ''

  const elements: FreeElement[] = p._elements || []

  const wrapStyle: CSSProperties = {
    fontFamily: font, background: bg, color: text,
    paddingLeft: px, paddingRight: px, paddingTop: py, paddingBottom: py,
    transition: 'all 0.3s ease',
  }

  const freeEls = elements.length > 0
    ? <FreeElementsRenderer elements={elements} accentColor={accent} textColor={text} />
    : null


  if (type === 'header') {
    const navLinks = Array.isArray(p.links) ? p.links : []
    const titlePx = pxFromSizeProp(p.fontSize, 20)
    const navPx = pxFromSizeProp(p.navFontSize, 14)
    
    const jMap: Record<string, string> = {
      start: 'flex-start', center: 'center', end: 'flex-end',
      between: 'space-between', around: 'space-around', evenly: 'space-evenly',
    }
    const iMap: Record<string, string> = {
      start: 'flex-start', center: 'center', end: 'flex-end', baseline: 'baseline', stretch: 'stretch',
    }
    const rowJust = jMap[String(p.rowJustify || 'between')] || 'space-between'
    const rowIt = iMap[String(p.rowItems || 'center')] || 'center'
    const isStack = p.headerLayout === 'stack'
    const ctaSep = p.ctaWithNav === false
    const brStack = p.stackBrandAlign === 'end' ? 'flex-end' : p.stackBrandAlign === 'start' ? 'flex-start' : 'center'
    const navStack = jMap[String(p.stackNavJustify || 'center')] || 'center'
    const gap = typeof p.contentGap === 'number' && p.contentGap > 0 ? p.contentGap : 8
    
    const navEls = navLinks.length === 0 ? null : (
      <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {navLinks.map((link: { label?: string; href?: string }, i: number) => (
          <a
            key={i}
            href={link.href || '#'}
            style={{ fontSize: navPx, fontWeight: 600, color: text, opacity: 0.88, textDecoration: 'none' }}
          >
            {String(link.label || link.href || 'Link')}
          </a>
        ))}
      </nav>
    )

    const ctaBlock = p.ctaText
      ? <a href={p.ctaUrl || '#'} style={{ padding: '8px 20px', background: accent, borderRadius: p.btnRadius ?? 8, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>{p.ctaText}</a>
      : null
    const titleBlock = (p.title || p.brandName)
      ? <div style={{ fontWeight: 800, fontSize: titlePx, color: text, letterSpacing: '-0.02em' }}>{String(p.title || p.brandName)}</div>
      : null

    if (isStack) {
      return (
        <header className={animationClass} style={{ ...wrapStyle, paddingTop: p.paddingY ?? 18, paddingBottom: p.paddingY ?? 18, borderBottom: p.borderBottom ? \`1px solid \${p.borderColor || '#e2e8f0'}\` : 'none' }}>
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: Math.max(gap, 6) }}>
              {titleBlock && <div style={{ display: 'flex', justifyContent: brStack }}>{titleBlock}</div>}
              <div style={{ display: 'flex', justifyContent: navStack, alignItems: 'center', gap }}>
                {navEls}
                {!ctaSep && ctaBlock}
              </div>
              {ctaSep && <div style={{ display: 'flex', justifyContent: 'center' }}>{ctaBlock}</div>}
           </div>
           {freeEls}
        </header>
      )
    }

    return (
      <header className={animationClass} style={{ ...wrapStyle, paddingTop: p.paddingY ?? 18, paddingBottom: p.paddingY ?? 18, borderBottom: p.borderBottom ? \`1px solid \${p.borderColor || '#e2e8f0'}\` : 'none', display: 'flex', justifyContent: rowJust as any, alignItems: rowIt as any, gap }}>
        {titleBlock}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {navEls}
          {!ctaSep && ctaBlock}
        </div>
        {ctaSep && ctaBlock}
        {freeEls}
      </header>
    )
  }

  if (type === 'hero') {
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    const displayImg = p.imageUrl || (p.src ? resolveDisplayImageUrl(p.src) : '')

    return (
      <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: 'column', alignItems: flexAlign, textAlign: align as any, gap: 24 }}>
        {p.title ? (
          <h1 style={{ fontSize: p.titleSize || 48, fontWeight: p.titleWeight || '800', lineHeight: 1.1, margin: 0 }}>{p.title}</h1>
        ) : (
          <div style={{ width: '100%', maxWidth: 500 }}><SkeletonLine h={48} w="90%" color={text} mb={12} /><SkeletonLine h={48} w="60%" color={text} /></div>
        )}
        
        {p.subtitle ? (
          <p style={{ fontSize: p.subtitleSize || 18, opacity: 0.7, maxWidth: 600, margin: 0, lineHeight: 1.6 }}>{p.subtitle}</p>
        ) : (
          <div style={{ width: '100%', maxWidth: 400 }}><SkeletonLine w="100%" color={text} mb={8} /><SkeletonLine w="95%" color={text} mb={8} /><SkeletonLine w="40%" color={text} /></div>
        )}

        {(p.primaryBtnText || p.btnText) ? (
          <a href={p.primaryBtnUrl || '#'} style={{ display: 'inline-block', padding: \`\${p.btnPaddingY ?? 12}px \${p.btnPaddingX ?? 32}px\`, background: p.btnBg || accent, color: '#fff', borderRadius: p.btnRadius ?? 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            {p.primaryBtnText || p.btnText}
          </a>
        ) : (
          <div style={{ width: 140, height: 46, background: accent, borderRadius: p.btnRadius ?? 10, opacity: 0.2 }} />
        )}

        {displayImg && (
          <img src={displayImg} alt={p.title || ''} style={{ width: '100%', maxWidth: 520, borderRadius: 20, marginTop: 8, objectFit: 'cover' }} />
        )}
        {freeEls}
      </section>
    )
  }

  if (type === 'about') {
    const align = p.align || 'left'
    const isLeft = align === 'left'
    const displayImg = p.imageUrl || (p.src ? resolveDisplayImageUrl(p.src) : '')

    return (
      <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: isLeft ? 'row' : 'row-reverse', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
        {displayImg && <div style={{ flex: 1, minWidth: 280, maxWidth: 480 }}><img src={displayImg} alt={p.title || ''} style={{ width: '100%', borderRadius: 24, display: 'block' }} /></div>}
        <div style={{ flex: 1.2, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {p.title && <h2 style={{ fontSize: p.titleSize || 36, fontWeight: '700', margin: 0 }}>{p.title}</h2>}
          {(p.description || p.subtitle) && <p style={{ fontSize: 17, lineHeight: 1.7, opacity: 0.8, margin: 0 }}>{p.description || p.subtitle}</p>}
          {(p.btnText || p.primaryBtnText) && (
            <a href={p.btnUrl || p.primaryBtnUrl || '#'} style={{ display: 'inline-block', width: 'fit-content', padding: '10px 24px', border: \`2px solid \${accent}\`, color: accent, borderRadius: p.btnRadius ?? 10, fontWeight: 600, textDecoration: 'none' }}>
              {p.btnText || p.primaryBtnText}
            </a>
          )}
          {freeEls}
        </div>
      </section>
    )
  }

  if (['services', 'features', 'products', 'pricing', 'clients'].includes(type)) {
    const cols = p.columns || 3
    const cardBg = p.cardBg || (bg === '#ffffff' ? '#f8fafc' : \`\${bg}15\`)
    const items = Array.isArray(p.items) ? p.items : []
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

    return (
      <section className={animationClass} style={{ ...wrapStyle, textAlign: align as any, display: 'flex', flexDirection: 'column', alignItems: flexAlign }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700', marginBottom: p.subtitle ? 12 : 40, marginTop: 0 }}>{p.title}</h2>}
        {(p.subtitle || p.description) && (
          <p style={{ fontSize: 18, opacity: 0.7, maxWidth: 800, marginBottom: 40, marginTop: 0, marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0 }}>
            {p.subtitle || p.description}
          </p>
        )}
        
        {items.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: cols > 1 ? \`repeat(\${cols}, minmax(0, 1fr))\` : '1fr',
            gap: 24,
            width: '100%'
          }}>
            {items.map((item: any, i: number) => (
              <div key={i} style={{ background: cardBg, padding: 32, borderRadius: p.cardRadius ?? 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {item.imageUrl && <img src={item.imageUrl} alt={item.title || ''} style={{ width: '100%', height: 180, borderRadius: 12, objectFit: 'cover', marginBottom: 8 }} />}
                {item.title ? (
                   <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{item.title}</h3>
                ) : (
                   <SkeletonLine w="70%" h={20} color={text} />
                )}
                {item.description ? (
                   <p style={{ opacity: 0.7, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{item.description}</p>
                ) : (
                   <div style={{ width: '100%' }}><SkeletonLine w="100%" color={text} mb={6} /><SkeletonLine w="40%" color={text} /></div>
                )}
                {item.price && <div style={{ fontSize: 22, fontWeight: 800, color: accent, marginTop: 'auto' }}>{item.price}</div>}
                {item.btnText && (
                   <a href={item.btnUrl || '#'} style={{ display: 'inline-block', padding: '10px 20px', background: accent, color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                     {item.btnText}
                   </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${cols}, minmax(0, 1fr))\`, gap: 24, width: '100%' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: cardBg, padding: 32, borderRadius: p.cardRadius ?? 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: '100%', height: 140, background: text, opacity: 0.05, borderRadius: 12 }} />
                <SkeletonLine w="60%" h={20} color={text} />
                <div style={{ width: '100%' }}><SkeletonLine w="100%" color={text} mb={6} /><SkeletonLine w="80%" color={text} /></div>
              </div>
            ))}
          </div>
        )}
        {freeEls}
      </section>
    )
  }

  if (type === 'slider') {
    const items = Array.isArray(p.items) ? p.items : []
    return (
      <section className={animationClass} style={{ ...wrapStyle, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden', height: 600 }}>
        {items.length > 0 ? (
           <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img 
                src={items[0].imageUrl} 
                alt={items[0].title || ''} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40, color: '#fff' }}>
                 <h2 style={{ fontSize: 48, fontWeight: 800, margin: 0, maxWidth: 800 }}>{items[0].title}</h2>
                 <p style={{ fontSize: 20, opacity: 0.9, maxWidth: 600, marginTop: 16 }}>{items[0].description}</p>
                 <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                   <div style={{ width: 12, height: 12, borderRadius: 99, background: '#fff' }} />
                   <div style={{ width: 12, height: 12, borderRadius: 99, background: '#fff', opacity: 0.3 }} />
                   <div style={{ width: 12, height: 12, borderRadius: 99, background: '#fff', opacity: 0.3 }} />
                 </div>
              </div>
           </div>
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SkeletonLine w={300} h={40} color={text} />
          </div>
        )}
        {freeEls}
      </section>
    )
  }

  if (type === 'promo') {
    const align = p.align || 'center'
    const flexAlign = (align === 'left') ? 'flex-start' : (align === 'right') ? 'flex-end' : 'center'
    return (
      <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: 'column', alignItems: flexAlign, textAlign: align as any, gap: 20 }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 36, fontWeight: '800', margin: 0 }}>{p.title}</h2>}
        {(p.subtitle || p.description) && <p style={{ fontSize: 18, opacity: 0.8, maxWidth: 600, margin: 0, lineHeight: 1.6 }}>{p.subtitle || p.description}</p>}
        {(p.btnText || p.primaryBtnText) && (
          <a href={p.btnUrl || p.primaryBtnUrl || '#'} style={{ display: 'inline-block', padding: '14px 36px', background: p.btnBg || accent, color: '#fff', borderRadius: p.btnRadius ?? 12, fontWeight: 700, textDecoration: 'none', fontSize: 16, marginTop: 8 }}>
            {p.btnText || p.primaryBtnText}
          </a>
        )}
        {freeEls}
      </section>
    )
  }

  if (type === 'contact') {
    return (
      <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        {p.title ? (
          <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700', margin: 0 }}>{p.title}</h2>
        ) : (
          <SkeletonLine w={200} h={34} color={text} />
        )}
        {(p.subtitle || p.description) ? (
          <p style={{ opacity: 0.7, maxWidth: 600, textAlign: 'center', margin: 0 }}>{p.subtitle || p.description}</p>
        ) : (
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}><SkeletonLine w="100%" color={text} mb={6} /><SkeletonLine w="60%" color={text} /></div>
        )}
        {p.showForm !== false && (
          <div style={{ width: '100%', maxWidth: 600, background: p.cardBg || '#f8fafc', padding: 40, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
             <input type="text" placeholder="Нэр" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
             <input type="email" placeholder="И-мэйл" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
             <textarea placeholder="Мессеж" rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15, resize: 'none', boxSizing: 'border-box' }} />
             <button style={{ width: '100%', padding: '14px', background: accent, color: '#fff', borderRadius: 10, fontWeight: 700, border: 'none', fontSize: 15, cursor: 'pointer' }}>
                Илгээх
             </button>
          </div>
        )}
        {freeEls}
      </section>
    )
  }

  if (type === 'footer') {
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    return (
      <footer className={animationClass} style={{ ...wrapStyle, borderTop: \`1px solid \${text}15\`, textAlign: align as any, display: 'flex', flexDirection: 'column', alignItems: flexAlign, gap: 20 }}>
        {(p.brandName || p.title) ? (
          <div style={{ fontWeight: 800, fontSize: 24 }}>{p.brandName || p.title}</div>
        ) : (
          <SkeletonLine w={120} h={24} color={text} />
        )}
        {(p.description || p.subtitle) && <p style={{ opacity: 0.6, maxWidth: 600, margin: 0, lineHeight: 1.6 }}>{p.description || p.subtitle}</p>}
        <div style={{ fontSize: 14, opacity: 0.5, marginTop: 8 }}>
          {p.copyright ? (
            \`© \${new Date().getFullYear()} \${p.copyright}\`
          ) : (
            <SkeletonLine w={180} h={14} color={text} />
          )}
        </div>
        {freeEls}
      </footer>
    )
  }

  return (
    <div className={animationClass} style={wrapStyle}>
      {p.title && <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, marginTop: 0 }}>{p.title}</h2>}
      {p.subtitle && <p style={{ opacity: 0.7, lineHeight: 1.6, margin: 0 }}>{p.subtitle}</p>}
      {freeEls}
    </div>
  )
}
`;

module.exports = { BLOCK_PREVIEW_TSX };
