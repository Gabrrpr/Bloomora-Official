// Unlock from the Generate click so the asynchronous completion can chime.
let context

export function prepareGenerationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    if (!context || context.state === "closed") context = new AudioContext()
    if (context.state === "suspended") void context.resume().catch(() => {})
  } catch {
    // Sound is optional; unavailable audio must never block generation.
  }
}

export function playGenerationSound() {
  try {
    if (!context || context.state !== "running") return
    const start = context.currentTime
    for (const [offset, frequency] of [[0, 660], [0.16, 880]]) {
      const oscillator = context.createOscillator()
      const volume = context.createGain()
      oscillator.type = "sine"
      oscillator.frequency.value = frequency
      volume.gain.setValueAtTime(0, start + offset)
      volume.gain.linearRampToValueAtTime(0.09, start + offset + 0.015)
      volume.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.38)
      oscillator.connect(volume)
      volume.connect(context.destination)
      oscillator.onended = () => { oscillator.disconnect(); volume.disconnect() }
      oscillator.start(start + offset)
      oscillator.stop(start + offset + 0.4)
    }
  } catch {
    // Keep a successful preview usable even when audio is blocked.
  }
}
