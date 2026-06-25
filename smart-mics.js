class SmartMics {
    constructor(runtime) {
        this.runtime = runtime;
        this.lastSaid = "";
        this.listening = false;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = "en-US";

        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            this.lastSaid = result;
            console.log("Heard:", result);
        };

        this.recognition.onerror = (e) => {
            console.warn("Speech recognition error:", e);
        };
    }

    startListening() {
        if (!this.listening) {
            this.listening = true;
            this.recognition.start();
        }
    }

    stopListening() {
        if (this.listening) {
            this.listening = false;
            this.recognition.stop();
        }
    }

    getLastSaid() {
        return this.lastSaid;
    }

    said(text) {
        if (!text) return false;
        return this.lastSaid.includes(text.toLowerCase());
    }

    getInfo() {
        return {
            id: "smartmics",
            name: "Smart Mics",
            blocks: [
                {
                    opcode: "startListening",
                    blockType: "command",
                    text: "start listening"
                },
                {
                    opcode: "stopListening",
                    blockType: "command",
                    text: "stop listening"
                },
                {
                    opcode: "getLastSaid",
                    blockType: "reporter",
                    text: "last said"
                },
                {
                    opcode: "said",
                    blockType: "Boolean",
                    text: "said [TEXT]",
                    arguments: {
                        TEXT: {
                            type: "string",
                            defaultValue: "hello"
                        }
                    }
                }
            ]
        };
    }
}

Scratch.extensions.register(new SmartMics());
