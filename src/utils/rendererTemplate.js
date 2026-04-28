
const BLOCK_PREVIEW_TSX = `
'use client'
import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { Image as ImageIcon, Package } from 'lucide-react'

function pxFromSizeProp(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

interface FreeEl { id: string; type: string; label: string; value?: string; color?: string; bg?: string; radius?: number; size?: number; width?: string; height?: number; placeholder?: string; align?: string; src?: string; href?: string; isExternal?: boolean }

function renderFreeElement(el: FreeEl, accentColor: string, textColor: string) {
  const wrapLink = (child: ReactNode) => {
    if (!el.href) return child
    return <a href={el.href} target={el.isExternal ? '_blank' : undefined} rel={el.isExternal ? 'noopener noreferrer' : undefined} className="no-underline">{child}</a>
  }

  switch (el.type) {
    case 'text':
      return wrapLink(<div style={{ color: el.color || textColor, fontSize: el.size || 16, textAlign: (el.align as any) || 'left', opacity: 0.85 }}>{el.value || el.label}</div>)
    case 'button':
      return wrapLink(<div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: el.bg || accentColor, color: el.color || '#fff', borderRadius: el.radius ?? 10, fontSize: el.size || 14, fontWeight: 600, padding: '10px 24px' }}>{el.value || el.label}</div>)
    case 'image':
      return wrapLink(el.src || el.value ? <img src={el.src || el.value} alt={el.label} style={{ width: el.width || '100%', height: 'auto', borderRadius: 12 }} /> : <div style={{ width: el.width || '100%', height: 160, background: textColor, opacity: 0.06, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon className="w-9 h-9 opacity-20" /></div>)
    case 'card':
      return <div style={{ background: el.bg || '#fff', borderRadius: el.radius ?? 12, border: \`1px solid \${textColor}15\`, padding: 16, opacity: 0.9 }}>{el.value || el.label}</div>
    default: return null
  }
}

function FreeEls({ elements, accent, text }: { elements: FreeEl[]; accent: string; text: string }) {
  if (!elements?.length) return null
  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {elements.map(el => (
        <div key={el.id} style={{ position: 'relative' }}>
          {renderFreeElement(el, accent, text)}
        </div>
      ))}
    </div>
  )
}

export function BlockPreview({ block }: { block: any }) {
  const p: any = block.props || {}
  const type = block.componentType
  const bg = p.bgColor || '#ffffff'
  const text = p.textColor || '#1e293b'
  const accent = p.accentColor || '#6366f1'
  const font = p.fontFamily || 'Inter'
  const px = p.paddingX ?? 48
  const py = p.paddingY ?? 60
  const elements: FreeEl[] = p._elements || []

  const animationClass = p.animation && p.animation !== 'none' ? \`animate-\${p.animation}\` : ''
  const wrap: CSSProperties = { 
    fontFamily: font, background: bg, color: text, 
    paddingLeft: px, paddingRight: px, paddingTop: py, paddingBottom: py, 
    position: 'relative'
  }
  const freeEls = <FreeEls elements={elements} accent={accent} text={text} />

  if (type === 'header') {
    const navLinks = Array.isArray(p.links) ? p.links : []
    const titlePx = pxFromSizeProp(p.fontSize, 24)
    const navPx = pxFromSizeProp(p.navFontSize, 15)
    const headerWrap: CSSProperties = { ...wrap, paddingTop: p.paddingY ?? 20, paddingBottom: p.paddingY ?? 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: p.borderBottom ? \`1px solid \${text}15\` : 'none' }
    const navEls = navLinks.map((link: any, i: number) => (
      <a key={i} href={link.href} style={{ fontSize: navPx, fontWeight: 600, opacity: 0.8, color: 'inherit', textDecoration: 'none', transition: 'opacity 0.2s' }}>
        {link.label || link.href}
      </a>
    ))
    const titleBlock = <div style={{ fontWeight: 900, fontSize: titlePx, letterSpacing: '-0.03em' }}>{p.title || p.brandName || ''}</div>
    const ctaBlock = p.ctaText ? <a href={p.ctaUrl} style={{ padding: '10px 24px', background: accent, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: \`0 4px 12px \${accent}40\` }}>{p.ctaText}</a> : null
    
    return (
      <header style={headerWrap} className={animationClass}>
        {titleBlock}
        <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {navEls}
          {ctaBlock}
        </nav>
      </header>
    )
  }

  if (type === 'hero') {
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    const isCenter = align === 'center'
    
    const mediaEl = p.imageUrl ? (
      <div style={{ marginTop: 48, width: '100%', display: 'flex', justifyContent: flexAlign }}>
        <img src={p.imageUrl} style={{ maxWidth: '90%', borderRadius: 32, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)' }} />
      </div>
    ) : null

    const titleEl = p.title ? (
      <h1 style={{ 
        fontSize: p.titleSize || 64, 
        fontWeight: 900, 
        lineHeight: 1.05, 
        marginBottom: 28, 
        letterSpacing: '-0.04em',
        maxWidth: 900,
        marginLeft: isCenter ? 'auto' : 0,
        marginRight: isCenter ? 'auto' : 0
      }}>
        {p.title}
      </h1>
    ) : null

    const subtitleEl = p.subtitle ? (
      <p style={{ 
        fontSize: 20, 
        opacity: 0.7, 
        marginBottom: 44, 
        maxWidth: 640, 
        lineHeight: 1.6,
        marginLeft: isCenter ? 'auto' : 0,
        marginRight: isCenter ? 'auto' : 0
      }}>
        {p.subtitle}
      </p>
    ) : null

    const ctaEl = (p.primaryBtnText || p.secondaryBtnText) ? (
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: flexAlign }}>
        {p.primaryBtnText && <a href={p.primaryBtnUrl} style={{ background: accent, color: '#fff', padding: '18px 42px', borderRadius: 16, fontWeight: 700, textDecoration: 'none', boxShadow: \`0 12px 24px \${accent}40\`, transition: 'transform 0.2s' }}>{p.primaryBtnText}</a>}
        {p.secondaryBtnText && <a href={p.secondaryBtnUrl} style={{ border: \`2px solid \${text}30\`, color: 'inherit', padding: '18px 42px', borderRadius: 16, fontWeight: 700, textDecoration: 'none', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>{p.secondaryBtnText}</a>}
      </div>
    ) : null

    return (
      <section style={{ ...wrap, display: 'flex', flexDirection: 'column', alignItems: flexAlign, textAlign: align as any }} className={animationClass}>
        {titleEl}
        {subtitleEl}
        {ctaEl}
        {mediaEl}
        {freeEls}
      </section>
    )
  }

  if (type === 'about') {
    const dir = p.align === 'right' ? 'row-reverse' : 'row'
    const imageEl = p.imageUrl ? (
      <div style={{ flex: 1, position: 'relative' }}>
        <img src={p.imageUrl} style={{ width: '100%', height: 'auto', borderRadius: 28, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }} />
      </div>
    ) : null

    return (
      <section style={wrap} className={animationClass}>
        <div style={{ display: 'flex', gap: 72, alignItems: 'center', flexDirection: dir as any }}>
          {imageEl}
          <div style={{ flex: 1.2 }}>
            {p.title && <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 24, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{p.title}</h2>}
            {p.description && <p style={{ fontSize: 19, opacity: 0.7, lineHeight: 1.7, marginBottom: 40 }}>{p.description}</p>}
            {p.btnText && <a href={p.btnUrl} style={{ display: 'inline-block', background: accent, color: '#fff', padding: '14px 32px', borderRadius: 14, fontWeight: 700, textDecoration: 'none', boxShadow: \`0 8px 16px \${accent}30\` }}>{p.btnText}</a>}
          </div>
        </div>
        {freeEls}
      </section>
    )
  }

  if (['services', 'features', 'products', 'pricing'].includes(type)) {
    const items = Array.isArray(p.items) ? p.items : []
    const cols = p.columns || 3
    const titleEl = p.title ? <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 20, letterSpacing: '-0.03em' }}>{p.title}</h2> : null
    const subtitleEl = p.subtitle ? <p style={{ fontSize: 20, opacity: 0.6, marginBottom: 64, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>{p.subtitle}</p> : null

    const gridItems = items.map((item: any, i: number) => (
      <div key={i} style={{ padding: 40, borderRadius: 28, border: \`1px solid \${text}12\`, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease', textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        {item.imageUrl && <img src={item.imageUrl} style={{ width: 64, height: 64, borderRadius: 18, marginBottom: 28, objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }} />}
        <h3 style={{ fontWeight: 800, fontSize: 24, marginBottom: 14, letterSpacing: '-0.01em' }}>{item.title}</h3>
        <p style={{ fontSize: 17, opacity: 0.6, lineHeight: 1.6 }}>{item.description}</p>
        {item.price && <div style={{ marginTop: 28, fontSize: 28, fontWeight: 900, color: accent, letterSpacing: '-0.02em' }}>{item.price}</div>}
      </div>
    ))

    return (
      <section style={{ ...wrap, textAlign: 'center' }} className={animationClass}>
        {titleEl}
        {subtitleEl}
        <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${cols}, 1fr)\`, gap: 32 }}>
          {gridItems}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'footer') {
    return (
      <footer style={{ ...wrap, borderTop: \`1px solid \${text}10\`, paddingTop: 60, paddingBottom: 60 }} className={animationClass}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>{p.brandName || ''}</div>
            <p style={{ opacity: 0.5, fontSize: 14 }}>{p.copyright || ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Optional footer links could go here */}
          </div>
        </div>
        {freeEls}
      </footer>
    )
  }

  return (

    <div style={wrap} className={animationClass}>
      {p.title && <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{p.title}</h2>}
      {p.subtitle && <p style={{ opacity: 0.7, lineHeight: 1.6 }}>{p.subtitle}</p>}
      {freeEls}
    </div>
  )
}
`;

module.exports = { BLOCK_PREVIEW_TSX };
