export default class CsvParser {
    constructor() {
        this.defaultOptions = {
            delimiter: ',',
            quoteChar: '"',
            encoding: 'UTF-8'
        };
        this.worker = null;
    }

    createWorker() {
        const workerCode = `
let cancelled = false;

self.onmessage = (e) => {
  const message = e.data;

  if (message.type === 'cancel') {
    cancelled = true;
    return;
  }

  if (message.type === 'parse') {
    cancelled = false;
    try {
      const rows = parseCSVChunk(
        message.text,
        message.delimiter,
        message.quoteChar,
        message.chunkIndex,
        message.totalChunks
      );

      if (!cancelled) {
        self.postMessage({
          type: 'result',
          rows,
          chunkIndex: message.chunkIndex,
          isComplete: message.chunkIndex === message.totalChunks - 1
        });
      }
    } catch (error) {
      if (!cancelled) {
        self.postMessage({
          type: 'error',
          error: error.message || 'Unknown error'
        });
      }
    }
  }
};

function parseCSVChunk(text, delimiter, quoteChar, chunkIndex, totalChunks) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuote = false;

  text = text.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');

  for (let i = 0; i < text.length; i++) {
    if (i % 1000 === 0 && cancelled) {
      throw new Error('Parsing cancelled');
    }

    const char = text[i];
    const nextChar = text[i + 1];

    if (i % 50000 === 0) {
      const percent = Math.round(
        ((chunkIndex + i / text.length) / totalChunks) * 100
      );
      self.postMessage({
        type: 'progress',
        percent,
        rowsParsed: rows.length,
        chunkIndex
      });
    }

    if (char === quoteChar) {
      if (insideQuote && nextChar === quoteChar) {
        currentField += quoteChar;
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === delimiter && !insideQuote) {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\\n' && !insideQuote) {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return rows;
}
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
    }

    async parse(input, options = {}, signal, onProgress) {
        const config = { ...this.defaultOptions, ...options };

        if (signal?.aborted) {
            throw new DOMException('Parsing was aborted', 'AbortError');
        }

        this.worker = this.createWorker();

        return new Promise((resolve, reject) => {
            const rows = [];
            const CHUNK_SIZE = 1024 * 1024;

            this.worker.onmessage = (e) => {
                const message = e.data;

                if (message.type === 'progress') {
                    if (onProgress) {
                        onProgress({
                            percent: message.percent,
                            rowsParsed: message.rowsParsed
                        });
                    }
                } else if (message.type === 'result') {
                    rows.push(...message.rows);

                    if (message.isComplete) {
                        this.cleanup();
                        resolve(rows);
                    }
                } else if (message.type === 'error') {
                    this.cleanup();
                    reject(new Error(message.error));
                }
            };

            this.worker.onerror = (e) => {
                this.cleanup();
                reject(new Error('Worker error: ' + e.message));
            };

            if (signal) {
                signal.addEventListener('abort', () => {
                    if (this.worker) {
                        this.worker.postMessage({ type: 'cancel' });
                        this.cleanup();
                        reject(new DOMException('Parsing was aborted', 'AbortError'));
                    }
                });
            }

            try {
                if (input instanceof File) {
                    const totalChunks = Math.ceil(input.size / CHUNK_SIZE);
                    let offset = 0;
                    let chunkIndex = 0;

                    const readNextChunk = () => {
                        if (signal?.aborted) return;
                        if (offset >= input.size) return;

                        const chunk = input.slice(offset, offset + CHUNK_SIZE);
                        const reader = new FileReader();

                        reader.onload = (e) => {
                            if (signal?.aborted) return;
                            const text = e.target.result;

                            this.worker.postMessage({
                                type: 'parse',
                                text,
                                delimiter: config.delimiter || ',',
                                quoteChar: config.quoteChar || '"',
                                chunkIndex,
                                totalChunks
                            });

                            offset += CHUNK_SIZE;
                            chunkIndex++;
                            readNextChunk();
                        };

                        reader.onerror = (e) => {
                            this.cleanup();
                            reject(e);
                        };

                        reader.readAsText(chunk, config.encoding);
                    };

                    readNextChunk();
                } else {
                    this.worker.postMessage({
                        type: 'parse',
                        text: input,
                        delimiter: config.delimiter || ',',
                        quoteChar: config.quoteChar || '"',
                        chunkIndex: 0,
                        totalChunks: 1
                    });
                }
            } catch (err) {
                this.cleanup();
                reject(err);
            }
        });
    }

    cleanup() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
