import { useCallback } from 'react'
import * as ExcelJS from 'exceljs'
import type { ParsedErrorRow } from '../types'

// Parsea el Excel anotado (base64) que devuelve cada *UploadService cuando success=false,
// para alimentar el drawer de errores (vista 4.3 §2). La última columna es siempre 'MensajeError'.
export const useParseErrorExcel = () => {
  return useCallback(async (excelBase64: string): Promise<ParsedErrorRow[]> => {
    const binary = atob(excelBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(bytes.buffer)
    const ws = wb.worksheets[0]
    if (!ws) return []

    const headerRow = ws.getRow(1)
    const headers: string[] = []
    headerRow.eachCell((cell) => {
      headers.push(String(cell.value ?? ''))
    })
    const errorColIndex = headers.findIndex((h) => h.trim().toLowerCase() === 'mensajeerror')
    if (errorColIndex < 0) return []

    const parsed: ParsedErrorRow[] = []
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const errorCell = row.getCell(errorColIndex + 1).value
      const errorText = errorCell === null || errorCell === undefined ? '' : String(errorCell).trim()
      if (errorText === '') return
      const cells: Record<string, string> = {}
      headers.forEach((h, idx) => {
        if (idx === errorColIndex) return
        const v = row.getCell(idx + 1).value
        cells[h] = v === null || v === undefined ? '' : String(v)
      })
      parsed.push({ rowNumber, messages: errorText.split(' | '), cells })
    })
    return parsed
  }, [])
}
