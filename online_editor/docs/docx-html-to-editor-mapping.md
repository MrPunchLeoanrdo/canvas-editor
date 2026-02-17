# DOCX/HTML 到 canvas-editor 元素映射（中文速查）

说明：此文档把常见的 DOCX/LibreOffice 导出 HTML 构造，映射到本项目编辑器的内部元素类型与主要字段，方便实现 HTML → 编辑器模型的转换。

参考源码位置：
- 元素类型枚举： [online_editor/src/editor/dataset/enum/Element.ts](online_editor/src/editor/dataset/enum/Element.ts#L1-L24)
- 元素接口： [online_editor/src/editor/interface/Element.ts](online_editor/src/editor/interface/Element.ts#L1-L200)
- 列表定义： [online_editor/src/editor/dataset/enum/List.ts](online_editor/src/editor/dataset/enum/List.ts#L1-L40)
- 表格接口： [online_editor/src/editor/interface/table/Tr.ts](online_editor/src/editor/interface/table/Tr.ts#L1-L24), [online_editor/src/editor/interface/table/Td.ts](online_editor/src/editor/interface/table/Td.ts#L1-L120)
- 图片/通用： [online_editor/src/editor/dataset/enum/Common.ts](online_editor/src/editor/dataset/enum/Common.ts#L1-L40)

---

**映射总览（DOCX/HTML → 编辑器）**

- 段落 `<p>`
  - 编辑器类型：`ElementType.TEXT` (`'text'`)
  - 使用接口：`IElement`（基础字段 `value` 与样式字段）
  - 关键字段：`value`（文本），`bold/italic/underline/strikeout`，`font/size/color/highlight`，以及段落缩进/对齐应映射到行/控件层级（control/row 属性）。

- 标题（`<h1>`..`<h6>` 或文档样式）
  - 编辑器类型：`ElementType.TITLE` (`'title'`)
  - 使用接口：`ITitleElement`（`valueList` + `level`）
  - 将 HTML 标题级别映射到 `TitleLevel`（`FIRST`..`SIXTH`）。

- 行内文本 / 文本运行（span/run）
  - 编辑器类型：`ElementType.TEXT`
  - 把每个样式运行转换为单个 `IElement`，并设置样式字段（`bold/italic/underline/size/font/color`）。

- 超链接 `<a href>`
  - 编辑器类型：`ElementType.HYPERLINK` (`'hyperlink'`)
  - 使用：在 `IElement` 上设置 `type: 'hyperlink'`，`url`，并把链接文本放到 `valueList`（`IElement[]`）。

- 列表 `<ul>/<ol>/<li>`
  - 编辑器类型：`ElementType.LIST` (`'list'`)
  - 使用接口：`IListElement`（`listType`、`listStyle`、`valueList`）
  - `listType` 映射到 `ListType.UL`/`ListType.OL`，`listStyle` 映射到 `ListStyle`。

- 表格 `<table>`
  - 编辑器类型：`ElementType.TABLE` (`'table'`)
  - 使用接口：`ITable` + `ITr` + `ITd`。
  - 构造：`trList: ITr[]`，每个 `ITr` 包含 `tdList: ITd[]`，单元格内容为 `ITd.value: IElement[]`。设置 `colspan/rowspan`、边框、列宽（colgroup）。

- 图片 `<img>`
  - 编辑器类型：`ElementType.IMAGE` (`'image'`)
  - 使用接口：`IImageElement` / `IImageBasic`
  - 关键字段：`value`（资源 id 或 src）、`width`、`height`、`imgDisplay`（`ImageDisplay` 枚举）、`imgCrop`、`imgCaption`。

- 分页/分页符
  - 编辑器类型：`ElementType.PAGE_BREAK` (`'pageBreak'`)

- 水平线 / 分隔线 `<hr>`
  - 编辑器类型：`ElementType.SEPARATOR` (`'separator'`)
  - 使用字段：`dashArray`、`lineWidth` 等。

- 复选框 / 单选（表单控件）
  - 对应类型：`ElementType.CHECKBOX` / `ElementType.RADIO` / `ElementType.CONTROL`
  - 使用 `ICheckbox` / `IRadio` / `IControl` 子结构（`checkbox.value` 为 boolean|null）。

- 日期域
  - 编辑器类型：`ElementType.DATE`，字段 `dateFormat`、`dateId`。

- 上标 / 下标
  - 编辑器类型：`ElementType.SUPERSCRIPT` / `ElementType.SUBSCRIPT`，或作为样式字段配合 `actualSize`。

- LaTeX/公式（LibreOffice 通常导出为 SVG）
  - 编辑器类型：`ElementType.LATEX`，字段 `laTexSVG`（SVG 字符串）。

- 制表符（tab）
  - 编辑器类型：`ElementType.TAB`，可用 `value` 表示制表字符或展开间距。

- 块级容器（`div`, `blockquote` 等）
  - 编辑器类型：`ElementType.BLOCK`，使用 `block` 字段（`IBlock`）。

- 标签（Label / Tag）
  - 编辑器类型：`ElementType.LABEL`，字段 `labelId`、`label`（颜色、背景、padding）。

- 区域 / 页眉页脚 / 自定义 zone
  - 编辑器类型：`ElementType.AREA`，使用 `valueList`、`areaId`、`area`（`IArea`）。

---

**样例转换参考（快速查）**

- 简单段落带加粗文本：
  - HTML: `<p><b>原告：</b>吕伟…</p>`
  - 转为：
    - `{ type: 'text', value: '原告：', bold: true }`
    - `{ type: 'text', value: '吕伟，女，…' }`
    - 两个 `IElement` 放入段落行结构（编辑器行模型）。

- 链接：`<a href="...">唐健元</a>` →
  - `{ type: 'hyperlink', url: '...', valueList: [{ type:'text', value:'唐健元', underline:true, color:'#0000ff' }] }`

- 列表：
  - HTML: `<ol><li>项一</li></ol>` → `{ type: 'list', listType: 'ol', listStyle: 'decimal', valueList: [{ type:'text', value:'项一' }] }`

- 表格：
  - HTML 表格的每个 `<tr>` → `ITr`，每个 `<td>` → `ITd`，`ITd.value` 是 `IElement[]`（单元格内部的段落/文本/图片等）。

---

**实现提示**

- LibreOffice 导出的 HTML 常含大量内联样式与 `<style>`，导入时优先解析相关 `style`（font-family、font-size、text-indent、text-align、margin/padding）并映射到 `IElement` 的样式字段或表格/行层级字段。
- 表格的列宽请尝试从 `<colgroup>` 或 `<table>` 的样式/width 提取，填充到 `colgroup` 与 `ITd.width`。
- 图片资源应保存为编辑器可访问的资源并把 `value` 指向资源 id；对内联 base64 可先保存到 uploads 并用路径替换 `value`。
- 当需要程序化结构（索引、搜索、TOC 等）时，考虑在后端把 HTML 解析为 `IElement[]`（使用 cheerio），并提供 `mode=json` 的接口；当前工程也支持直接注入完整 HTML 到编辑器（WYSIWYG）——取决于使用场景。

---

**后续可选工作**

1. 生成每种 `ElementType` 的 JSON 模板样例。
2. 编写 `HTML -> IElement[]` 的转换器原型（Node + cheerio）。
3. 将 LibreOffice 导出的资源统一保存到 `online_editor/libreoffice/uploads`，并把 `IElement` 的 `value` 指向这些资源。

文件位置：`online_editor/docs/docx-html-to-editor-mapping.md`
