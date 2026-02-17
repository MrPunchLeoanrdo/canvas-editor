import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { parseWithLibreOffice } from './covert.ts'
import cors from 'cors'
import { parseDocument } from './html-to-elements.ts'

const app = express()
// 兼容 ESModule: 获取当前文件夹路径
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, 'uploads')
fs.mkdir(uploadsDir, { recursive: true }).catch(() => {})

const upload = multer({ dest: uploadsDir })

import type { Request, Response } from 'express'
import type { Multer } from 'multer'

// 允许本地页面跨端口请求
app.use(cors())
// 提供静态页面访问（例如访问 http://127.0.0.1:3000/test.html）
app.use(express.static(__dirname))

app.post('/api/parse', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined
  if (!file) {
    res.status(400).send('No file uploaded')
    return
  }
  try {
    // 保留原始文件扩展名，便于 LibreOffice 正确识别格式
    const ext = path.extname(file.originalname) || ''
    let inputPath = file.path
    if (ext) {
      const newPath = file.path + ext
      try {
        await fs.rename(file.path, newPath)
        inputPath = newPath
      } catch (renameErr) {
        console.error('重命名上传文件失败，继续使用原始路径，错误：', renameErr)
      }
    }

    const result = await parseWithLibreOffice(inputPath, 'html', true)
    const html = result.html
    const savedPath = result.outputFile
    console.log(`Converted HTML size: ${Buffer.byteLength(html, 'utf8')} bytes`)
    console.log('Converted HTML preview:', html.slice(0, 300))
    // 将已保存的文件暴露 URL（uploads 目录由 express.static 提供）
    const publicUrl = '/uploads/' + path.basename(savedPath)
    res.set('X-Saved-File', publicUrl)

    // 支持 mode 参数：mode=html（默认）返回 HTML；mode=json 或 mode=both 返回 JSON 包含 html 和 elements
    const mode = (req.query.mode || '').toString().toLowerCase()
    if (mode === 'json' || mode === 'both') {
      let elements = null
      try {
        elements = parseDocument(html)
      } catch (err) {
        console.error('HTML -> elements 解析失败：', err)
        res.status(500).json({ error: '解析失败：' + String(err) })
        return
      }

      // 返回 JSON 包含原始 HTML 与转换后的 elements
      res.set('Content-Type', 'application/json; charset=utf-8')
      res.json({ html, elements, savedFile: publicUrl })
      return
    }

    // 默认返回原始 HTML（保持向后兼容）
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (e: any) {
    console.error('解析失败详细信息:', e)
    res.status(500).send('解析失败: ' + e.message)
  } finally {
    // 删除上传的临时文件
    // 尝试删除可能存在的带扩展名和不带扩展名的文件
    await fs.unlink(file.path).catch(() => {})
    if (file.path !== file.path + path.extname(file.originalname)) {
      await fs.unlink(file.path + path.extname(file.originalname)).catch(() => {})
    }
  }
})

const PORT = 4010
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
