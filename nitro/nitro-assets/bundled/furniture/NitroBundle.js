"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NitroBundle = void 0;
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const pako_1 = require("pako");
const utils_1 = require("../utils");
class NitroBundle {
    constructor() {
        this._files = new Map();
    }
    static from(buffer) {
        const nitroBundle = new NitroBundle();
        const binaryReader = new utils_1.BinaryReader(buffer);
        let fileCount = binaryReader.readShort();
        while (fileCount > 0) {
            const fileNameLength = binaryReader.readShort();
            const fileName = binaryReader.readBytes(fileNameLength).toString();
            const fileLength = binaryReader.readInt();
            const buffer = binaryReader.readBytes(fileLength);
            const decompressed = (0, pako_1.inflate)(buffer.toArrayBuffer());
            nitroBundle.addFile(fileName, Buffer.from(decompressed.buffer));
            fileCount--;
        }
        return nitroBundle;
    }
    addFile(name, data) {
        this._files.set(name, data);
    }
    toBufferAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = new bytebuffer_1.default();
            buffer.writeUint16(this._files.size);
            for (const file of this._files.entries()) {
                const fileName = file[0];
                const fileBuffer = file[1];
                buffer.writeUint16(fileName.length);
                buffer.writeString(fileName);
                const compressed = (0, pako_1.deflate)(fileBuffer);
                buffer.writeUint32(compressed.length);
                buffer.append(compressed);
            }
            buffer.flip();
            return buffer.toBuffer();
        });
    }
    get files() {
        return this._files;
    }
    get totalFiles() {
        return this._files.size;
    }
}
exports.NitroBundle = NitroBundle;
