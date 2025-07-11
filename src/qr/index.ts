// QR Code Generator for TypeScript
// Based on the original JavaScript implementation by Kazuhiko Arase
// Modernized with ES6 syntax and TypeScript types

import { QRCodeGenerator } from './qr-generator'

export interface QRCodeConfig {
  text: string
  size?: number
  fill?: string | GradientFill
  background?: string | null
  ecLevel?: 'L' | 'M' | 'Q' | 'H'
  minVersion?: number
  maxVersion?: number
  radius?: number
  quiet?: number
  left?: number
  top?: number
}

export interface GradientFill {
  type: 'linear-gradient' | 'radial-gradient'
  position: number[]
  colorStops: [number, string][]
}

export interface QRCode {
  text: string
  level: string
  version: number
  moduleCount: number
  isDark: (row: number, col: number) => boolean
}

export class QR {
  static render(
    config: QRCodeConfig,
    element: HTMLElement | HTMLCanvasElement,
  ): void {
    const settings = this.getDefaultSettings(config)

    if (element instanceof HTMLCanvasElement) {
      this.renderToCanvas(element, settings)
    } else {
      const canvas = this.createCanvas(settings)
      element.appendChild(canvas)
    }
  }

  private static getDefaultSettings(config: QRCodeConfig) {
    return {
      minVersion: 1,
      maxVersion: 40,
      ecLevel: 'L' as const,
      left: 0,
      top: 0,
      size: 200,
      fill: '#000',
      background: null,
      radius: 0.5,
      quiet: 0,
      ...config,
    }
  }

  private static createQRCode(
    text: string,
    level: string,
    version: number,
    quiet: number,
  ): QRCode | null {
    try {
      const qr = new QRCodeGenerator(version, level)
      qr.addData(text)
      qr.make()

      const qrModuleCount = qr.getModuleCount()
      const quietModuleCount = qrModuleCount + 2 * quiet

      const isDark = (row: number, col: number): boolean => {
        row -= quiet
        col -= quiet

        if (
          row < 0 ||
          row >= qrModuleCount ||
          col < 0 ||
          col >= qrModuleCount
        ) {
          return false
        }
        return qr.isDark(row, col)
      }

      return {
        text,
        level,
        version,
        moduleCount: quietModuleCount,
        isDark,
      }
    } catch {
      return null
    }
  }

  private static createMinQRCode(
    text: string,
    level: string,
    minVersion: number,
    maxVersion: number,
    quiet: number,
  ): QRCode | null {
    minVersion = Math.max(1, minVersion)
    maxVersion = Math.min(40, maxVersion)

    for (let version = minVersion; version <= maxVersion; version++) {
      const qr = this.createQRCode(text, level, version, quiet)
      if (qr) return qr
    }
    return null
  }

  private static drawBackground(
    qr: QRCode,
    context: CanvasRenderingContext2D,
    settings: any,
  ): void {
    if (settings.background) {
      context.fillStyle = settings.background
      context.fillRect(
        settings.left,
        settings.top,
        settings.size,
        settings.size,
      )
    }
  }

  private static drawModuleRoundedDark(
    ctx: CanvasRenderingContext2D,
    l: number,
    t: number,
    r: number,
    b: number,
    rad: number,
    nw: boolean,
    ne: boolean,
    se: boolean,
    sw: boolean,
  ): void {
    if (nw) {
      ctx.moveTo(l + rad, t)
    } else {
      ctx.moveTo(l, t)
    }

    const lal = (
      b: boolean,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      r0: number,
      r1: number,
    ) => {
      if (b) {
        ctx.lineTo(x0 + r0, y0 + r1)
        ctx.arcTo(x0, y0, x1, y1, rad)
      } else {
        ctx.lineTo(x0, y0)
      }
    }

    lal(ne, r, t, r, b, -rad, 0)
    lal(se, r, b, l, b, 0, -rad)
    lal(sw, l, b, l, t, rad, 0)
    lal(nw, l, t, r, t, 0, rad)
  }

  private static drawModuleRoundedLight(
    ctx: CanvasRenderingContext2D,
    l: number,
    t: number,
    r: number,
    b: number,
    rad: number,
    nw: boolean,
    ne: boolean,
    se: boolean,
    sw: boolean,
  ): void {
    const mlla = (x: number, y: number, r0: number, r1: number) => {
      ctx.moveTo(x + r0, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + r1)
      ctx.arcTo(x, y, x + r0, y, rad)
    }

    if (nw) mlla(l, t, rad, rad)
    if (ne) mlla(r, t, -rad, rad)
    if (se) mlla(r, b, -rad, -rad)
    if (sw) mlla(l, b, rad, -rad)
  }

  private static drawModuleRounded(
    qr: QRCode,
    context: CanvasRenderingContext2D,
    settings: any,
    left: number,
    top: number,
    width: number,
    row: number,
    col: number,
  ): void {
    const isDark = qr.isDark
    const right = left + width
    const bottom = top + width
    const rowT = row - 1
    const rowB = row + 1
    const colL = col - 1
    const colR = col + 1
    const radius = Math.floor(
      Math.min(0.5, Math.max(0, settings.radius)) * width,
    )
    const center = isDark(row, col)
    const northwest = isDark(rowT, colL)
    const north = isDark(rowT, col)
    const northeast = isDark(rowT, colR)
    const east = isDark(row, colR)
    const southeast = isDark(rowB, colR)
    const south = isDark(rowB, col)
    const southwest = isDark(rowB, colL)
    const west = isDark(row, colL)

    const leftRounded = Math.round(left)
    const topRounded = Math.round(top)
    const rightRounded = Math.round(right)
    const bottomRounded = Math.round(bottom)

    if (center) {
      this.drawModuleRoundedDark(
        context,
        leftRounded,
        topRounded,
        rightRounded,
        bottomRounded,
        radius,
        !north && !west,
        !north && !east,
        !south && !east,
        !south && !west,
      )
    } else {
      this.drawModuleRoundedLight(
        context,
        leftRounded,
        topRounded,
        rightRounded,
        bottomRounded,
        radius,
        north && west && northwest,
        north && east && northeast,
        south && east && southeast,
        south && west && southwest,
      )
    }
  }

  private static drawModules(
    qr: QRCode,
    context: CanvasRenderingContext2D,
    settings: any,
  ): void {
    const moduleCount = qr.moduleCount
    const moduleSize = settings.size / moduleCount

    context.beginPath()
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const l = settings.left + col * moduleSize
        const t = settings.top + row * moduleSize
        const w = moduleSize

        this.drawModuleRounded(qr, context, settings, l, t, w, row, col)
      }
    }

    this.setFill(context, settings)
    context.fill()
  }

  private static setFill(
    context: CanvasRenderingContext2D,
    settings: any,
  ): void {
    const fill = settings.fill
    if (typeof fill === 'string') {
      context.fillStyle = fill
      return
    }

    const type = fill.type
    const position = fill.position
    const colorStops = fill.colorStops
    let gradient: CanvasGradient

    const absolutePosition = position.map((coordinate: number) =>
      Math.round(coordinate * settings.size),
    )

    if (type === 'linear-gradient') {
      gradient = context.createLinearGradient(
        absolutePosition[0],
        absolutePosition[1],
        absolutePosition[2],
        absolutePosition[3],
      )
    } else if (type === 'radial-gradient') {
      gradient = context.createRadialGradient(
        absolutePosition[0],
        absolutePosition[1],
        absolutePosition[2],
        absolutePosition[3],
        absolutePosition[4],
        absolutePosition[5],
      )
    } else {
      throw new Error('Unsupported fill')
    }

    colorStops.forEach(([offset, color]: [number, string]) => {
      gradient.addColorStop(offset, color)
    })

    context.fillStyle = gradient
  }

  private static drawOnCanvas(
    canvas: HTMLCanvasElement,
    settings: any,
  ): HTMLCanvasElement | null {
    const qr = this.createMinQRCode(
      settings.text,
      settings.ecLevel,
      settings.minVersion,
      settings.maxVersion,
      settings.quiet,
    )

    if (!qr) {
      return null
    }

    const context = canvas.getContext('2d')!
    this.drawBackground(qr, context, settings)
    this.drawModules(qr, context, settings)

    return canvas
  }

  private static createCanvas(settings: any): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = settings.size
    canvas.height = settings.size
    return this.drawOnCanvas(canvas, settings) || canvas
  }

  private static renderToCanvas(
    canvas: HTMLCanvasElement,
    settings: any,
  ): void {
    if (canvas.width !== settings.size || canvas.height !== settings.size) {
      canvas.width = settings.size
      canvas.height = settings.size
    }

    const context = canvas.getContext('2d')!
    context.clearRect(0, 0, canvas.width, canvas.height)
    this.drawOnCanvas(canvas, settings)
  }
}

// Default export for standalone usage
export default QR
