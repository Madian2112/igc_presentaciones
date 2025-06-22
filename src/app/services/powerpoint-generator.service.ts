import { Injectable } from '@angular/core';
import { PresentationItem } from '../models/presentation-item.model';
import { ExportOptions } from '../models/presentation.model';
import * as PptxGenJS from 'pptxgenjs';

@Injectable({
  providedIn: 'root'
})
export class PowerpointGeneratorService {
  async generatePowerPoint(items: PresentationItem[], name: string, options: ExportOptions): Promise<void> {
    try {
      console.log("🔄 Starting PowerPoint generation...")

      // Initialize PptxGenJS
      const pptx = new PptxGenJS.default()

      // Set presentation properties
      this.configurePresentationSettings(pptx, name, options)

      // Process each presentation item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        console.log(`📄 Processing item ${i + 1}/${items.length}: ${item.name}`)

        try {
          await this.processItem(pptx, item, options)
        } catch (error) {
          console.warn(`⚠️ Failed to process item "${item.name}":`, error)
          // Add error slide instead of failing completely
          this.addErrorSlide(pptx, item, error as Error)
        }
      }

      // Add title slide
      this.addTitleSlide(pptx, name, items.length)

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
    // Set slide size
    const slideSize = options.slideSize === "4:3" ? "LAYOUT_4x3" : "LAYOUT_16x9"
    pptx.defineLayout({
      name: "CUSTOM",
      width: slideSize === "LAYOUT_4x3" ? 10 : 13.33,
      height: slideSize === "LAYOUT_4x3" ? 7.5 : 7.5,
    })
    pptx.layout = "CUSTOM"

    // Set presentation metadata
    pptx.author = "Church Presentation Studio"
    pptx.company = "Church Ministry"
    pptx.subject = name
    pptx.title = name

    // Configure default styles
    pptx.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "000000" },
      objects: [
        {
          text: {
            text: "Church Presentation",
            options: {
              x: 0.5,
              y: 0.2,
              w: "90%",
              h: 0.5,
              fontSize: 12,
              color: "FFFFFF",
              align: "center",
              fontFace: "Arial",
            },
          },
        },
      ],
    })
  }

  private async processItem(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    switch (item.type) {
      case "song":
        await this.addSongSlides(pptx, item, options)
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

  private async addSongSlides(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    const lyrics = item.metadata?.originalSong?.lyrics || this.generateDefaultLyrics(item.name)

    for (let i = 0; i < lyrics.length; i++) {
      const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

      // Add background
      slide.background = { color: "1a1a2e" }

      // Add lyrics text
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

      // Add slide number
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

      // Add transitions if enabled
      if (options.includeTransitions) {
        slide.transition = { type: "fade", duration: 1000 }
      }
    }
  }

  private async addVideoSlide(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

    // Set black background for video
    slide.background = { color: "000000" }

    try {
      // Add video - scale to fill entire slide
      const videoData = await this.prepareVideoData(item.source)

      slide.addMedia({
        type: "video",
        data: videoData,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
        cover: item.thumbnail || undefined,
      })

      // Add video title overlay
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
      // Add placeholder instead
      this.addVideoPlaceholder(slide, item)
    }
  }

  private async addImageSlide(pptx: any, item: PresentationItem, options: ExportOptions): Promise<void> {
    const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

    try {
      // Prepare image data
      const imageData = await this.prepareImageData(item.source)

      // Add image - scale to fill entire slide while maintaining aspect ratio
      slide.addImage({
        data: imageData,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
        sizing: {
          type: "cover", // This ensures the image covers the entire slide
          w: "100%",
          h: "100%",
        },
      })

      // Add image title overlay if needed
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
      // Add placeholder instead
      this.addImagePlaceholder(slide, item)
    }
  }

  private addTitleSlide(pptx: any, presentationName: string, itemCount: number): void {
    const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

    // Add gradient background
    slide.background = {
      fill: {
        type: "gradient",
        colors: [
          { color: "1a1a2e", position: 0 },
          { color: "16213e", position: 50 },
          { color: "0f3460", position: 100 },
        ],
        angle: 45,
      },
    }

    // Add main title
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

    // Add subtitle
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

    // Add date
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
    const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" })

    slide.background = { color: "2c1810" }

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
    slide.background = { color: "1a1a1a" }

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

    slide.addText("Video will be embedded when available", {
      x: 1,
      y: "65%",
      w: "80%",
      h: 0.8,
      fontSize: 18,
      color: "CCCCCC",
      align: "center",
      fontFace: "Arial",
    })
  }

  private addImagePlaceholder(slide: any, item: PresentationItem): void {
    slide.background = { color: "2a2a2a" }

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
      // Convert blob URL to base64
      const response = await fetch(source)
      const blob = await response.blob()
      return await this.blobToBase64(blob)
    } else if (source.startsWith("http")) {
      // For external URLs, we'll need to download and convert
      const response = await fetch(source)
      const blob = await response.blob()
      return await this.blobToBase64(blob)
    }
    return source
  }

  private async prepareImageData(source: string): Promise<string> {
    if (source.startsWith("blob:")) {
      // Convert blob URL to base64
      const response = await fetch(source)
      const blob = await response.blob()
      return await this.blobToBase64(blob)
    } else if (source.startsWith("http")) {
      // For external URLs, we'll need to download and convert
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
