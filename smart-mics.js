class SmartMics {
    constructor(runtime) {
        this.runtime = runtime;
        this.lastSaid = "";
        this.listening = false;

        // cooldown settings
        this.cooldownMode = "global"; // "global" or "per-phrase"
        this.globalCooldownMs = 0;
        this.perPhraseCooldownMs = 0;
        this.lastGlobalTrigger = 0;
        this.lastPhraseTriggers = {};

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = "en-US";

        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            this.lastSaid = result;
            console.log("Heard:", result);

            const now = Date.now();
            let allowed = true;

            // global cooldown
            if (this.cooldownMode === "global" && this.globalCooldownMs > 0) {
                if (now - this.lastGlobalTrigger < this.globalCooldownMs) {
                    allowed = false;
                } else {
                    this.lastGlobalTrigger = now;
                }
            }

            // per-phrase cooldown
            if (this.cooldownMode === "per-phrase" && this.perPhraseCooldownMs > 0) {
                const last = this.lastPhraseTriggers[result] || 0;
                if (now - last < this.perPhraseCooldownMs) {
                    allowed = false;
                } else {
                    this.lastPhraseTriggers[result] = now;
                }
            }

            if (!allowed) return;

            // trigger hats
            this.runtime.startHats("smartmics_whenSaidText");
            this.runtime.startHats("smartmics_whenSaidAnyWord");
            this.runtime.startHats("smartmics_whenSaidAllWords");
            this.runtime.startHats("smartmics_whenSaidExact");
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

    said(text, mode) {
        if (typeof text !== "string") text = String(text);
        text = text.toLowerCase();

        if (mode === "exact") {
            return this.lastSaid === text;
        }

        // default: contains
        return this.lastSaid.includes(text);
    }

    // cooldown command
    setCooldown(args) {
        let seconds = Number(args.SECONDS);
        if (!isFinite(seconds) || seconds < 0) seconds = 0;
        const ms = seconds * 1000;

        if (args.MODE === "per-phrase") {
            this.cooldownMode = "per-phrase";
            this.perPhraseCooldownMs = ms;
        } else {
            this.cooldownMode = "global";
            this.globalCooldownMs = ms;
        }
    }

    // helper: parse word list
    _parseWords(input) {
        let s = input;
        if (Array.isArray(s)) {
            s = s.join(" ");
        }
        if (typeof s !== "string") s = String(s);
        s = s.toLowerCase();
        return s
            .split(/[\s,]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);
    }

    // hat: when said [TEXT] (contains
        // hat: when said [TEXT] (contains)
    whenSaidText(args) {
        if (typeof args.TEXT !== "string") args.TEXT = String(args.TEXT);
        const text = args.TEXT.toLowerCase();
        return this.lastSaid.includes(text);
    }

    whenSaidAnyWord(args) {
        const words = this._parseWords(args.LIST);
        if (!words.length) return false;
        for (const w of words) {
            if (this.lastSaid.includes(w)) return true;
        }
        return false;
    }

    whenSaidAllWords(args) {
        const words = this._parseWords(args.LIST);
        if (!words.length) return false;
        for (const w of words) {
            if (!this.lastSaid.includes(w)) return false;
        }
        return true;
    }

    whenSaidExact(args) {
        if (typeof args.TEXT !== "string") args.TEXT = String(args.TEXT);
        const text = args.TEXT.toLowerCase();
        return this.lastSaid === text;
    }

    getInfo() {
        return {
            id: "smartmics",
            name: "Smart Mics",
            blocks: [
                { opcode: "startListening", blockType: "command", text: "start listening" },
                { opcode: "stopListening", blockType: "command", text: "stop listening" },
                { opcode: "getLastSaid", blockType: "reporter", text: "last said" },
                {
                    opcode: "said",
                    blockType: "Boolean",
                    text: "said [TEXT] using [MODE]",
                    arguments: {
                        TEXT: { type: "string", defaultValue: "hello" },
                        MODE: { type: "string", menu: "matchMode" }
                    }
                },
                {
                    opcode: "setCooldown",
                    blockType: "command",
                    text: "set speech cooldown to [SECONDS] seconds using [MODE]",
                    arguments: {
                        SECONDS: { type: "number", defaultValue: 0.5 },
                        MODE: { type: "string", menu: "cooldownMode" }
                    }
                },
                {
                    opcode: "whenSaidText",
                    blockType: "hat",
                    text: "when said [TEXT]",
                    arguments: { TEXT: { type: "string", defaultValue: "hello" } }
                },
                {
                    opcode: "whenSaidAnyWord",
                    blockType: "hat",
                    text: "when said any word in [LIST]",
                    arguments: { LIST: { type: "string", defaultValue: "start, go, hello" } }
                },
                {
                    opcode: "whenSaidAllWords",
                    blockType: "hat",
                    text: "when said all words in [LIST]",
                    arguments: { LIST: { type: "string", defaultValue: "turn on" } }
                },
                {
                    opcode: "whenSaidExact",
                    blockType: "hat",
                    text: "when said exact phrase [TEXT]",
                    arguments: { TEXT: { type: "string", defaultValue: "open door" } }
                }
            ],
            menus: {
                matchMode: { acceptReporters: true, items: ["contains", "exact"] },
                cooldownMode: { acceptReporters: true, items: ["global", "per-phrase"] }
            }
        };
    }
}

Scratch.extensions.register(new SmartMics());
