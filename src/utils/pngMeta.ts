import CRC32 from 'crc-32';

export interface Chunk {
    name: string;
    data: Uint8Array;
    length: number;
    crc: number;
}

export interface TextChunk {
    name: string;
    data: Uint8Array;
    length: number;
}

export function dataURLtoUint8Array(dataURL: string): Uint8Array {
    const base64 = dataURL.split(',')[1];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function uint8ArrayToDataURL(uint8Array: Uint8Array, mimeType: string): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return `data:${mimeType};base64,` + btoa(binary);
}

export function extractChunks(buffer: Uint8Array): Chunk[] {
    const chunks: Chunk[] = [];
    let offset = 8; // Skip PNG signature

    while (offset < buffer.length) {
        const length =
            (buffer[offset] << 24) |
            (buffer[offset + 1] << 16) |
            (buffer[offset + 2] << 8) |
            buffer[offset + 3];

        const type = String.fromCharCode(
            buffer[offset + 4],
            buffer[offset + 5],
            buffer[offset + 6],
            buffer[offset + 7],
        );
        const data = buffer.slice(offset + 8, offset + 8 + length);
        const crc =
            (buffer[offset + 8 + length] << 24) |
            (buffer[offset + 8 + length + 1] << 16) |
            (buffer[offset + 8 + length + 2] << 8) |
            buffer[offset + 8 + length + 3];

        const crcBuffer = new Uint8Array(4 + data.length);
        const typeBytes = new TextEncoder().encode(type);
        crcBuffer.set(typeBytes, 0);
        crcBuffer.set(data, 4);
        const calculatedCrc = CRC32.buf(crcBuffer);

        if (crc !== calculatedCrc) {
            console.warn(
                `PNG CRC mismatch for chunk ${type}. Expected ${calculatedCrc}, got ${crc}`,
            );
        }

        chunks.push({ name: type, data: data, length: length, crc: crc });
        offset += 12 + length;
        if (type === 'IEND') break;
    }
    return chunks;
}

export function encodeChunks(chunks: Chunk[]): Uint8Array {
    const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    let totalLength = signature.length;
    chunks.forEach((chunk) => {
        totalLength += 12 + chunk.data.length;
    });

    const outputBuffer = new Uint8Array(totalLength);
    let offset = 0;

    outputBuffer.set(signature, offset);
    offset += signature.length;

    chunks.forEach((chunk) => {
        outputBuffer[offset++] = (chunk.data.length >>> 24) & 0xff;
        outputBuffer[offset++] = (chunk.data.length >>> 16) & 0xff;
        outputBuffer[offset++] = (chunk.data.length >>> 8) & 0xff;
        outputBuffer[offset++] = (chunk.data.length >>> 0) & 0xff;

        const typeBytes = new TextEncoder().encode(chunk.name);
        outputBuffer.set(typeBytes, offset);
        offset += 4;

        outputBuffer.set(chunk.data, offset);
        offset += chunk.data.length;

        const crcBuffer = new Uint8Array(4 + chunk.data.length);
        crcBuffer.set(typeBytes, 0);
        crcBuffer.set(chunk.data, 4);
        const calculatedCrc = CRC32.buf(crcBuffer);

        outputBuffer[offset++] = (calculatedCrc >>> 24) & 0xff;
        outputBuffer[offset++] = (calculatedCrc >>> 16) & 0xff;
        outputBuffer[offset++] = (calculatedCrc >>> 8) & 0xff;
        outputBuffer[offset++] = (calculatedCrc >>> 0) & 0xff;
    });

    return outputBuffer;
}

export function createTextChunk(keyword: string, dataString: string): TextChunk {
    const textData = keyword + '\0' + dataString;
    const textBytes = new TextEncoder().encode(textData);
    return {
        name: 'tEXt',
        data: textBytes,
        length: textBytes.length,
    };
}

export function extractJsonFromChunks(chunks: Chunk[], keyword: string): any | null {
    for (const chunk of chunks) {
        if (chunk.name === 'tEXt') {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(chunk.data);
            const nullSeparatorIndex = text.indexOf('\0');
            if (nullSeparatorIndex !== -1) {
                const foundKeyword = text.substring(0, nullSeparatorIndex);
                if (foundKeyword === keyword) {
                    const jsonDataString = text.substring(nullSeparatorIndex + 1);
                    try {
                        return JSON.parse(jsonDataString);
                    } catch (e) {
                        console.error('Failed to parse JSON from tEXt chunk:', e);
                        return null;
                    }
                }
            }
        }
    }
    return null;
}
