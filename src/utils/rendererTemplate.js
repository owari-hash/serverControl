
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

function SkeletonLine({ w = '100%', h = 14, color = '#1e293b', mb = 0 }: {
  w?: string | number; h?: number; color?: string; mb?: number
}) {
  return <div style={{ width: w, height: h, background: color, opacity: 0.2, borderRadius: 4, marginBottom: mb }} />
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
  const wrap: CSSProperties = { fontFamily: font, background: bg, color: text, paddingLeft: px, paddingRight: px, paddingTop: py, paddingBottom: py, position: 'relative' }
  const freeEls = <FreeEls elements={elements} accent={accent} text={text} />

  if (type === 'header') {
    const navLinks = Array.isArray(p.links) ? p.links : []
    const titlePx = pxFromSizeProp(p.fontSize, 20)
    const navPx = pxFromSizeProp(p.navFontSize, 14)
    const headerWrap: CSSProperties = { ...wrap, paddingTop: p.paddingY ?? 18, paddingBottom: p.paddingY ?? 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    const navEls = navLinks.map((link: any, i: number) => <a key={i} href={link.href} style={{ fontSize: navPx, fontWeight: 600, opacity: 0.88, color: 'inherit', textDecoration: 'none' }}>{link.label || link.href}</a>)
    const titleBlock = <div style={{ fontWeight: 800, fontSize: titlePx }}>{p.title || p.brandName || 'Site'}</div>
    const ctaBlock = p.ctaText ? <a href={p.ctaUrl} style={{ padding: '8px 16px', background: accent, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{p.ctaText}</a> : null
    
    return (
      <header style={headerWrap} className={animationClass}>
        {titleBlock}
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {navEls}
          {ctaBlock}
        </nav>
      </header>
    )
  }

  if (type === 'hero') {
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    
    const mediaEl = p.imageUrl ? <img src={p.imageUrl} style={{ maxWidth: '100%', borderRadius: 16, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} /> : null
    const titleEl = p.title ? <h1 style={{ fontSize: p.titleSize || 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>{p.title}</h1> : null
    const subtitleEl = p.subtitle ? <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 32, maxWidth: 600 }}>{p.subtitle}</p> : null
    const ctaEl = (p.primaryBtnText || p.secondaryBtnText) ? (
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: flexAlign }}>
        {p.primaryBtnText && <a href={p.primaryBtnUrl} style={{ background: accent, color: '#fff', padding: '14px 32px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>{p.primaryBtnText}</a>}
        {p.secondaryBtnText && <a href={p.secondaryBtnUrl} style={{ border: \`2px solid \${accent}\`, color: 'inherit', padding: '14px 32px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>{p.secondaryBtnText}</a>}
      </div>
    ) : null

    return (
      <section style={{ ...wrap, display: 'flex', flexDirection: 'column', alignItems: flexAlign, textAlign: align as any }} className={animationClass}>
        {titleEl}
        {subtitleEl}
        {ctaEl}
        {mediaEl && <div style={{ marginTop: 48, width: '100%', display: 'flex', justifyContent: 'center' }}>{mediaEl}</div>}
        {freeEls}
      </section>
    )
  }

  if (['services', 'features', 'products', 'pricing'].includes(type)) {
    const items = Array.isArray(p.items) ? p.items : []
    const cols = p.columns || 3
    const titleEl = p.title ? <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{p.title}</h2> : null
    const subtitleEl = p.subtitle ? <p style={{ opacity: 0.7, marginBottom: 48 }}>{p.subtitle}</p> : null

    const gridItems = items.map((item: any, i: number) => (
      <div key={i} style={{ padding: 24, borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
        {item.imageUrl && <img src={item.imageUrl} style={{ width: 48, height: 48, borderRadius: 8, marginBottom: 16, objectFit: 'cover' }} />}
        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{item.title}</h3>
        <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6 }}>{item.description}</p>
        {item.price && <div style={{ marginTop: 16, fontWeight: 900, color: accent }}>{item.price}</div>}
      </div>
    ))

    return (
      <section style={{ ...wrap, textAlign: 'center' }} className={animationClass}>
        {titleEl}
        {subtitleEl}
        <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${cols}, 1fr)\`, gap: 24 }}>
          {gridItems}
        </div>
        {freeEls}
      </section>
    )
  }

  return (
    <div style={wrap} className={animationClass}>
      {p.title && <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{p.title}</h2>}
      {p.subtitle && <p style={{ opacity: 0.7, marginBottom: 16 }}>{p.subtitle}</p>}
      {freeEls}
    </div>
  )
}
`;

module.exports = { BLOCK_PREVIEW_TSX };
