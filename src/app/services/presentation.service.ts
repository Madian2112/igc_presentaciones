import { Injectable } from "@angular/core"
import type { PresentationItem, ExportOptions } from "../models/presentation.model"
import { PowerpointGeneratorService } from "./powerpoint-generator.service"

@Injectable({
  providedIn: "root",
})
export class PresentationService {
  constructor(private powerPointGenerator: PowerpointGeneratorService) {}

  async generatePresentation(
    items: PresentationItem[],
    name: string,
    format: string,
    options: ExportOptions,
  ): Promise<void> {
    try {
      console.log("🔄 Starting presentation generation...")

      if (format === "pptx") {
        // Use real PowerPoint generation
        await this.powerPointGenerator.generatePowerPoint(items, name, options)
        console.log("✅ PowerPoint presentation generated successfully!")
      } else {
        // Fallback for other formats
        await this.generateFallbackFormat(items, name, format, options)
      }
    } catch (error) {
      console.error("❌ Presentation generation failed:", error)
      throw new Error(`Failed to generate presentation: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private calculateTotalSlides(items: PresentationItem[]): number {
    return items.reduce((total, item) => {
      return total + (item.slideCount || 1)
    }, 0)
  }

  private generatePDFContent(data: any): string {
    // Simulate PDF content generation
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${data.name}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private async generateFallbackFormat(
    items: PresentationItem[],
    name: string,
    format: string,
    options: ExportOptions,
  ): Promise<void> {
    const presentationData = {
      name: name,
      format: format,
      createdAt: new Date().toISOString(),
      totalSlides: this.calculateTotalSlides(items),
      items: items.map((item) => ({
        ...item,
        source: item.source.startsWith("blob:") ? `[Local File: ${item.name}]` : item.source,
      })),
      options: options,
      metadata: {
        generator: "Church Presentation Generator",
        version: "2.0.0",
        songs: items.filter((item) => item.type === "song").length,
        videos: items.filter((item) => item.type === "video").length,
        images: items.filter((item) => item.type === "image").length,
      },
    }

    let blob: Blob
    let filename: string

    switch (format) {
      case "pdf":
        blob = new Blob([this.generatePDFContent(presentationData)], {
          type: "application/pdf",
        })
        filename = `${name}.pdf`
        break
      default:
        blob = new Blob([JSON.stringify(presentationData, null, 2)], {
          type: "application/json",
        })
        filename = `${name}_config.json`
    }

    this.downloadFile(blob, filename)
  }
}
