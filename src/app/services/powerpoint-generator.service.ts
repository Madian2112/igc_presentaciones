import { Injectable } from '@angular/core';
import { PresentationItem } from '../models/presentation-item.model';
import { ExportOptions } from '../models/presentation.model';
import { GoogleDriveService } from './google-drive.service';
import * as PptxGenJS from 'pptxgenjs';
import * as JSZip from 'jszip';

@Injectable({
  providedIn: 'root'
})
export class PowerpointGeneratorService {
  
  constructor(private googleDriveService: GoogleDriveService) {}

  async generatePowerPoint(items: PresentationItem[], name: string, options: ExportOptions): Promise<void> {
    try {
      console.log("🔄 Starting PowerPoint generation with real slide copy...")

      // Initialize PptxGenJS
      const pptx = new PptxGenJS.default()
      this.configurePresentationSettings(pptx, name, options)

      // Add title slide first
      this.addTitleSlide(pptx, name, items.length)

      // Process each presentation item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        console.log(`📄 Processing item ${i + 1}/${items.length}: ${item.name}`)

        try {
          await this.processItem(pptx, item, options)
        } catch (error) {
          console.warn(`⚠️ Failed to process item "${item.name}":`, error)
          this.addErrorSlide(pptx, item, error as Error)
        }
      }

      // Generate and download the presentation
      console.log("💾 Generating PowerPoint file...")
      await pptx.writeFile({ fileName: `${name}.pptx` })

      console.log("✅ PowerPoint generation completed successfully!")
    } catch (error) {
      console.error("❌ PowerPoint generation failed:", error)
      throw new Error(`PowerPoint generation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private configurePresentationSettings(pptx: any, name: string, options: ExportOptions): void {
    if (options.slideSize === "4:3") {
      pptx.defineLayout({ name: "CUSTOM", width: 10, height: 7.5 })
    } else {
      pptx.defineLayout({ name: "CUSTOM", width: 13.33, height: 7.5 })
    }
    pptx.layout = "CUSTOM"

    pptx.author = "Church Presentation Studio"
    pptx.company = "Church Ministry"
    pptx.subject = name
    pptx.title = name
  }

  private async processItem(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    switch (item.type) {
      case "song":
        await this.addRealSongSlides(pptx, item, options)
        break
      case "video":
        await this.addVideoSlide(pptx, item, options)
        break
      case "image":
        await this.addImageSlide(pptx, item, options)
        break
      default:
        console.warn(`Unknown item type: ${item.type}`)
    }
  }

  private async addRealSongSlides(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    try {
      console.log(`🎵 Extracting real slides from: ${item.name}`)
      
      // Get the Google Drive file ID from the original song metadata
      const driveFileId = item.metadata?.originalSong?.metadata?.driveFileId
      
      if (!driveFileId) {
        console.warn(`No Drive file ID found for ${item.name}, using fallback`)
        await this.addFallbackSongSlides(pptx, item, options)
        return
      }

      // Download the PowerPoint file from Google Drive
      console.log(`📥 Downloading PowerPoint file: ${driveFileId}`)
      const pptxBlob = await this.googleDriveService.downloadFile(driveFileId)
      
      // Extract slides from the downloaded PowerPoint
      const extractedSlides = await this.extractSlidesFromPowerPoint(pptxBlob)
      
      // Add each extracted slide to the main presentation
      for (let i = 0; i < extractedSlides.length; i++) {
        console.log(`📄 Adding slide ${i + 1}/${extractedSlides.length} from ${item.name}`)
        await this.addExtractedSlide(pptx, extractedSlides[i], options)
      }

      console.log(`✅ Successfully added ${extractedSlides.length} slides from ${item.name}`)
      
    } catch (error) {
      console.error(`❌ Failed to extract real slides from ${item.name}:`, error)
      // Fallback to generated slides if extraction fails
      await this.addFallbackSongSlides(pptx, item, options)
    }
  }

  private async extractSlidesFromPowerPoint(pptxBlob: Blob): Promise<any[]> {
    try {
      console.log("🔍 Extracting slides from PowerPoint file...")
      
      // Load the PowerPoint file using JSZip
      const zip = await JSZip.loadAsync(pptxBlob)
      const slides: any[] = []

      // Find all slide files in the PowerPoint
      const slideFiles = Object.keys(zip.files).filter(fileName => 
        fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
      )

      console.log(`Found ${slideFiles.length} slides in PowerPoint file`)

      // Extract each slide
      for (const slideFile of slideFiles) {
        try {
          const slideXml = await zip.files[slideFile].async('text')
          const slideData = this.parseSlideXml(slideXml)
          slides.push(slideData)
        } catch (error) {
          console.warn(`Failed to extract slide ${slideFile}:`, error)
        }
      }

      // Also extract media files (images, etc.)
      const mediaFiles = await this.extractMediaFiles(zip)
      
      return slides.map(slide => ({ ...slide, mediaFiles }))
      
    } catch (error) {
      console.error("Failed to extract slides from PowerPoint:", error)
      throw error
    }
  }

  private parseSlideXml(slideXml: string): any {
    console.log("🔍 Parsing slide XML...")
    
    const textContent = this.extractTextFromXml(slideXml)
    const images = this.extractImagesFromXml(slideXml)
    const backgroundColor = this.extractBackgroundFromXml(slideXml)
    
    console.log("📝 Extracted text content:", textContent)
    
    return {
      textContent,
      images,
      backgroundColor,
      rawXml: slideXml // Keep raw XML for debugging
    }
  }

  private extractTextFromXml(xml: string): string[] {
    const texts: string[] = []
    
    try {
      // Buscar todas las etiquetas <a:t> que contienen el texto real
      const textRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g
      let match
      
      while ((match = textRegex.exec(xml)) !== null) {
        let text = match[1]
        
        // Limpiar entidades HTML
        text = text
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim()
        
        if (text && text.length > 0) {
          texts.push(text)
        }
      }
      
      // Si no encontramos texto con el primer método, intentar con un enfoque más amplio
      if (texts.length === 0) {
        console.log("⚠️ No text found with primary method, trying alternative extraction...")
        
        // Buscar patrones de texto alternativos
        const alternativeRegex = /<a:t>([\s\S]*?)<\/a:t>/g
        let altMatch
        
        while ((altMatch = alternativeRegex.exec(xml)) !== null) {
          let text = altMatch[1]
          text = this.cleanXmlText(text)
          
          if (text && text.length > 0) {
            texts.push(text)
          }
        }
      }
      
      // Si aún no hay texto, buscar cualquier contenido de texto en el XML
      if (texts.length === 0) {
        console.log("⚠️ Still no text found, extracting from text blocks...")
        const textBlocks = this.extractTextBlocks(xml)
        texts.push(...textBlocks)
      }
      
      return texts
      
    } catch (error) {
      console.error("❌ Error extracting text from XML:", error)
      return [`Error extracting text: ${error}`]
    }
  }
  
  private cleanXmlText(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
  }
  
  private extractTextBlocks(xml: string): string[] {
    const textBlocks: string[] = []
    
    try {
      // Buscar bloques de párrafo que contengan texto
      const paragraphRegex = /<a:p[^>]*>([\s\S]*?)<\/a:p>/g
      let match
      
      while ((match = paragraphRegex.exec(xml)) !== null) {
        const paragraphContent = match[1]
        
        // Extraer texto de este párrafo
        const textInParagraph = this.extractTextFromParagraph(paragraphContent)
        if (textInParagraph) {
          textBlocks.push(textInParagraph)
        }
      }
      
      return textBlocks
      
    } catch (error) {
      console.error("❌ Error extracting text blocks:", error)
      return []
    }
  }
  
  private extractTextFromParagraph(paragraphXml: string): string {
    const texts: string[] = []
    
    // Buscar todas las etiquetas <a:t> dentro del párrafo
    const textRegex = /<a:t[^>]*>(.*?)<\/a:t>/g
    let match
    
    while ((match = textRegex.exec(paragraphXml)) !== null) {
      const text = this.cleanXmlText(match[1])
      if (text) {
        texts.push(text)
      }
    }
    
    return texts.join(' ')
  }

  private extractImagesFromXml(xml: string): any[] {
    // Extract image references from the XML
    const imageRegex = /<a:blip[^>]*r:embed="([^"]*)"[^>]*>/g
    const images: any[] = []
    let match

    while ((match = imageRegex.exec(xml)) !== null) {
      images.push({
        relationshipId: match[1],
        // Additional image properties can be extracted here
      })
    }

    return images
  }

  private extractBackgroundFromXml(xml: string): string {
    // Try to extract background color or image
    const bgColorRegex = /<a:solidFill[^>]*>[\s\S]*?<a:srgbClr[^>]*val="([^"]*)"[^>]*>/
    const match = bgColorRegex.exec(xml)
    
    return match ? match[1] : "000000" // Default to black if no background found
  }

  private async extractMediaFiles(zip: any): Promise<{ [key: string]: string }> {
    const mediaFiles: { [key: string]: string } = {}
    
    // Extract media files from the PowerPoint
    const mediaFolder = zip.folder('ppt/media')
    if (mediaFolder) {
      for (const [fileName, file] of Object.entries(mediaFolder.files)) {
        const zipFile = file as JSZip.JSZipObject;
        if (!zipFile.dir) {
          try {
            const blob = await zipFile.async('blob')
            mediaFiles[fileName] = await this.blobToBase64(blob)
          } catch (error) {
            console.warn(`Failed to extract media file ${fileName}:`, error)
          }
        }
      }
    }

    return mediaFiles
  }

  private async addExtractedSlide(pptx: any, slideData: any, options: ExportOptions): Promise<void> {
    const slide = pptx.addSlide()

    // Set background
    if (slideData.backgroundColor) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
        fill: slideData.backgroundColor,
        line: { width: 0 }
      })
    }

    // Add text content
    if (slideData.textContent && slideData.textContent.length > 0) {
      const combinedText = slideData.textContent.join('\n')
      
      slide.addText(combinedText, {
        x: 0.5,
        y: 1,
        w: "90%",
        h: "80%",
        fontSize: options.optimizeForProjector ? 44 : 36,
        color: "FFFFFF",
        align: "center",
        fontFace: "Arial",
        bold: true,
        valign: "middle",
        shadow: {
          type: "outer",
          blur: 3,
          offset: 2,
          angle: 45,
          color: "000000",
        },
      })
    }

    // Add images if any
    if (slideData.images && slideData.mediaFiles) {
      for (const image of slideData.images) {
        const mediaFile = Object.values(slideData.mediaFiles)[0] // Simple approach - use first media file
        if (mediaFile) {
          slide.addImage({
            data: mediaFile,
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
            sizing: { type: "contain" }
          })
        }
      }
    }

    // Add transitions if enabled
    if (options.includeTransitions) {
      slide.transition = { type: "fade", duration: 1000 }
    }
  }

  private async addFallbackSongSlides(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    console.log(`📝 Using fallback text generation for: ${item.name}`)
    
    const lyrics = item.metadata?.originalSong?.lyrics || this.generateDefaultLyrics(item.name)

    for (let i = 0; i < lyrics.length; i++) {
      const slide = pptx.addSlide()

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
        fill: "1a1a2e",
        line: { width: 0 }
      })

      slide.addText(lyrics[i], {
        x: 0.5,
        y: 1.5,
        w: "90%",
        h: 5,
        fontSize: options.optimizeForProjector ? 44 : 36,
        color: "FFFFFF",
        align: "center",
        fontFace: "Arial",
        bold: true,
        shadow: {
          type: "outer",
          blur: 3,
          offset: 2,
          angle: 45,
          color: "000000",
        },
      })

      slide.addText(`${i + 1} / ${lyrics.length}`, {
        x: "85%",
        y: "90%",
        w: "10%",
        h: 0.5,
        fontSize: 14,
        color: "CCCCCC",
        align: "center",
        fontFace: "Arial",
      })

      if (options.includeTransitions) {
        slide.transition = { type: "fade", duration: 1000 }
      }
    }
  }

  // ... resto de métodos (addVideoSlide, addImageSlide, etc.) permanecen igual que antes

  private async addVideoSlide(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    const slide = pptx.addSlide()

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
      fill: "000000",
      line: { width: 0 }
    })

    try {
      if (item.source.startsWith("blob:")) {
        const videoData = await this.prepareVideoData(item.source)
        
        slide.addMedia({
          type: "video",
          data: videoData,
          x: 0.5,
          y: 0.5,
          w: "90%",
          h: "80%",
        })
      } else {
        this.addVideoPlaceholder(slide, item)
      }

      slide.addText(item.name, {
        x: 0.5,
        y: 0.2,
        w: "90%",
        h: 0.8,
        fontSize: 24,
        color: "FFFFFF",
        align: "center",
        fontFace: "Arial",
        bold: true,
        shadow: {
          type: "outer",
          blur: 5,
          offset: 3,
          angle: 45,
          color: "000000",
        },
      })
    } catch (error) {
      console.warn(`Failed to add video ${item.name}:`, error)
      this.addVideoPlaceholder(slide, item)
    }
  }

  private async addImageSlide(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    const slide = pptx.addSlide()

    try {
      const imageData = await this.prepareImageData(item.source)

      slide.addImage({
        data: imageData,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
        sizing: { type: "cover" },
      })

      if (item.name && item.name !== "Untitled") {
        slide.addText(item.name, {
          x: 0.5,
          y: "85%",
          w: "90%",
          h: 1,
          fontSize: 20,
          color: "FFFFFF",
          align: "center",
          fontFace: "Arial",
          bold: true,
          shadow: {
            type: "outer",
            blur: 5,
            offset: 3,
            angle: 45,
            color: "000000",
          },
        })
      }
    } catch (error) {
      console.warn(`Failed to add image ${item.name}:`, error)
      this.addImagePlaceholder(slide, item)
    }
  }

  private addTitleSlide(pptx: any, presentationName: string, itemCount: number): void {
    const slide = pptx.addSlide()

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
      fill: "1a1a2e",
      line: { width: 0 }
    })

    slide.addText(presentationName, {
      x: 1,
      y: 2,
      w: "80%",
      h: 1.5,
      fontSize: 48,
      color: "FFFFFF",
      align: "center",
      fontFace: "Arial",
      bold: true,
    })

    slide.addText(`${itemCount} Elements • Generated by Church Presentation Studio`, {
      x: 1,
      y: 4,
      w: "80%",
      h: 0.8,
      fontSize: 24,
      color: "CCCCCC",
      align: "center",
      fontFace: "Arial",
    })

    slide.addText(new Date().toLocaleDateString(), {
      x: 1,
      y: 5.5,
      w: "80%",
      h: 0.5,
      fontSize: 16,
      color: "999999",
      align: "center",
      fontFace: "Arial",
    })
  }

  private addErrorSlide(pptx: any, item: PresentationItem, error: Error): void {
    const slide = pptx.addSlide()

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
      fill: "2c1810",
      line: { width: 0 }
    })

    slide.addText("⚠️ Error Loading Content", {
      x: 1,
      y: 2,
      w: "80%",
      h: 1,
      fontSize: 36,
      color: "FF6B6B",
      align: "center",
      fontFace: "Arial",
      bold: true,
    })

    slide.addText(`Item: ${item.name}`, {
      x: 1,
      y: 3.5,
      w: "80%",
      h: 0.8,
      fontSize: 24,
      color: "FFFFFF",
      align: "center",
      fontFace: "Arial",
    })

    slide.addText(`Error: ${error.message}`, {
      x: 1,
      y: 4.5,
      w: "80%",
      h: 1,
      fontSize: 18,
      color: "CCCCCC",
      align: "center",
      fontFace: "Arial",
    })
  }

  private addVideoPlaceholder(slide: any, item: PresentationItem): void {
    slide.addShape(slide.shapes?.RECTANGLE || "rectangle", {
      x: 0,
      y: 0,
      w: "100%", 
      h: "100%",
      fill: "1a1a1a",
      line: { width: 0 }
    })

    slide.addText("🎬", {
      x: "45%",
      y: "35%",
      w: "10%",
      h: "10%",
      fontSize: 72,
      align: "center",
    })

    slide.addText(`Video: ${item.name}`, {
      x: 1,
      y: "55%",
      w: "80%",
      h: 1,
      fontSize: 28,
      color: "FFFFFF",
      align: "center",
      fontFace: "Arial",
      bold: true,
    })
  }

  private addImagePlaceholder(slide: any, item: PresentationItem): void {
    slide.addShape(slide.shapes?.RECTANGLE || "rectangle", {
      x: 0,
      y: 0,
      w: "100%",
      h: "100%", 
      fill: "2a2a2a",
      line: { width: 0 }
    })

    slide.addText("🖼️", {
      x: "45%",
      y: "35%",
      w: "10%",
      h: "10%",
      fontSize: 72,
      align: "center",
    })

    slide.addText(`Image: ${item.name}`, {
      x: 1,
      y: "55%",
      w: "80%",
      h: 1,
      fontSize: 28,
      color: "FFFFFF",
      align: "center",
      fontFace: "Arial",
      bold: true,
    })
  }

  private async prepareVideoData(source: string): Promise<string> {
    if (source.startsWith("blob:")) {
      const response = await fetch(source)
      const blob = await response.blob()
      return await this.blobToBase64(blob)
    } else if (source.startsWith("http")) {
      const response = await fetch(source)
      const blob = await response.blob()
      return await this.blobToBase64(blob)
    }
    return source
  }

  private async prepareImageData(source: string): Promise<string> {
    if (source.startsWith("blob:")) {
      const response = await fetch(source)
      const blob = await response.blob()
      return await this.blobToBase64(blob)
    } else if (source.startsWith("http")) {
      const response = await fetch(source)
      const blob = await response.blob()
      return await this.blobToBase64(blob)
    }
    return source
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private generateDefaultLyrics(songName: string): string[] {
    return [
      `🎵 ${songName.toUpperCase()} 🎵`,
      "Verse 1:\n[Lyrics loaded from PowerPoint]",
      "Chorus:\n[Lyrics loaded from PowerPoint]",
      "Verse 2:\n[Lyrics loaded from PowerPoint]",
      "Bridge:\n[Lyrics loaded from PowerPoint]",
      "Final:\n[Lyrics loaded from PowerPoint]",
    ]
  }
}