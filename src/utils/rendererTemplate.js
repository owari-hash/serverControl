
const BLOCK_PREVIEW_TSX = `
'use client'
import { useState, useRef, useCallback, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Image as ImageIcon, Package, Copy, Trash2, MoveVertical, ArrowUp, ArrowDown, Move } from 'lucide-react'

function pxFromSizeProp(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function SkeletonLine({ w = '100%', h = 14, color = '#1e293b', mb = 0 }: {
  w?: string | number; h?: number; color?: string; mb?: number
}) {
  return <div style={{ width: w, height: h, background: color, opacity: 0.2, borderRadius: 4, marginBottom: mb }} />
}

// ─── Free elements renderer ───────────────────────────────────────────────────

interface FreeElement {
  id: string; type: string; label: string; value?: string
  color?: string; bg?: string; radius?: number; size?: number
  width?: string; height?: number; placeholder?: string; align?: string
  src?: string
  links?: unknown; href?: string; isExternal?: boolean
  x?: number; y?: number
}

function wrapLink(el: FreeElement, child: React.ReactNode) {
  if (!el.href) return child
  return (
    <a href={el.href} target={el.isExternal ? '_blank' : undefined} rel={el.isExternal ? 'noopener noreferrer' : undefined} style={{ textDecoration: 'none' }}>
      {child}
    </a>
  )
}

function resolveDisplayImageUrl(src: string) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  const baseUrl = process.env.NEXT_PUBLIC_CMS_API_URL?.replace('/api/v2', '') || 'http://202.179.6.77:4000';
  return \`\${baseUrl}/uploads/\${src}\`;
}

export function renderFreeElement(el: FreeElement, accentColor: string, textColor: string) {
  switch (el.type) {
    case 'text':
      const textH = el.height || (el.size ? el.size * 0.7 : 14)
      return wrapLink(el, 
        <div style={{
          width: el.width || '80%',
          height: textH,
          background: el.color || textColor,
          opacity: 0.2,
          borderRadius: 4,
          margin: '4px 0'
        }} />
      )

    case 'button':
      return wrapLink(el,
        <div style={{
          width: el.width || 140,
          height: el.height || 46,
          background: el.bg || accentColor,
          borderRadius: el.radius ?? 10,
          opacity: 0.9,
          display: 'inline-block'
        }} />
      )

    case 'input':
      return (
        <div style={{
          width: el.width || 200,
          height: el.height || 46,
          background: el.bg || textColor,
          opacity: 0.08,
          borderRadius: el.radius ?? 8,
          border: \`1px solid \${textColor}22\`,
          display: 'inline-block'
        }} />
      )

    case 'image': {
      const displaySrc = el.src ? resolveDisplayImageUrl(el.src) : ''
      if (displaySrc) {
        return wrapLink(el,
          <img
            src={displaySrc}
            alt={el.label || ''}
            referrerPolicy="no-referrer"
            style={{
              width: (el.width as string | number | undefined) || '100%',
              maxHeight: el.height || 160,
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 12,
              display: 'block',
            }}
          />,
        )
      }
      return wrapLink(el,
        <div style={{
          width: el.width || '100%',
          height: el.height || 160,
          background: textColor,
          opacity: 0.06,
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ImageIcon style={{ width: 36, height: 36, opacity: 0.25, color: textColor }} />
        </div>
      )
    }

    case 'card':
      return wrapLink(el,
        <div style={{
          width: el.width || '100%',
          height: el.height || 120,
          background: el.bg || '#ffffff',
          borderRadius: el.radius ?? 12,
          border: \`1px solid \${textColor}15\`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.8,
        }}>
          <div style={{ width: '40%', height: 12, background: textColor, opacity: 0.15, borderRadius: 4 }} />
        </div>
      )

    case 'section':
      return (
        <div style={{
          width: el.width || '100%',
          height: el.height || 80,
          background: el.bg || textColor,
          opacity: 0.03,
          borderRadius: 8,
          border: \`1px dashed \${textColor}33\`,
        }} />
      )

    case 'divider':
      return (
        <div style={{
          width: el.width || '100%',
          height: el.height || 1,
          background: el.color || textColor,
          opacity: 0.15,
          borderRadius: 99,
          margin: '12px 0',
        }} />
      )

    case 'badge':
      return wrapLink(el,
        <div style={{ display: 'flex' }}>
          <div style={{
            width: el.width || 60,
            height: 20,
            background: el.bg || accentColor,
            borderRadius: el.radius ?? 999,
            opacity: 0.8,
            display: 'inline-block',
          }} />
        </div>
      )

    case 'menu':
      const navLinks = Array.isArray(el.links) ? el.links : []
      if (navLinks.length === 0) {
        return <span style={{ fontSize: 11, color: textColor, opacity: 0.35, fontStyle: 'italic' }}>Цэс хоосон</span>
      }
      return (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: el.align as any || 'center' }}>
          {navLinks.map((link: any, i: number) => (
            <div
              key={i}
              style={{
                width: 48,
                height: el.size ? el.size * 0.7 : 12,
                background: el.color || textColor,
                opacity: 0.2,
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      )

    default:
      return null
  }
}

function FreeElementsRenderer({ elements, accentColor, textColor }: {
  elements: FreeElement[]; accentColor: string; textColor: string
}) {
  if (!elements || elements.length === 0) return null

  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', position: 'relative' }}>
      {elements.map((el) => (
        <div
          key={el.id}
          style={{
            position: (el.x !== undefined || el.y !== undefined) ? 'absolute' : 'relative',
            left: el.x,
            top: el.y,
            zIndex: (el.x !== undefined || el.y !== undefined) ? 10 : 1,
            width: el.width || (el.type === 'button' ? '140px' : el.type === 'input' ? '200px' : el.type === 'badge' ? '60px' : el.type === 'text' ? '80%' : undefined),
          }}
        >
          {renderFreeElement(el, accentColor, textColor)}
        </div>
      ))}
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

  const freeEls = <FreeElementsRenderer elements={elements} accentColor={accent} textColor={text} />


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
    const brStack =
      p.stackBrandAlign === 'end' ? 'flex-end' : p.stackBrandAlign === 'start' ? 'flex-start' : 'center'
    const navStack = jMap[String(p.stackNavJustify || 'center')] || 'center'
    const gap = typeof p.contentGap === 'number' && p.contentGap > 0 ? p.contentGap : 8
    
    const navEls = navLinks.length === 0 ? null : (
      <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {navLinks.map((link: { label?: string; href?: string }, i: number) => (
          <a
            key={i}
            href={link.href || '#'}
            style={{
              fontSize: navPx,
              fontWeight: 600,
              color: text,
              opacity: 0.88,
              textDecoration: 'none'
            }}
          >
            {String(link.label || link.href || 'Link')}
          </a>
        ))}
      </nav>
    )

    const ctaBlock = p.ctaText ? <a href={p.ctaUrl || '#'} style={{ padding: '8px 20px', background: accent, borderRadius: p.btnRadius ?? 8, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{p.ctaText}</a> : null
    const titleBlock = (p.title || p.brandName) ? (
      <div style={{ fontWeight: 800, fontSize: titlePx, color: text, letterSpacing: '-0.02em' }}>
        {String(p.title || p.brandName)}
      </div>
    ) : null

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
           {elements.length > 0 && freeEls}
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
        {elements.length > 0 && freeEls}
      </header>
    )
  }

  if (type === 'hero') {
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    const displayImg = p.imageUrl || (p.src ? resolveDisplayImageUrl(p.src) : '')

    return (
      <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: 'column', alignItems: flexAlign, textAlign: align as any, gap: 24 }}>
        {p.title && <h1 style={{ fontSize: p.titleSize || 48, fontWeight: p.titleWeight || '800', lineHeight: 1.1 }}>{p.title}</h1>}
        {p.subtitle && <p style={{ fontSize: p.subtitleSize || 18, opacity: 0.7, maxWidth: 600 }}>{p.subtitle}</p>}
        {(p.primaryBtnText || p.btnText) && (
          <a href={p.primaryBtnUrl || '#'} style={{ padding: '12px 32px', background: p.btnBg || accent, color: '#fff', borderRadius: p.btnRadius ?? 10, fontWeight: 700, textDecoration: 'none' }}>
            {p.primaryBtnText || p.btnText}
          </a>
        )}
        {displayImg && <img src={displayImg} style={{ width: '100%', maxWidth: 800, borderRadius: 20, marginTop: 20 }} />}
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
        {displayImg && <div style={{ flex: 1, minWidth: 300 }}><img src={displayImg} style={{ width: '100%', borderRadius: 24 }} /></div>}
        <div style={{ flex: 1.2, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {p.title && <h2 style={{ fontSize: p.titleSize || 36, fontWeight: '700' }}>{p.title}</h2>}
          {p.description && <p style={{ fontSize: 17, lineHeight: 1.7, opacity: 0.8 }}>{p.description}</p>}
          {p.btnText && <a href={p.btnUrl || '#'} style={{ display: 'inline-block', width: 'fit-content', padding: '10px 24px', border: \`2px solid \${accent}\`, color: accent, borderRadius: 10, fontWeight: 600, textDecoration: 'none' }}>{p.btnText}</a>}
        </div>
        {freeEls}
      </section>
    )
  }

  if (['services', 'features', 'products', 'pricing', 'clients'].includes(type)) {
    const cols = p.columns || 3
    const cardBg = p.cardBg || (bg === '#ffffff' ? '#f8fafc' : \`\${bg}15\`)
    const items = Array.isArray(p.items) ? p.items : []

    return (
      <section className={animationClass} style={{ ...wrapStyle, textAlign: 'center' }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700', marginBottom: 40 }}>{p.title}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: \`repeat(auto-fit, minmax(280px, 1fr))\`, gap: 24 }}>
          {items.map((item: any, i: number) => (
            <div key={i} style={{ background: cardBg, padding: 32, borderRadius: p.cardRadius ?? 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {item.imageUrl && <img src={item.imageUrl} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />}
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>{item.title}</h3>
              <p style={{ opacity: 0.7, fontSize: 15, lineHeight: 1.6 }}>{item.description}</p>
              {item.price && <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{item.price}</div>}
            </div>
          ))}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'contact') {
    return (
      <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700' }}>{p.title}</h2>}
        <div style={{ width: '100%', maxWidth: 600, background: p.cardBg || '#f8fafc', padding: 40, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
           <input type="text" placeholder="Name" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd' }} />
           <input type="email" placeholder="Email" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd' }} />
           <textarea placeholder="Message" rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd' }} />
           <button style={{ width: '100%', padding: '14px', background: accent, color: '#fff', borderRadius: 10, fontWeight: 700, border: 'none' }}>Send Message</button>
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'footer') {
    return (
      <footer className={animationClass} style={{ ...wrapStyle, borderTop: \`1px solid \${text}15\`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {p.brandName && <div style={{ fontWeight: 800, fontSize: 24 }}>{p.brandName}</div>}
        {p.description && <p style={{ opacity: 0.6, maxWidth: 600, margin: '0 auto' }}>{p.description}</p>}
        <div style={{ fontSize: 14, opacity: 0.5, marginTop: 20 }}>© {new Date().getFullYear()} {p.copyright || 'All rights reserved.'}</div>
        {freeEls}
      </footer>
    )
  }

  return (
    <div className={animationClass} style={wrapStyle}>
      {p.title && <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{p.title}</h2>}
      {p.subtitle && <p style={{ opacity: 0.7, lineHeight: 1.6 }}>{p.subtitle}</p>}
      {freeEls}
    </div>
  )
}
`;

module.exports = { BLOCK_PREVIEW_TSX };
