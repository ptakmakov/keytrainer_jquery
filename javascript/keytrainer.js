/* eslint-disable import/extensions */
import { backslash, Keyboard } from './keytrainer.keyboard.js';
import Stopwatch from './stopwatch.js';
import { resize, widthRatio } from './resize.js';

let keytrainer;
/**
 * Document elements selectors
 */
const patternSelector = '.keytrainer-pattern';
const keytrainerSelector = '.keytrainer';
const stopwatchSelector = '.stopwatch';
const speedSelector = '.speed';
const missprintsSelector = '.missprints';
const tipsSelector = '.tips';
/**
 * CSS classes, other CSS classes defined in json layout in first element of key array
 */
const highlightedCSS = 'highlighted';
const typeCSS = 'type';
const typedCSS = 'typed';
const etextCSS = 'e-text-c';
/**
* Default URLs
*/
const layoutJSON = '/json/en.json';
const tipsJSON = '/json/en.tips.json';
const patternJSON = '/node/pattern.js';
/**
 * Tips identificators
 */
const tipNewphrase = 'newphrase';
const tipMissprint = 'missprint';
const tipRandom = 'random';
/**
 * keyboardready event
 * @event keyboardready
 * @fires () assign keyboard.keys to keyitrainer.keys
 */
const keyboardready = document.createEvent('Event');
keyboardready.initEvent('keyboardready', true, true);
/**
 * patternready event
 * @event patternready
 * @fires Keytrainer.trackKey(e)
 */
const patternready = document.createEvent('Event');
patternready.initEvent('patternready', true, true);

document.addEventListener('keyboardready', () => {
    keytrainer.keys = keytrainer.keyboard.keys;
    keytrainer.stopwatch = new Stopwatch();
    keytrainer.stopwatch.delay = 5;
    keytrainer.stopwatch.format = 'mm:ss';
    keytrainer.stopwatch.stopwatchElement = keytrainer.stopwatchElement;
    keytrainer.stopwatch.speedmeterElement = keytrainer.speedmeterElement;
    keytrainer.getTips(tipsJSON, () => keytrainer.renderTip());
    keytrainer.getPattern(patternJSON, () => document.dispatchEvent(patternready));
});
document.addEventListener('patternready', () => {
    // eslint-disable-next-line no-undef
    $(window).on('keypress keydown keyup', (e) => keytrainer.trackKey(e));
    // eslint-disable-next-line no-undef
    $(window).on('resize', () => resize(window.innerWidth));
    // eslint-disable-next-line no-undef
    $(window).on('blur', () => keytrainer.freeKeys());
});
// eslint-disable-next-line no-undef
$(document).ready(
    () => {
        backslash.value = '\\';
        // prod
        // keytrainer = new Keytrainer();
        // dev
        // eslint-disable-next-line no-use-before-define
        window.keytrainer = new Keytrainer();
        keytrainer = window.keytrainer;
        keytrainer.keyboard = new Keyboard();
        keytrainer.keyboard.init(layoutJSON, () => document.dispatchEvent(keyboardready));
        widthRatio.value = 6.5;
        resize(window.innerWidth);
    },
);
/**
 * Object controls user input, compares it with pattern, counts
 * speed and mistakes, teaches for blind keyboard typing
 * @typedef Keytrainer
 * @returns {object} Keytrainer
 */
function Keytrainer() {
    const preventDefault = true;
    let missprints = 0;
    let stopwatchStarted = false;
    return {
        /**
         * jQuery object of keytrainer pattern HTML element
         * @property {object} patternElement
         */
        // eslint-disable-next-line no-undef
        patternElement: $(patternSelector),
        /**
         * jQuery object of keyitrainer user input HTML element
         * @property {object} keytrainerElement
         */
        // eslint-disable-next-line no-undef
        keytrainerElement: $(keytrainerSelector),
        /**
         * jQuery object of keytrainer stopwatch HTML element
         * @property {object} stopwatchElement
         */
        // eslint-disable-next-line no-undef
        stopwatchElement: $(stopwatchSelector),
        /**
         * jQuery object of keytrainer speedmeter HTML element
         * @property {object} speedmeterElement
         */
        // eslint-disable-next-line no-undef
        speedmeterElement: $(speedSelector),
        /**
         * jQuery object of keytrainer missprints HTML element
         * @property {object} missprintsElement
         */
        // eslint-disable-next-line no-undef
        missprintsElement: $(missprintsSelector),
        /**
         * jQuery object of keyitrainer tips HTML element
         * @property {object} tipsElement
         */
        // eslint-disable-next-line no-undef
        tipsElement: $(tipsSelector),
        /**
         * Keyboard object
         * @property {object} keyboard @see Keyboard
         */
        keyboard: null,
        /**
         * Stopwatch object
         * @property {object} stopwatch @see Stopwatch
         */
        stopwatch: null,
        /**
         * Keyboard keys
         * @property {Array({objects})} keys @see Keyboard.keys
         */
        keys: null,
        /**
         * Keytrainer pattern
         * @property {Array{objects}} pattern
         */
        pattern: null,
        /**
         * Current position of pattern last typed symbol
         * @property {number} position
         */
        position: 0,
        /**
         * Object with tips strings
         * @property {object} tips
         */
        tips: null,
        /**
         * Starts counting typing speed
         * @method startStopwatch
         */
        startStopwatch() {
            if (!stopwatchStarted) {
                this.stopwatch.reset();
                this.stopwatch.start();
                this.stopwatch.quantity = 0;
                stopwatchStarted = true;
            }
            this.stopwatch.quantity += 1;
        },
        /**
         * Unhighlight keytrainer pattern current char and print user input
         * Unhighlight keytrainer keyboard previous key
         * @method renderPatternCurrentChar
         * @param {string} input Pressed keyboard key value
         */
        renderPatternCurrentChar(input) {
            const patternItem = this.pattern[this.position];

            this.findKey(patternItem.char).highlightKey();
            patternItem.charElement
                .toggleClass(highlightedCSS)
                .toggleClass(typedCSS);
            if (patternItem.char === ' ') patternItem.charElement.html(' ');

            patternItem.input = input;
            patternItem.inputElement
                .html(
                    (input === ' ')
                        ? '&nbsp;'
                        : input,
                )
                .toggleClass(highlightedCSS);

            if (input !== patternItem.char) {
                patternItem.inputElement.toggleClass(etextCSS);
                missprints += 1;
                this.missprintsElement.html(String(missprints).padStart(2, '0'));
            }
        },
        /**
         * Highlight keytrainer pattern and input next char
         * Highlight keytrainer keyboard next key
         * @method renderPatternNextChar
         */
        renderPatternNextChar() {
            const patternItem = this.pattern[this.position];

            this.findKey(patternItem.char).highlightKey();

            if (patternItem.char === ' ') {
                patternItem.inputElement.text('_');
                patternItem.charElement.text('_');
            } else {
                patternItem.inputElement.text(patternItem.char);
            }

            patternItem.inputElement.toggleClass(highlightedCSS);
            patternItem.charElement
                .toggleClass(highlightedCSS)
                .toggleClass(typeCSS);
        },
        /**
         * Toggle key pressed when fires keyup event
         * Starts stopwatch and typing speed counter
         * Controls keytrainer pattern and input
         * @method keyDown
         * @param {object} key Key object @see {Key}
         * @param {string} input Pressed keyboard key value
         */
        keyDown(key, input) {
            if (!key.isDown) {
                if (this.position < this.pattern.length) {
                    this.startStopwatch();

                    if (!key.isSpecial || key.lowercaseKey === 'Space') {
                        this.renderPatternCurrentChar(input);
                        this.position += 1;

                        if (this.position < this.pattern.length) this.renderPatternNextChar();
                        else {
                            this.stopwatch.stop();
                            this.renderTip(tipNewphrase);
                            this.findKey(' ').highlightKey();
                        }
                    }
                } else if (input === ' ') {
                    this.getPattern(patternJSON, () => this.renderTip());
                    this.findKey(' ').highlightKey();
                }
                key.toggleKey();
            }
        },
        /**
         * Toggle key unpressed when fires keyup event
         * @method keyUp
         * @param {object} key Key object @see {Key}
         */
        keyUp(key) {
            if (key.isDown) {
                key.toggleKey();
            }
        },
        /**
         * Unpress all pressed keys for example when window focused out
         * @method freeKeys
         */
        freeKeys() {
            this.keys
                .filter((v) => v.isDown)
                .forEach((v) => v.toggleKey());
        },
        /**
         * Tracks events keydown, keypress, keyup
         * Controlls keyboard behavior
         * @method trackKey
         * @param {Event} e keyboard event
         */
        trackKey(e) {
            if (this.preventDefault) e.preventDefault();
            const key = this.findKey(e.key, e.code);
            if (!key) return;
            if (e.type === 'keydown') this.keyDown(key, e.key);
            if (e.type === 'keyup') this.keyUp(key);
        },
        /**
         * Get JSON from url and create pattern and keytrainer HTML elements
         * @method getPattern
         * @param {String} src URL to JSON whith keyboard layout
         * @param {Function} callback called when ready
         */
        getPattern(src, callback) {
            this.pattern = [];
            this.position = 0;
            this.patternElement.html('');
            this.keytrainerElement.html('');
            this.missprintsElement.html('00');
            this.renderTip();
            missprints = 0;
            this.stopwatch.stop();
            stopwatchStarted = false;
            // eslint-disable-next-line no-undef
            $.getJSON(src, (data) => {
                this.pattern = Array.from(data.pattern).map((c, i) => {
                    const isFirst = i === 0;
                    if (isFirst) this.findKey(c).highlightKey();
                    return {
                        char: c,
                        input: null,
                        // eslint-disable-next-line no-undef
                        charElement: $('<span/>')
                            .text(c)
                            .addClass((isFirst) ? highlightedCSS : typeCSS)
                            .appendTo(this.patternElement),
                        // eslint-disable-next-line no-undef
                        inputElement: $('<span/>')
                            .text((isFirst) ? c : null)
                            .addClass((isFirst) ? highlightedCSS : null)
                            .appendTo(this.keytrainerElement),
                    };
                });
                callback();
            });
        },
        /**
         * Load tips JSON for selected language
         * @method getTips
         * @param {sting} src URL to tips JSON
         * @param {function} callback callback function
         */
        getTips(src, callback) {
            // eslint-disable-next-line no-undef
            $.getJSON(src, (data) => {
                this.tips = data;
                callback();
            });
        },
        /**
         * Render tip from selected language based JSON
         * @method renderTip
         * @param {string} identifier Tips identifier in JSON
         */
        renderTip(identifier) {
            if (this.tips) {
                if (!identifier) {
                    const tips = this.tips[tipRandom];
                    this.tipsElement.html(tips[Math.random() * tips.length | 0]);
                }
                if (identifier) this.tipsElement.html(this.tips[identifier]);
                if (identifier === tipMissprint) this.tipsElement.addClass(etextCSS);
                else this.tipsElement.removeClass(etextCSS);
            }
        },
        /**
         * Search key by char or keyCode returned by event object
         * @param {string} char
         * @param {string} keyCode
         * @returns {object} Returns keyboard key object @see {Key}
         */
        findKey(char, keyCode) {
            if (this.keys) {
                return this.keys.filter(
                    (k) => ((k.isSpecial && char !== ' ')
                        ? k.lowercaseKey === keyCode
                        : k.lowercaseKey === char || k.uppercaseKey === char),
                )[0];
            }
            return null;
        },
        get preventDefault() { return preventDefault; },
    };
}
