import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import './App.css'

interface PDFFile {
  file: File
  name: string
}

function App() {
  const [pdfs, setPdfs] = useState<PDFFile[]>([])
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files) {
      const newPdfs: PDFFile[] = Array.from(files).map(file => ({
        file,
        name: file.name
      }))
      setPdfs([...pdfs, ...newPdfs])
      setMessage('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files) {
      setImages([...images, ...Array.from(files)])
      setMessage('')
    }
  }

  const removePdf = (index: number) => {
    setPdfs(pdfs.filter((_, i) => i !== index))
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const mergePdfs = async () => {
    if (pdfs.length < 2) {
      setMessage('Please upload at least 2 PDFs to merge')
      return
    }

    setLoading(true)
    try {
      const mergedPdf = await PDFDocument.create()

      for (const pdf of pdfs) {
        const arrayBuffer = await pdf.file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      }

      const pdfBytes = await mergedPdf.save()
      downloadPdf(pdfBytes, 'merged.pdf')
      setMessage('✓ PDFs merged successfully!')
      setPdfs([])
    } catch (error) {
      setMessage('✗ Error merging PDFs: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const imagesToPdf = async () => {
    if (images.length === 0) {
      setMessage('Please upload at least 1 image to convert to PDF')
      return
    }

    setLoading(true)
    try {
      const pdfDoc = await PDFDocument.create()

      for (const imageFile of images) {
        const imageData = await imageFile.arrayBuffer()
        const image = await pdfDoc.embedPng(new Uint8Array(imageData))
        
        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        })
      }

      const pdfBytes = await pdfDoc.save()
      downloadPdf(pdfBytes, 'images.pdf')
      setMessage('✓ Images converted to PDF successfully!')
      setImages([])
    } catch (error) {
      setMessage('✗ Error converting images: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = (pdfBytes: Uint8Array, filename: string) => {
    const buffer = new ArrayBuffer(pdfBytes.length)
    const view = new Uint8Array(buffer)
    view.set(pdfBytes)
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📄 PDF Converter</h1>
        <p>Merge PDFs and convert images to PDF</p>
      </header>

      {message && (
        <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <main className="app-main">
        {/* Merge PDFs Section */}
        <section className="converter-section">
          <h2>Merge PDFs</h2>
          <div className="upload-area">
            <label htmlFor="pdf-input" className="file-label">
              <span>📑 Click to upload PDFs</span>
              <input
                id="pdf-input"
                type="file"
                multiple
                accept=".pdf"
                onChange={handlePdfUpload}
              />
            </label>
          </div>

          {pdfs.length > 0 && (
            <div className="file-list">
              <h3>Selected PDFs ({pdfs.length})</h3>
              <ul>
                {pdfs.map((pdf, index) => (
                  <li key={index}>
                    <span>{pdf.name}</span>
                    <button
                      onClick={() => removePdf(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={mergePdfs}
                disabled={loading || pdfs.length < 2}
                className="action-btn"
              >
                {loading ? 'Merging...' : 'Merge PDFs'}
              </button>
            </div>
          )}
        </section>

        {/* Images to PDF Section */}
        <section className="converter-section">
          <h2>Images to PDF</h2>
          <div className="upload-area">
            <label htmlFor="image-input" className="file-label">
              <span>🖼️ Click to upload images</span>
              <input
                id="image-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {images.length > 0 && (
            <div className="file-list">
              <h3>Selected Images ({images.length})</h3>
              <ul>
                {images.map((image, index) => (
                  <li key={index}>
                    <span>{image.name}</span>
                    <button
                      onClick={() => removeImage(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={imagesToPdf}
                disabled={loading || images.length === 0}
                className="action-btn"
              >
                {loading ? 'Converting...' : 'Convert to PDF'}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
