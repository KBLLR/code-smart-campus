from kokoro import KPipeline  # import the pipeline class, not the module

# Initialize with your language‑code (e.g., 'a' for American English)
pipeline = KPipeline(lang_code='a')

# Generate audio using a chosen voice (like 'af_heart')
generator = pipeline(
    "This is a test sample.",
    voice="af_heart",
    speed=1.0,
    split_pattern=r'\n+'
)

# Iterate to get (graphemes, phonemes, audio array)
for i, (gs, ps, audio) in enumerate(generator):
    print(gs, ps)
    # Save with soundfile
    import soundfile as sf
    sf.write(f"sample_{i}.wav", audio, 24000)
