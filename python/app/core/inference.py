import onnxruntime_genai as og
import logging

logger = logging.getLogger(__name__)

class Phi4MiniEngine:
    def __init__(self, model_path: str):
        logger.info(f"Loading Phi-4 Mini model from {model_path}...")
        try:
            self.model = og.Model(model_path)
            self.tokenizer = og.Tokenizer(self.model)
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise RuntimeError(f"Could not load model from {model_path}") from e

    def generate(self, prompt: str, max_tokens: int = 1024) -> str:
        """
        Generates text completion using the Generator API.
        Returns ONLY the new tokens (not the echoed prompt).
        """
        try:
            params = og.GeneratorParams(self.model)
            params.set_search_options(max_length=max_tokens, temperature=0.1, top_p=0.9)

            # Encode prompt
            input_tokens = self.tokenizer.encode(prompt)
            input_length = len(input_tokens)

            # Create generator and feed input tokens
            generator = og.Generator(self.model, params)
            generator.append_tokens(input_tokens)

            # Generate tokens one by one
            while not generator.is_done():
                generator.generate_next_token()

            # Get the FULL sequence and decode ONLY the new tokens
            full_sequence = generator.get_sequence(0)
            new_tokens = full_sequence[input_length:]
            decoded_output = self.tokenizer.decode(new_tokens)

            logger.info(f"Generated {len(new_tokens)} new tokens")
            logger.debug(f"Raw model output: {decoded_output[:300]}")

            return decoded_output.strip()

        except Exception as e:
            logger.error(f"Inference failed: {e}")
            raise
