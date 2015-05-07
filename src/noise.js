
/*
 * Plenty of help for this from
 * http://noisehack.com/generate-noise-web-audio-api/
 */

var noise = {};

noise.createWhite = function (audioCtx) {

    var bufferSize  = 2 * audioCtx.sampleRate,
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
        output      = noiseBuffer.getChannelData(0),
        i;

    for (i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    var whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);

    return whiteNoise;
};

noise.createPink = function (audioCtx) {
    // TODO make this actually white noise
    var white = noise.createWhite(audioCtx);
    return white;
};

noise.createBrown = function (audioCtx) {
    var white = noise.createWhite(audioCtx);
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value.set(100, audioCtx);
    white.connect(filter);
    return filter;
};

module.exports = noise;

