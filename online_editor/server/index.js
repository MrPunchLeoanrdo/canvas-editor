import cors from 'cors'
import express from 'express'
import fs from 'fs/promises'
import multer from 'multer'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'

const app = express()
app.use(cors())

const uploadRoot = path.join(os.tmpdir(), 'canvas-editor-uploads')
await fs.mkdir(uploadRoot, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadRoot,
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname}`
    cb(null, safeName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
})

const convertWithLibreOffice = async filePath => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'canvas-editor-'))
  const sofficePath = process.env.LIBREOFFICE_PATH || 'soffice'
  const args = [
    '--headless',
    '--nologo',
    '--nofirststartwizard',
    '--convert-to',
    'html:HTML',
    '--outdir',
    outputDir,
    filePath
  ]

  const result = await new Promise((resolve, reject) => {
    const child = spawn(sofficePath, args, { windowsHide: true })
    let stderr = ''
    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })
    child.on('error', error => {
      reject(error)
    })
    child.on('close', code => {
      if (code === 0) {
        resolve({ outputDir })
        return
      }
      const message = stderr.trim() || `LibreOffice failed: ${code}`
      reject(new Error(message))
    })
  })

  return result.outputDir
}

const readHtmlFromDir = async outputDir => {
  const files = await fs.readdir(outputDir)
  const htmlFile = files.find(file => file.endsWith('.html') || file.endsWith('.htm'))
  if (!htmlFile) {
    throw new Error('Converted HTML file not found')
  }
  const htmlPath = path.join(outputDir, htmlFile)
  const html = await fs.readFile(htmlPath, 'utf8')
  return html
}

const cleanup = async paths => {
  await Promise.all(
    paths.map(async target => {
      if (!target) return
      try {
        await fs.rm(target, { recursive: true, force: true })
      } catch {
        // Ignore cleanup failures
      }
    })
  )
}

app.post('/doc/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Missing file' })
    return
  }

  const ext = path.extname(req.file.originalname).toLowerCase()
  if (ext !== '.doc' && ext !== '.docx') {
    res.status(400).json({ error: 'Only .doc or .docx is supported' })
    return
  }

  let outputDir
  try {
    outputDir = await convertWithLibreOffice(req.file.path)
    const html = await readHtmlFromDir(outputDir)
    res.json({ html })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Conversion failed' })
  } finally {
    await cleanup([req.file.path, outputDir])
  }
})

const port = process.env.PORT ? Number(process.env.PORT) : 3001
app.listen(port, () => {
  console.log(`Doc convert server listening on ${port}`)
})
