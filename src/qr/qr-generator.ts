// QR Code Generator for TypeScript
// Based on the original JavaScript implementation by Kazuhiko Arase

import { QRUtil, QRMath, QRRSBlock } from './qr-utils';

export class QRCodeGenerator {
  private typeNumber: number;
  private errorCorrectLevel: number;
  private modules: boolean[][] | null = null;
  private moduleCount: number = 0;
  private dataCache: number[] | null = null;
  private dataList: QR8BitByte[] = [];

  constructor(typeNumber: number, errorCorrectLevel: string) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel as keyof typeof QRErrorCorrectLevel];
  }

  addData(data: string): void {
    const newData = new QR8BitByte(data);
    this.dataList.push(newData);
    this.dataCache = null;
  }

  isDark(row: number, col: number): boolean {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(`${row},${col}`);
    }
    return this.modules![row][col];
  }

  getModuleCount(): number {
    return this.moduleCount;
  }

  make(): void {
    this.makeImpl(false, this.getBestMaskPattern());
  }

  private makeImpl(test: boolean, maskPattern: number): void {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = this.createModules(this.moduleCount);

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }

    if (this.dataCache == null) {
      this.dataCache = this.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }

    this.mapData(this.dataCache, maskPattern);
  }

  private createModules(moduleCount: number): boolean[][] {
    const modules = new Array(moduleCount);
    for (let row = 0; row < moduleCount; row += 1) {
      modules[row] = new Array(moduleCount);
      for (let col = 0; col < moduleCount; col += 1) {
        modules[row][col] = null as any;
      }
    }
    return modules;
  }

  private setupPositionProbePattern(row: number, col: number): void {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;

      for (let c = -1; c <= 7; c += 1) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;

        if (
          (0 <= r && r <= 6 && (c == 0 || c == 6)) ||
          (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules![row + r][col + c] = true;
        } else {
          this.modules![row + r][col + c] = false;
        }
      }
    }
  }

  private getBestMaskPattern(): number {
    let minLostPoint = 0;
    let pattern = 0;

    for (let i = 0; i < 8; i += 1) {
      this.makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(this);

      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }

    return pattern;
  }

  private setupTimingPattern(): void {
    for (let r = 8; r < this.moduleCount - 8; r += 1) {
      if (this.modules![r][6] != null) {
        continue;
      }
      this.modules![r][6] = r % 2 == 0;
    }

    for (let c = 8; c < this.moduleCount - 8; c += 1) {
      if (this.modules![6][c] != null) {
        continue;
      }
      this.modules![6][c] = c % 2 == 0;
    }
  }

  private setupPositionAdjustPattern(): void {
    const pos = QRUtil.getPatternPosition(this.typeNumber);

    for (let i = 0; i < pos.length; i += 1) {
      for (let j = 0; j < pos.length; j += 1) {
        const row = pos[i];
        const col = pos[j];

        if (this.modules![row][col] != null) {
          continue;
        }

        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            this.modules![row + r][col + c] =
              r == -2 ||
              r == 2 ||
              c == -2 ||
              c == 2 ||
              (r == 0 && c == 0);
          }
        }
      }
    }
  }

  private setupTypeNumber(test: boolean): void {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);

    for (let i = 0; i < 18; i += 1) {
      const mod = !test && ((bits >> i) & 1) == 1;
      this.modules![Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod;
    }

    for (let i = 0; i < 18; i += 1) {
      const mod = !test && ((bits >> i) & 1) == 1;
      this.modules![(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  private setupTypeInfo(test: boolean, maskPattern: number): void {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);

    for (let i = 0; i < 15; i += 1) {
      const mod = !test && ((bits >> i) & 1) == 1;

      // vertical then horizontal
      this.modules![i < 6 ? i : i < 8 ? i + 1 : this.moduleCount - 15 + i][8] = mod;
      this.modules![8][i < 8 ? this.moduleCount - i - 1 : i < 9 ? 15 - i : 14 - i] = mod;
    }

    // fixed module
    this.modules![this.moduleCount - 8][8] = !test;
  }

  private mapData(data: number[], maskPattern: number): void {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    const maskFunc = QRUtil.getMaskFunction(maskPattern);

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col -= 1;

      while (true) {
        for (let c = 0; c < 2; c += 1) {
          if (this.modules![row][col - c] == null) {
            let dark = false;

            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) == 1;
            }

            const mask = maskFunc(row, col - c);

            if (mask) {
              dark = !dark;
            }

            this.modules![row][col - c] = dark;
            bitIndex -= 1;

            if (bitIndex == -1) {
              byteIndex += 1;
              bitIndex = 7;
            }
          }
        }

        row += inc;

        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  private createBytes(buffer: QRBitBuffer, rsBlocks: QRRSBlock[]): number[] {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r += 1) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;

      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcdata[r] = new Array(dcCount);

      for (let i = 0; i < dcdata[r].length; i += 1) {
        dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
      }
      offset += dcCount;

      const rsPoly = this.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);

      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i += 1) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
      }
    }

    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalCodeCount += rsBlocks[i].totalCount;
    }

    const data = new Array(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < dcdata[r].length) {
          data[index] = dcdata[r][i];
          index += 1;
        }
      }
    }

    for (let i = 0; i < maxEcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < ecdata[r].length) {
          data[index] = ecdata[r][i];
          index += 1;
        }
      }
    }

    return data;
  }

  private getErrorCorrectPolynomial(errorCorrectLength: number): QRPolynomial {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i += 1) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  }

  private createData(typeNumber: number, errorCorrectLevel: number, dataList: QR8BitByte[]): number[] {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();

    for (let i = 0; i < dataList.length; i += 1) {
      const data = dataList[i];
      buffer.put(data.getMode(), 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
      data.write(buffer);
    }

    // calc num max data.
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalDataCount += rsBlocks[i].dataCount;
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error(
        'code length overflow. (' +
          buffer.getLengthInBits() +
          '>' +
          totalDataCount * 8 +
          ')'
      );
    }

    // end code
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }

    // padding
    while (buffer.getLengthInBits() % 8 != 0) {
      buffer.putBit(false);
    }

    // padding
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }
      buffer.put(0xec, 8);

      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }
      buffer.put(0x11, 8);
    }

    return this.createBytes(buffer, rsBlocks);
  }

  static stringToBytes(s: string): number[] {
    // UTF-8 version
    function toUTF8Array(str: string): number[] {
      const utf8: number[] = [];
      for (let i = 0; i < str.length; i++) {
        const charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(
            0xe0 | (charcode >> 12),
            0x80 | ((charcode >> 6) & 0x3f),
            0x80 | (charcode & 0x3f)
          );
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          const charcode2 =
            0x10000 +
            (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
          utf8.push(
            0xf0 | (charcode2 >> 18),
            0x80 | ((charcode2 >> 12) & 0x3f),
            0x80 | ((charcode2 >> 6) & 0x3f),
            0x80 | (charcode2 & 0x3f)
          );
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  }
}

export class QR8BitByte {
  private mode: number;
  private data: string;
  private bytes: number[];

  constructor(data: string) {
    this.mode = QRMode.MODE_8BIT_BYTE;
    this.data = data;
    this.bytes = QRCodeGenerator.stringToBytes(data);
  }

  getMode(): number {
    return this.mode;
  }

  getLength(): number {
    return this.bytes.length;
  }

  write(buffer: QRBitBuffer): void {
    for (let i = 0; i < this.bytes.length; i += 1) {
      buffer.put(this.bytes[i], 8);
    }
  }
}

export class QRBitBuffer {
  private buffer: number[] = [];
  private length: number = 0;

  getBuffer(): number[] {
    return this.buffer;
  }

  getAt(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) == 1;
  }

  put(num: number, length: number): void {
    for (let i = 0; i < length; i += 1) {
      this.putBit(((num >>> (length - i - 1)) & 1) == 1);
    }
  }

  getLengthInBits(): number {
    return this.length;
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }

    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
    }

    this.length += 1;
  }
}

export class QRPolynomial {
  private num: number[];

  constructor(num: number[], shift: number) {
    if (typeof num.length == 'undefined') {
      throw new Error(num.length + '/' + shift);
    }

    const offset = (() => {
      let offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      return offset;
    })();

    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i += 1) {
      this.num[i] = num[i + offset];
    }
  }

  getAt(index: number): number {
    return this.num[index];
  }

  getLength(): number {
    return this.num.length;
  }

  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1);

    for (let i = 0; i < this.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.getAt(i)) + QRMath.glog(e.getAt(j)));
      }
    }

    return new QRPolynomial(num, 0);
  }

  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) {
      return this;
    }

    const ratio = QRMath.glog(this.getAt(0)) - QRMath.glog(e.getAt(0));

    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i += 1) {
      num[i] = this.getAt(i);
    }

    for (let i = 0; i < e.getLength(); i += 1) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio);
    }

    // recursive call
    return new QRPolynomial(num, 0).mod(e);
  }
}

// Constants
export const QRMode = {
  MODE_8BIT_BYTE: 1 << 2,
} as const;

export const QRErrorCorrectLevel = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
} as const;

export const QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7,
} as const; 