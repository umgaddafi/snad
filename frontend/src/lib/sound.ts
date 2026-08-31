// Voice Notification & Sound Helper using Web Speech Synthesis (Female Voice) and Web Audio API

export const playFemaleVoiceNotification = (text: string) => {
  try {
    // 1. Play soft audio chime first
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }

    // 2. Speak message in clear natural human female voice
    if ('speechSynthesis' in window) {
      // Cancel previous utterances to avoid queuing delay
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0; // natural pace
      utterance.pitch = 1.2; // warm female pitch inflection

      const voices = window.speechSynthesis.getVoices();
      // Find female English voice
      const femaleVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('google us english') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('jenny'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      // Small delay after chime before speaking
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 150);
    }
  } catch (e) {
    console.error('Audio notification play failed:', e);
  }
};
