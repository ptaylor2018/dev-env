"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultSize = 8192;
const ContentLength = 'Content-Length: ';
const ContentLengthSize = Buffer.byteLength(ContentLength, 'utf8');
const Blank = new Buffer(' ', 'utf8')[0];
const BackslashR = new Buffer('\r', 'utf8')[0];
const BackslashN = new Buffer('\n', 'utf8')[0];
class ProtocolBuffer {
    constructor() {
        this.index = 0;
        this.buffer = new Buffer(DefaultSize);
    }
    append(data) {
        let toAppend = null;
        if (Buffer.isBuffer(data)) {
            toAppend = data;
        }
        else {
            toAppend = new Buffer(data, 'utf8');
        }
        if (this.buffer.length - this.index >= toAppend.length) {
            toAppend.copy(this.buffer, this.index, 0, toAppend.length);
        }
        else {
            let newSize = (Math.ceil((this.index + toAppend.length) / DefaultSize) + 1) * DefaultSize;
            if (this.index === 0) {
                this.buffer = new Buffer(newSize);
                toAppend.copy(this.buffer, 0, 0, toAppend.length);
            }
            else {
                this.buffer = Buffer.concat([this.buffer.slice(0, this.index), toAppend], newSize);
            }
        }
        this.index += toAppend.length;
    }
    tryReadContentLength() {
        let result = -1;
        let current = 0;
        // we are utf8 encoding...
        while (current < this.index && (this.buffer[current] === Blank || this.buffer[current] === BackslashR || this.buffer[current] === BackslashN)) {
            current++;
        }
        if (this.index < current + ContentLengthSize) {
            return result;
        }
        current += ContentLengthSize;
        let start = current;
        while (current < this.index && this.buffer[current] !== BackslashR) {
            current++;
        }
        if (current + 3 >= this.index || this.buffer[current + 1] !== BackslashN || this.buffer[current + 2] !== BackslashR || this.buffer[current + 3] !== BackslashN) {
            return result;
        }
        let data = this.buffer.toString('utf8', start, current);
        result = parseInt(data);
        this.buffer = this.buffer.slice(current + 4);
        this.index = this.index - (current + 4);
        return result;
    }
    tryReadContent(length) {
        if (this.index < length) {
            return null;
        }
        let result = this.buffer.toString('utf8', 0, length);
        let sourceStart = length;
        while (sourceStart < this.index && (this.buffer[sourceStart] === BackslashR || this.buffer[sourceStart] === BackslashN)) {
            sourceStart++;
        }
        this.buffer.copy(this.buffer, 0, sourceStart);
        this.index = this.index - sourceStart;
        return result;
    }
}
class Reader {
    constructor(readable, callback, onError = () => ({})) {
        this.onError = onError;
        this.readable = readable;
        this.buffer = new ProtocolBuffer();
        this.callback = callback;
        this.nextMessageLength = -1;
        this.readable.on('data', (data) => {
            this.onLengthData(data);
        });
    }
    onLengthData(data) {
        try {
            this.buffer.append(data);
            while (true) {
                if (this.nextMessageLength === -1) {
                    this.nextMessageLength = this.buffer.tryReadContentLength();
                    if (this.nextMessageLength === -1) {
                        return;
                    }
                }
                const msg = this.buffer.tryReadContent(this.nextMessageLength);
                if (msg === null) {
                    return;
                }
                this.nextMessageLength = -1;
                const json = JSON.parse(msg);
                this.callback(json);
            }
        }
        catch (e) {
            this.onError(e);
        }
    }
}
exports.Reader = Reader;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/41abd21afdf7424c89319ee7cb0445cc6f376959/extensions\typescript\out/utils\wireProtocol.js.map
