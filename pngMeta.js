// pngMeta.js
// Handles PNG metadata encoding/decoding for Vitruvium character card
// (inspired by png-chunks-encode/extract)

// CRC32 is expected to be available globally from crc32.min.js
// If using a module bundler, you might need to configure it to expose CRC32 globally or import it differently.

// Helper to convert Data URL to Uint8Array
export function dataURLtoUint8Array(dataURL) {
    const base64 = dataURL.split(',')[1];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper to convert Uint8Array to Data URL
export function uint8ArrayToDataURL(uint8Array, mimeType) {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return `data:${mimeType};base64,` + btoa(binary);
}

// Function to extract chunks (simplified)
export function extractChunks(buffer) {
    const chunks = [];
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

        // Calculate CRC for type + data
        const crcBuffer = new Uint8Array(4 + data.length);
        const typeBytes = new TextEncoder().encode(type);
        crcBuffer.set(typeBytes, 0);
        crcBuffer.set(data, 4);
        const calculatedCrc = CRC32.buf(crcBuffer);

        if (crc !== calculatedCrc) {
            throw new Error(
                `PNG CRC mismatch for chunk ${type}. Expected ${calculatedCrc}, got ${crc}`,
            );
        }

        chunks.push({ name: type, data: data, length: length, crc: crc });
        offset += 12 + length; // 4 (length) + 4 (type) + length (data) + 4 (crc)
        if (type === 'IEND') break; // End of image
    }
    return chunks;
}

// Function to encode chunks (simplified)
export function encodeChunks(chunks) {
    // PNG signature
    const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    let totalLength = signature.length;
    chunks.forEach((chunk) => {
        totalLength += 12 + chunk.data.length; // length + type + data + crc
    });

    const outputBuffer = new Uint8Array(totalLength);
    let offset = 0;

    outputBuffer.set(signature, offset);
    offset += signature.length;

    chunks.forEach((chunk) => {
        // Length
        outputBuffer[offset++] = (chunk.data.length >>> 24) & 0xff;
        outputBuffer[offset++] = (chunk.data.length >>> 16) & 0xff;
        outputBuffer[offset++] = (chunk.data.length >>> 8) & 0xff;
        outputBuffer[offset++] = (chunk.data.length >>> 0) & 0xff;

        // Type
        const typeBytes = new TextEncoder().encode(chunk.name);
        outputBuffer.set(typeBytes, offset);
        offset += 4;

        // Data
        outputBuffer.set(chunk.data, offset);
        offset += chunk.data.length;

        // CRC (calculate for type + data)
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

/**
 * Creates a tEXt chunk with the given keyword and string data.
 */
export function createTextChunk(keyword, dataString) {
    const textData = keyword + '\0' + dataString;
    const textBytes = new TextEncoder().encode(textData);
    return {
        name: 'tEXt',
        data: textBytes,
        length: textBytes.length,
    };
}

/**
 * Extracts and parses JSON data from a tEXt chunk with the given keyword, if present.
 * Returns the parsed object or null if not found.
 */
export function extractJsonFromChunks(chunks, keyword) {
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
                        return null;
                    }
                }
            }
        }
    }
    return null;
}
