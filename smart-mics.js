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
