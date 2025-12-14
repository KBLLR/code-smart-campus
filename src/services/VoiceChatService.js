const DEFAULT_VOICE_API_URL = import.meta.env.VITE_VOICE_API_URL || 'http://localhost:7001/voice-chat';

export class VoiceChatService {
  constructor(baseUrl = DEFAULT_VOICE_API_URL) {
    this.baseUrl = baseUrl;
  }

  async sendAudio({ roomId, agentId, voiceId, audioBlob, chatModel = 'mlx-community/Jinx-gpt-oss-20b-mxfp4-mlx' }) {
    const formData = new FormData();
    formData.append('voice_id', voiceId || 'af_bella');
    // formData.append('room_id', roomId); // Metadata for context (optional)
    formData.append('audio', audioBlob, 'input.wav');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Voice API error: ${response.status}`);
    }

    return response.json();
  }
}
