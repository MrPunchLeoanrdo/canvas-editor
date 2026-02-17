# html-to-elements 使用说明

用途：将 LibreOffice 导出的 HTML 文件转换为编辑器内部元素数组（JSON），便于作为中间结构再交给编辑器渲染或进一步处理。

依赖：需要安装 `cheerio`。

运行示例：

```powershell
cd online_editor/libreoffice
npm install cheerio
node html-to-elements.js uploads/f487c3c904d4f99727e6aba35f1ee4a0.html
```

结果：在同目录会生成 `uploads/f487c3c904d4f99727e6aba35f1ee4a0.html.elements.json`，内容为简化的 `IElement[]` JSON。

说明：
- 该工具是原型版本，覆盖常见标签（`p`, `h1..h6`, `a`, `ol/ul/li`, `table`, `img`, `hr`）。
- 产生的 JSON 按照 `online_editor/src/editor/interface/Element.ts` 中的字段风格给出，但未严格类型化，后续可改进以满足全部字段。

下一步建议：把该脚本集成到转换服务（`/api/parse?mode=json`），或把生成的 JSON 通过 WebSocket/HTTP 返回给前端并由前端调用 `instance.command` 系列 API 构建文档结构。
