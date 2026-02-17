import { execFile } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'

/**
 * 用 LibreOffice 精准解析 docx/dco 文件为 HTML
 * @param inputPath docx/dco 文件路径
 * @returns 解析后的 HTML 字符串
 */
export async function parseWithLibreOffice(
  inputPath: string,
  format: string = 'html',
  keepFile: boolean = false
): Promise<{ html: string; outputFile: string }> {
  const sofficePath = 'soffice' // 确保已加入环境变量
  const outputDir = path.dirname(inputPath)
  const ext = format === 'html' ? '.html' : format === 'pdf' ? '.pdf' : `.${format}`
  const outputFile = path.join(
    outputDir,
    path.basename(inputPath, path.extname(inputPath)) + ext
  )

  // 转换为 HTML
  await new Promise<void>((resolve, reject) => {
    execFile(
      sofficePath,
      [
        '--headless',
        '--convert-to',
        'html',
        '--outdir',
        outputDir,
        inputPath
      ],
      (error, stdout, stderr) => {
        // 输出 stdout/stderr 便于排查
        if (stdout && stdout.toString()) console.log('soffice stdout:', stdout.toString())
        if (stderr && stderr.toString()) console.error('soffice stderr:', stderr.toString())
        if (error) {
          reject(
            new Error(
              `LibreOffice 转换失败: ${stderr || error.message}`
            )
          )
        } else {
          resolve()
        }
      }
    )
  })

  // 读取输出内容（文本格式例如 html）
  let html = ''
  if (format === 'html' || format === 'txt' || format === 'xml') {
    html = await fs.readFile(outputFile, 'utf-8')
  } else {
    // 非文本格式仍返回空字符串 for now; file is kept on disk
    html = ''
  }

  // 如果不需要保留文件则删除
  if (!keepFile) {
    await fs.unlink(outputFile).catch(() => {})
  }

  return { html, outputFile }
}