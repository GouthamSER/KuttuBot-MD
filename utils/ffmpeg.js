/**
 * FFmpeg path resolver.
 * Order: FFMPEG_PATH env -> ffmpeg-static binary (if really on disk) -> system ffmpeg
 *        -> run ffmpeg-static's install.js once (newer npm blocks install scripts,
 *        so the binary is often missing) -> plain 'ffmpeg'.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

let cached = null;

const works = (bin) => {
  try {
    if (!bin) return false;
    if (path.isAbsolute(bin) && !fs.existsSync(bin)) return false;
    return spawnSync(bin, ['-version'], { timeout: 10000 }).status === 0;
  } catch { return false; }
};

const staticPath = () => {
  try { return require('ffmpeg-static'); } catch { return null; }
};

function resolveFFmpeg() {
  if (cached) return cached;

  if (process.env.FFMPEG_PATH && works(process.env.FFMPEG_PATH)) return (cached = process.env.FFMPEG_PATH);

  let sp = staticPath();
  if (works(sp)) return (cached = sp);

  if (works('ffmpeg')) return (cached = 'ffmpeg');

  // Binary missing because npm skipped ffmpeg-static's install script: run it ourselves.
  try {
    const installJs = require.resolve('ffmpeg-static/install.js');
    console.log('[ffmpeg] binary missing, downloading via ffmpeg-static/install.js ...');
    execFileSync(process.execPath, [installJs], { cwd: path.dirname(installJs), stdio: 'inherit', timeout: 180000 });
    sp = staticPath();
    if (works(sp)) {
      console.log('[ffmpeg] ready:', sp);
      return (cached = sp);
    }
  } catch (e) {
    console.error('[ffmpeg] auto-install failed:', e.message);
  }

  console.error('[ffmpeg] no working ffmpeg found. Install it, or set FFMPEG_PATH.');
  return (cached = 'ffmpeg');
}

module.exports = resolveFFmpeg();
module.exports.resolveFFmpeg = resolveFFmpeg;
