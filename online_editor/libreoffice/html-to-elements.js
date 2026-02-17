#!/usr/bin/env node
// 简易的 HTML -> 编辑器 IElement[] 转换器（用于本地测试 / 中间步骤）
// 依赖: cheerio
// 用法: node html-to-elements.js path/to/file.html

const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

function textRunFromNode($node) {
  const tag = $node[0].tagName
  if (!$node || $node.length === 0) return null
  if ($node[0].type === 'text') {
    const text = $node.text()
    return text.trim() === '' ? null : { type: 'text', value: text }
  }
  if (tag === 'b' || tag === 'strong') {
    return { type: 'text', value: $node.text(), bold: true }
  }
  if (tag === 'i' || tag === 'em') {
    return { type: 'text', value: $node.text(), italic: true }
  }
  if (tag === 'u') {
    return { type: 'text', value: $node.text(), underline: true }
  }
  if (tag === 'a') {
    return {
      type: 'hyperlink',
      url: $node.attr('href') || '',
      valueList: [{ type: 'text', value: $node.text(), underline: true }]
    }
  }
  if (tag === 'span') {
    return { type: 'text', value: $node.text() }
  }
  if (tag === 'img') {
    return {
      type: 'image',
      value: $node.attr('src') || '',
      width: $node.attr('width') ? Number($node.attr('width')) : undefined,
      height: $node.attr('height') ? Number($node.attr('height')) : undefined
    }
  }
  // fallback: serialize children
  const children = []
  $node.contents().each((i, ch) => {
    const $ch = $node.constructor(ch)
    const run = textRunFromNode($ch)
    if (run) children.push(run)
  })
  if (children.length === 1) return children[0]
  return children.length ? { type: 'text', value: children.map(c => c.value || '').join('') } : null
}

function parseParagraph($, $p) {
  const elements = []
  $p.contents().each((i, node) => {
    const $n = $(node)
    const t = textRunFromNode($n)
    if (t) elements.push(t)
  })
  // If single text element, return it directly
  if (elements.length === 1) return elements[0]
  return { type: 'text', value: elements.map(e => e.value || '').join(''), valueList: elements }
}

function parseList($, $list) {
  const tag = $list[0].tagName
  const listType = tag === 'ol' ? 'ol' : 'ul'
  const items = []
  $list.children('li').each((i, li) => {
    const $li = $(li)
    // parse contents as paragraph(s)
    const children = []
    $li.contents().each((j, ch) => {
      const $ch = $(ch)
      if ($ch[0].tagName === 'p') children.push(parseParagraph($, $ch))
      else {
        const t = textRunFromNode($ch)
        if (t) children.push(t)
      }
    })
    items.push({ type: 'list-item', valueList: children })
  })
  return { type: 'list', listType, valueList: items }
}

function parseTable($, $table) {
  const trList = []
  $table.find('tr').each((i, tr) => {
    const tdList = []
    $(tr).find('td, th').each((j, td) => {
      const $td = $(td)
      const inner = []
      $td.contents().each((k, ch) => {
        const $ch = $(ch)
        if ($ch[0].tagName === 'p') inner.push(parseParagraph($, $ch))
        else {
          const t = textRunFromNode($ch)
          if (t) inner.push(t)
        }
      })
      tdList.push({ colspan: Number($td.attr('colspan') || 1), rowspan: Number($td.attr('rowspan') || 1), value: inner })
    })
    trList.push({ tdList })
  })
  return { type: 'table', trList }
}

function parseDocument(html) {
  const $ = cheerio.load(html)
  const body = $('body')
  const out = []
  body.children().each((i, el) => {
    const $el = $(el)
    const tag = el.tagName
    if (tag === 'p') {
      out.push(parseParagraph($, $el))
    } else if (/h[1-6]/.test(tag)) {
      const level = tag.toUpperCase()
      out.push({ type: 'title', level: tag, valueList: [{ type: 'text', value: $el.text() }] })
    } else if (tag === 'ol' || tag === 'ul') {
      out.push(parseList($, $el))
    } else if (tag === 'table') {
      out.push(parseTable($, $el))
    } else if (tag === 'hr') {
      out.push({ type: 'separator' })
    } else if (tag === 'img') {
      out.push({ type: 'image', value: $el.attr('src') || '' })
    } else if (tag === 'center' || tag === 'div') {
      // flatten children
      $el.children().each((j, ch) => {
        const $ch = $(ch)
        const t = $ch[0] && $ch[0].tagName === 'table' ? parseTable($, $ch) : parseParagraph($, $ch)
        if (t) out.push(t)
      })
    } else {
      // fallback: try to parse as paragraph
      const text = $el.text().trim()
      if (text) out.push({ type: 'text', value: text })
    }
  })
  return out
}

// CLI
if (require.main === module) {
  const argv = process.argv.slice(2)
  if (!argv[0]) {
    console.error('Usage: node html-to-elements.js <file.html>')
    process.exit(2)
  }
  const file = path.resolve(argv[0])
  const html = fs.readFileSync(file, 'utf8')
  const elements = parseDocument(html)
  const outPath = file + '.elements.json'
  fs.writeFileSync(outPath, JSON.stringify(elements, null, 2), 'utf8')
  console.log('Wrote', outPath)
}

module.exports = { parseDocument }
