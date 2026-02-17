import * as cheerio from 'cheerio'

// 为避免在 ts-node strip-only 模式下解析工程内的 .ts 源文件，
// 此处使用本地常量替代编辑器内部的枚举/类型引用。
export const ElementType = {
  TEXT: 'text',
  IMAGE: 'image',
  TABLE: 'table',
  HYPERLINK: 'hyperlink',
  LIST: 'list',
  TITLE: 'title',
  SEPARATOR: 'separator'
} as const

export const ListType = { UL: 'ul', OL: 'ol' } as const

export type IElementLike = any

function parseStyleAttr(style?: string) {
  const out: any = {}
  if (!style) return out
  style.split(';').forEach(pair => {
    const [k, v] = pair.split(':').map(s => s && s.trim())
    if (!k || !v) return
    if (k === 'font-size') {
      if (v.endsWith('pt')) out.size = Number(v.replace('pt', ''))
      else if (v.endsWith('px')) out.size = Math.round(Number(v.replace('px', '')) * 0.75)
    }
    if (k === 'font-family') out.font = v.replace(/['"]/g, '')
    if (k === 'color') out.color = v
    if (k === 'text-indent') out.textIndent = v
  })
  return out
}

function textRunFromNode($: cheerio.Root, node: cheerio.Element | cheerio.Node): IElementLike | null {
  const $node = $(node as any)
  if (!node) return null
  // text node
  if ((node as any).type === 'text') {
    const text = $node.text()
    return text.trim() === '' ? null : ({ type: ElementType.TEXT, value: text } as IElementLike)
  }
  const tag = (node as cheerio.Element).tagName
  if (!tag) return null
  const tagName = tag.toLowerCase()
  const style = parseStyleAttr($node.attr('style') || '')
  if (tagName === 'b' || tagName === 'strong') {
    return { type: ElementType.TEXT, value: $node.text(), bold: true, ...style } as IElementLike
  }
  if (tagName === 'i' || tagName === 'em') {
    return { type: ElementType.TEXT, value: $node.text(), italic: true, ...style } as IElementLike
  }
  if (tagName === 'u') {
    return { type: ElementType.TEXT, value: $node.text(), underline: true, ...style } as IElementLike
  }
  if (tagName === 'a') {
    return {
      type: ElementType.HYPERLINK,
      url: $node.attr('href') || '',
      valueList: [{ type: ElementType.TEXT, value: $node.text(), underline: true, ...style }]
    } as IElementLike
  }
  if (tagName === 'span') {
    return { type: ElementType.TEXT, value: $node.text(), ...style } as IElementLike
  }
  if (tagName === 'img') {
    return {
      type: ElementType.IMAGE,
      value: $node.attr('src') || '',
      width: $node.attr('width') ? Number($node.attr('width')) : undefined,
      height: $node.attr('height') ? Number($node.attr('height')) : undefined
    } as IElementLike
  }
  // fallback: collect children (may return multiple runs)
  const children: IElementLike[] = []
  $node.contents().each((i, ch) => {
    const run = textRunFromNode($, ch)
    if (run) {
      // flatten arrays
      if (Array.isArray(run)) children.push(...run)
      else children.push(run)
    }
  })
  if (children.length === 0) return null
  if (children.length === 1) return children[0]
  return children
}

function parseParagraph($: cheerio.Root, $p: cheerio.Cheerio): IElementLike[] {
  const elements: IElementLike[] = []
  $p.contents().each((i, node) => {
    const run = textRunFromNode($, node)
    if (!run) return
    if (Array.isArray(run)) elements.push(...run)
    else elements.push(run)
  })
  // Normalize runs: ensure each run is a plain text/hyperlink/image element
  const normalized = elements.map(e => {
    // if element has valueList (e.g. hyperlink created with valueList), keep as-is
    if ((e as any).valueList) return e
    return { type: (e as any).type || ElementType.TEXT, value: (e as any).value }
  })
  return normalized
}

function parseList($: cheerio.Root, $list: cheerio.Cheerio): IElementLike {
  const tag = ($list[0] as cheerio.Element).tagName
  const listType = tag === 'ol' ? ListType.OL : ListType.UL
  const items: IElementLike[] = []
  $list.children('li').each((i, li) => {
    const $li = $(li)
    const children: IElementLike[] = []
    $li.contents().each((j, ch) => {
      const $ch = $(ch)
      if ($ch[0] && /^p$/i.test(($ch[0] as cheerio.Element).tagName || '')) {
        const pRuns = parseParagraph($, $ch)
        if (Array.isArray(pRuns)) children.push(...pRuns)
        else if (pRuns) children.push(pRuns)
      } else {
        const t = textRunFromNode($, ch)
        if (Array.isArray(t)) children.push(...t)
        else if (t) children.push(t)
      }
    })
    // li represented as a text-like element with valueList so formatElementList can expand it
    items.push({ type: ElementType.TEXT, value: children.map((c: any) => c.value || '').join(''), valueList: children, listType } as any)
  })
  return { type: ElementType.LIST, listType, valueList: items } as IElementLike
}

function parseTable($: cheerio.Root, $table: cheerio.Cheerio): IElementLike {
  const trList: ITr[] = []
  $table.find('tr').each((i, tr) => {
    const tdList: ITd[] = []
    $(tr).find('td, th').each((j, td) => {
      const $td = $(td)
      const inner: IElement[] = []
      $td.contents().each((k, ch) => {
        const $ch = $(ch)
        if ($ch[0] && /^p$/i.test(($ch[0] as cheerio.Element).tagName || '')) inner.push(parseParagraph($, $ch) as IElement)
        else {
          const t = textRunFromNode($, ch)
          if (t) inner.push(t as IElement)
        }
      })
      const tdObj: ITd = {
        colspan: Number($td.attr('colspan') || 1),
        rowspan: Number($td.attr('rowspan') || 1),
        value: inner,
        width: undefined,
        height: undefined,
        deletable: false
      } as ITd
      tdList.push(tdObj)
    })
    const trObj: ITr = { id: undefined, height: 0, tdList } as ITr
    trList.push(trObj)
  })
  return { type: ElementType.TABLE, trList } as IElementLike
}

export function parseDocument(html: string): IElementLike[] {
  const $ = cheerio.load(html)
  const body = $('body')
  const out: IElementLike[] = []
  body.children().each((i, el) => {
    const $el = $(el)
    const tag = (el as cheerio.Element).tagName
    if (/^p$/i.test(tag || '')) {
      out.push(parseParagraph($, $el))
    } else if (/^h[1-6]$/i.test(tag || '')) {
      out.push({ type: 'title', level: tag, valueList: [{ type: 'text', value: $el.text() }] })
    } else if (/^(ol|ul)$/i.test(tag || '')) {
      out.push(parseList($, $el))
    } else if (/^table$/i.test(tag || '')) {
      out.push(parseTable($, $el))
    } else if (/^hr$/i.test(tag || '')) {
      out.push({ type: 'separator' })
    } else if (/^img$/i.test(tag || '')) {
      out.push({ type: 'image', value: $el.attr('src') || '' })
    } else if (/^(center|div)$/i.test(tag || '')) {
      $el.children().each((j, ch) => {
        const $ch = $(ch)
        const chTag = ($ch[0] as cheerio.Element).tagName
        if (/^table$/i.test(chTag || '')) out.push(parseTable($, $ch))
        else if (/^p$/i.test(chTag || '')) out.push(parseParagraph($, $ch))
      })
    } else {
      const text = $el.text().trim()
      if (text) out.push({ type: 'text', value: text })
    }
  })
  return out
}

export default parseDocument
