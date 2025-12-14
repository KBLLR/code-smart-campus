
import wave
import struct
import math

sample_rate = 44100
duration = 1.0
num_samples = int(sample_rate * duration)

with wave.open('valid_test.wav', 'w') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    data = []
    for i in range(num_samples):
        value = int(32767.0 * math.sin(2 * math.pi * 440.0 * i / sample_rate))
        data.append(struct.pack('<h', value))
    wav_file.writeframes(b''.join(data))
print("Created valid_test.wav")
