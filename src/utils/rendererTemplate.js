
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

    case 'video': {
      const displaySrc = el.src ? resolveDisplayImageUrl(el.src) : ''
      if (displaySrc) {
        return (
          <video 
            src={displaySrc} 
            autoPlay 
            muted 
            loop 
            playsInline
            style={{ 
              width: el.width || '100%', 
              height: el.height || 'auto', 
              borderRadius: el.radius ?? 12,
              objectFit: 'cover'
            }} 
          />
        )
      }
      return null
    }

    case 'icon': {
       return (
         <div style={{ 
           width: el.size || 40, 
           height: el.size || 40, 
           background: el.bg || accentColor + '20', 
           color: el.color || accentColor,
           borderRadius: el.radius ?? 8,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           fontSize: (el.size || 40) * 0.5
         }}>
           {el.value || '★'}
         </div>
       )
    }

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
    const layout = p.layout || 'centered' // centered, split, background
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    const displayImg = p.imageUrl || (p.src ? resolveDisplayImageUrl(p.src) : '')
    const bgImg = layout === 'background' ? displayImg : null
    
    const content = (
      <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: flexAlign, textAlign: align as any, gap: 24, maxWidth: layout === 'centered' ? 800 : '100%' }}>
        {p.title ? (
          <h1 style={{ fontSize: p.titleSize || (layout === 'centered' ? 56 : 48), fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: '-0.03em' }}>{p.title}</h1>
        ) : (
          <div style={{ width: '100%', maxWidth: 500 }}><SkeletonLine h={48} w="90%" color={text} mb={12} /><SkeletonLine h={48} w="60%" color={text} /></div>
        )}
        
        {p.subtitle ? (
          <p style={{ fontSize: p.subtitleSize || 20, opacity: 0.8, maxWidth: 600, margin: 0, lineHeight: 1.6 }}>{p.subtitle}</p>
        ) : (
          <div style={{ width: '100%', maxWidth: 400 }}><SkeletonLine w="100%" color={text} mb={8} /><SkeletonLine w="95%" color={text} mb={8} /><SkeletonLine w="40%" color={text} /></div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: flexAlign }}>
          {(p.primaryBtnText || p.btnText) ? (
            <a href={p.primaryBtnUrl || '#'} style={{ display: 'inline-block', padding: \`\${p.btnPaddingY ?? 14}px \${p.btnPaddingX ?? 36}px\`, background: p.btnBg || accent, color: '#fff', borderRadius: p.btnRadius ?? 12, fontWeight: 700, textDecoration: 'none', fontSize: 16, boxShadow: \`0 10px 20px \${accent}33\` }}>
              {p.primaryBtnText || p.btnText}
            </a>
          ) : (
            <div style={{ width: 140, height: 50, background: accent, borderRadius: 12, opacity: 0.2 }} />
          )}
          {p.secondaryBtnText && (
            <a href={p.secondaryBtnUrl || '#'} style={{ display: 'inline-block', padding: '14px 36px', border: \`2px solid \${accent}\`, color: accent, borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 16 }}>
              {p.secondaryBtnText}
            </a>
          )}
        </div>
      </div>
    )

    if (layout === 'split') {
      return (
        <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: align === 'right' ? 'row-reverse' : 'row', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>{content}</div>
          {displayImg && (
             <div style={{ flex: 1, minWidth: 320 }}>
               <img src={displayImg} alt={p.title || ''} style={{ width: '100%', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
             </div>
          )}
          {freeEls}
        </section>
      )
    }

    if (layout === 'background') {
      return (
        <section className={animationClass} style={{ ...wrapStyle, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: flexAlign, position: 'relative', overflow: 'hidden', color: '#fff' }}>
          {bgImg && <img src={bgImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 }} />
          {content}
          <div style={{ position: 'absolute', width: '100%', left: 0, top: 0, zIndex: 3 }}>{freeEls}</div>
        </section>
      )
    }

    return (
      <section className={animationClass} style={{ ...wrapStyle, display: 'flex', flexDirection: 'column', alignItems: flexAlign, textAlign: align as any, gap: 40 }}>
        {content}
        {displayImg && (
          <img src={displayImg} alt={p.title || ''} style={{ width: '100%', maxWidth: 900, borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
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

  if (type === 'pricing') {
    const items = Array.isArray(p.items) ? p.items : []
    const cardBg = p.cardBg || (bg === '#ffffff' ? '#f8fafc' : \`\${bg}15\`)
    return (
      <section className={animationClass} style={{ ...wrapStyle, textAlign: 'center' }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 40, fontWeight: 800, marginBottom: 12 }}>{p.title}</h2>}
        {p.subtitle && <p style={{ opacity: 0.6, marginBottom: 48, maxWidth: 700, margin: '0 auto 48px' }}>{p.subtitle}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
          {items.map((item: any, i: number) => {
            const isFeatured = item.featured === true
            return (
              <div key={i} style={{ 
                flex: '1 1 300px', 
                maxWidth: 360, 
                background: isFeatured ? accent : cardBg, 
                color: isFeatured ? '#fff' : text,
                padding: '48px 32px', 
                borderRadius: 24, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 24,
                position: 'relative',
                transform: isFeatured ? 'scale(1.05)' : 'none',
                zIndex: isFeatured ? 2 : 1,
                boxShadow: isFeatured ? \`0 20px 40px \${accent}33\` : '0 10px 20px rgba(0,0,0,0.05)'
              }}>
                {isFeatured && <div style={{ position: 'absolute', top: 16, right: 16, background: '#fff', color: accent, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 800 }}>POPULAR</div>}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, opacity: 0.8 }}>{item.title}</div>
                  <div style={{ fontSize: 48, fontWeight: 800, margin: '16px 0' }}>{item.price || '$0'}<span style={{ fontSize: 16, fontWeight: 400, opacity: 0.6 }}>/mo</span></div>
                  <p style={{ opacity: 0.7, fontSize: 14 }}>{item.description}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                  {(Array.isArray(item.features) ? item.features : []).map((f: string, j: number) => (
                    <div key={j} style={{ display: 'flex', gap: 10, fontSize: 14 }}>
                      <span style={{ color: isFeatured ? '#fff' : accent }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <a href={item.btnUrl || '#'} style={{ 
                  marginTop: 'auto', 
                  padding: '14px', 
                  background: isFeatured ? '#fff' : accent, 
                  color: isFeatured ? accent : '#fff', 
                  borderRadius: 12, 
                  fontWeight: 800, 
                  textDecoration: 'none',
                  textAlign: 'center'
                }}>{item.btnText || 'Choose Plan'}</a>
              </div>
            )
          })}
        </div>
        {freeEls}
      </section>
    )
  }

  if (['services', 'features', 'products', 'clients'].includes(type)) {
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
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: cols > 1 ? \`repeat(\${cols}, minmax(0, 1fr))\` : '1fr',
          gap: 24,
          width: '100%'
        }}>
          {items.length > 0 ? items.map((item: any, i: number) => (
            <div key={i} style={{ background: cardBg, padding: 32, borderRadius: p.cardRadius ?? 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.title || ''} style={{ width: '100%', height: 200, borderRadius: 14, objectFit: 'cover', marginBottom: 8 }} />}
              {item.icon && <div style={{ fontSize: 32, color: accent, marginBottom: 8 }}>{item.icon}</div>}
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
              {item.btnText && (
                 <a href={item.btnUrl || '#'} style={{ display: 'inline-block', padding: '10px 20px', background: accent, color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14, textAlign: 'center', marginTop: 'auto' }}>
                   {item.btnText}
                 </a>
              )}
            </div>
          )) : [1,2,3].map(i => (
            <div key={i} style={{ background: cardBg, padding: 32, borderRadius: p.cardRadius ?? 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: '100%', height: 140, background: text, opacity: 0.05, borderRadius: 12 }} />
              <SkeletonLine w="60%" h={20} color={text} />
              <div style={{ width: '100%' }}><SkeletonLine w="100%" color={text} mb={6} /><SkeletonLine w="80%" color={text} /></div>
            </div>
          ))}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'slider') {
    const items = Array.isArray(p.items) ? p.items : []
    return (
      <section className={animationClass} style={{ ...wrapStyle, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden', height: p.height || 600 }}>
        {items.length > 0 ? (
           <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img 
                src={items[0].imageUrl || (items[0].src ? resolveDisplayImageUrl(items[0].src) : '')} 
                alt={items[0].title || ''} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40, color: '#fff' }}>
                 <div style={{ maxWidth: 800 }}>
                   <h2 style={{ fontSize: 56, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{items[0].title}</h2>
                   <p style={{ fontSize: 20, opacity: 0.9, marginTop: 16, lineHeight: 1.6 }}>{items[0].description}</p>
                   {items[0].btnText && (
                     <a href={items[0].btnUrl || '#'} style={{ display: 'inline-block', marginTop: 32, padding: '16px 40px', background: accent, color: '#fff', borderRadius: 14, fontWeight: 800, textDecoration: 'none', fontSize: 16 }}>{items[0].btnText}</a>
                   )}
                 </div>
                 
                 {/* Navigation indicators */}
                 <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
                   {items.map((_, i) => (
                     <div key={i} style={{ width: i === 0 ? 32 : 10, height: 10, borderRadius: 10, background: '#fff', opacity: i === 0 ? 1 : 0.3, transition: 'all 0.3s' }} />
                   ))}
                 </div>

                 {/* Arrows */}
                 <div style={{ position: 'absolute', top: '50%', left: 30, transform: 'translateY(-50%)', width: 50, height: 50, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>←</div>
                 <div style={{ position: 'absolute', top: '50%', right: 30, transform: 'translateY(-50%)', width: 50, height: 50, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>→</div>
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

  if (type === 'cta') {
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    return (
      <section className={animationClass} style={{ ...wrapStyle }}>
         <div style={{ background: accent, color: '#fff', borderRadius: 24, padding: '48px 40px', textAlign: align as any, display: 'flex', flexDirection: 'column', alignItems: flexAlign, gap: 20, boxShadow: \`0 15px 30px \${accent}33\` }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>{p.title || 'Ready to start?'}</h2>
            <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 600, margin: 0 }}>{p.subtitle || p.description}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href={p.btnUrl || '#'} style={{ padding: '14px 32px', background: '#fff', color: accent, borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>{p.btnText || 'Get Started'}</a>
              {p.secondaryBtnText && <a href={p.secondaryBtnUrl || '#'} style={{ padding: '14px 32px', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>{p.secondaryBtnText}</a>}
            </div>
         </div>
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
          <div style={{ width: '100%', maxWidth: 600, background: p.cardBg || (bg === '#ffffff' ? '#f8fafc' : \`\${bg}15\`), padding: 40, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
             <input type="text" placeholder="Нэр" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: \`1px solid \${text}20\`, fontSize: 15, boxSizing: 'border-box' }} />
             <input type="email" placeholder="И-мэйл" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: \`1px solid \${text}20\`, fontSize: 15, boxSizing: 'border-box' }} />
             <textarea placeholder="Мессеж" rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: \`1px solid \${text}20\`, fontSize: 15, resize: 'none', boxSizing: 'border-box' }} />
             <button style={{ width: '100%', padding: '14px', background: accent, color: '#fff', borderRadius: 10, fontWeight: 700, border: 'none', fontSize: 15, cursor: 'pointer', transition: 'transform 0.2s' }}>
                Илгээх
             </button>
          </div>
        )}
        {freeEls}
      </section>
    )
  }

  if (type === 'testimonials') {
    const items = Array.isArray(p.items) ? p.items : []
    const cardBg = p.cardBg || (bg === '#ffffff' ? '#f8fafc' : \`\${bg}15\`)
    return (
      <section className={animationClass} style={{ ...wrapStyle, textAlign: 'center' }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700', marginBottom: 40 }}>{p.title}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, width: '100%' }}>
          {items.map((item: any, i: number) => (
            <div key={i} style={{ background: cardBg, padding: 32, borderRadius: 20, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 60, color: accent, opacity: 0.1, position: 'absolute', top: 10, left: 20, fontFamily: 'serif' }}>"</div>
              <p style={{ fontStyle: 'italic', opacity: 0.8, fontSize: 16, lineHeight: 1.6, zIndex: 1, margin: 0 }}>{item.quote || item.description || 'Very impressed with the service!'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                {item.imageUrl && <img src={item.imageUrl} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{item.author || item.title || 'User Name'}</div>
                  <div style={{ fontSize: 13, opacity: 0.5 }}>{item.role || item.subtitle || 'Customer'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'faq') {
    const items = Array.isArray(p.items) ? p.items : []
    const cardBg = p.cardBg || (bg === '#ffffff' ? '#f8fafc' : \`\${bg}15\`)
    return (
      <section className={animationClass} style={{ ...wrapStyle }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700', textAlign: 'center', marginBottom: 40 }}>{p.title}</h2>}
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item: any, i: number) => (
            <div key={i} style={{ background: cardBg, borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                {item.question || item.title || 'How does it work?'}
                <span style={{ color: accent, fontSize: 20 }}>+</span>
              </h3>
              <p style={{ opacity: 0.7, lineHeight: 1.6, fontSize: 15, marginTop: 12, marginBottom: 0 }}>{item.answer || item.description || 'Our platform is designed to be intuitive and easy to use.'}</p>
            </div>
          ))}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'stats') {
    const items = Array.isArray(p.items) ? p.items : []
    return (
      <section className={animationClass} style={{ ...wrapStyle, textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, width: '100%' }}>
          {items.map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>{item.value || item.title || '10k+'}</div>
              <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label || item.subtitle || item.description || 'Happy Clients'}</div>
            </div>
          ))}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'gallery') {
    const items = Array.isArray(p.items) ? p.items : []
    const cols = p.columns || 3
    return (
      <section className={animationClass} style={{ ...wrapStyle, textAlign: 'center' }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700', marginBottom: 40 }}>{p.title}</h2>}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: \`repeat(\${cols}, minmax(0, 1fr))\`,
          gap: 16,
          width: '100%'
        }}>
          {items.length > 0 ? items.map((item: any, i: number) => (
            <div key={i} style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: 16, background: \`\${text}05\` }}>
              <img 
                src={item.imageUrl || (item.src ? resolveDisplayImageUrl(item.src) : '')} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          )) : [1,2,3,4,5,6].map(i => (
             <div key={i} style={{ aspectRatio: '4/3', borderRadius: 16, background: \`\${text}05\` }} />
          ))}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'team') {
    const items = Array.isArray(p.items) ? p.items : []
    const cols = p.columns || 4
    return (
      <section className={animationClass} style={{ ...wrapStyle, textAlign: 'center' }}>
        {p.title && <h2 style={{ fontSize: p.titleSize || 34, fontWeight: '700', marginBottom: 12 }}>{p.title}</h2>}
        {p.subtitle && <p style={{ opacity: 0.6, marginBottom: 48, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>{p.subtitle}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${cols}, minmax(0, 1fr))\`, gap: 40, width: '100%' }}>
          {items.map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                <img src={item.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{item.title || 'Member Name'}</h3>
                <p style={{ color: accent, fontWeight: 600, fontSize: 14, margin: '6px 0 0' }}>{item.subtitle || item.role || 'Position'}</p>
              </div>
            </div>
          ))}
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'newsletter') {
    return (
      <section className={animationClass} style={{ ...wrapStyle, paddingTop: py + 20, paddingBottom: py + 20 }}>
        <div style={{ background: accent, color: '#fff', textAlign: 'center', borderRadius: 32, padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: \`0 20px 40px \${accent}33\` }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, margin: 0 }}>{p.title || 'Бидэнтэй нэгдээрэй'}</h2>
          <p style={{ opacity: 0.9, maxWidth: 500, margin: '0 auto 40px', fontSize: 18, lineHeight: 1.6 }}>{p.subtitle || 'Шинэ мэдээ мэдээллийг цаг алдалгүй аваарай.'}</p>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 500, flexWrap: 'wrap' }}>
            <input 
              type="email" 
              placeholder="И-мэйл хаяг" 
              style={{ flex: 1, minWidth: 260, padding: '16px 24px', borderRadius: 14, border: 'none', fontSize: 16, outline: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
            />
            <button style={{ padding: '16px 32px', background: '#fff', color: accent, borderRadius: 14, fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              Бүртгүүлэх
            </button>
          </div>
        </div>
        {freeEls}
      </section>
    )
  }

  if (type === 'footer') {
    const align = p.align || 'center'
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
    const footerLinks = Array.isArray(p.links) ? p.links : []
    const columns = Array.isArray(p.columns) ? p.columns : []

    return (
      <footer className={animationClass} style={{ ...wrapStyle, borderTop: \`1px solid \${text}15\`, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, textAlign: 'left' }}>
          <div style={{ flex: '1 1 300px' }}>
            {(p.brandName || p.title) ? (
              <div style={{ fontWeight: 800, fontSize: 26, marginBottom: 16 }}>{p.brandName || p.title}</div>
            ) : (
              <SkeletonLine w={140} h={26} color={text} mb={16} />
            )}
            {(p.description || p.subtitle) && <p style={{ opacity: 0.6, maxWidth: 400, margin: 0, lineHeight: 1.6, fontSize: 15 }}>{p.description || p.subtitle}</p>}
          </div>

          {columns.length > 0 ? (
             columns.map((col: any, i: number) => (
               <div key={i} style={{ flex: '1 1 150px' }}>
                 <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>{col.title}</div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {Array.isArray(col.links) && col.links.map((link: any, j: number) => (
                     <a key={j} href={link.href || '#'} style={{ fontSize: 14, opacity: 0.6, textDecoration: 'none', color: text }}>{link.label}</a>
                   ))}
                 </div>
               </div>
             ))
          ) : footerLinks.length > 0 && (
             <div style={{ display: 'flex', gap: 32 }}>
                {footerLinks.map((link: any, i: number) => (
                  <a key={i} href={link.href || '#'} style={{ fontSize: 14, fontWeight: 600, color: text, opacity: 0.6, textDecoration: 'none' }}>{link.label}</a>
                ))}
             </div>
          )}
        </div>

        <div style={{ borderTop: \`1px solid \${text}08\`, paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.5 }}>
            {p.copyright ? \`© \${new Date().getFullYear()} \${p.copyright}\` : <SkeletonLine w={180} h={14} color={text} />}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
             {/* Social placeholders */}
             {['fb', 'tw', 'ig'].map(s => <div key={s} style={{ width: 32, height: 32, borderRadius: '50%', background: \`\${text}10\`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{s}</div>)}
          </div>
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
