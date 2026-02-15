import time
import asyncio
import logging
from app.api.schemas import FeedbackRequest, AnalysisResponse
from app.core import preprocessor, prompt_builder, response_parser
from app.core.inference import Phi4MiniEngine
from app.utils.cache import analysis_cache

logger = logging.getLogger(__name__)

SYS_START = '<' + '|system|' + '>'
SYS_END = '<' + '|end|' + '>'
USR_START = '<' + '|user|' + '>'
USR_END = '<' + '|end|' + '>'
ASST_START = '<' + '|assistant|' + '>'


async def analyze_feedback(
    request: FeedbackRequest,
    engine: Phi4MiniEngine
) -> AnalysisResponse:
    start_time = time.perf_counter()

    # 1. Cache Check
    cached_result = analysis_cache.get(request.feedback, request.poll_stats)
    if cached_result:
        logger.info(f"Cache hit for session {request.session_id}")
        cached_result.session_id = request.session_id
        cached_result.processing_time_ms = int((time.perf_counter() - start_time) * 1000)
        return cached_result

    # 2. Preprocess
    preprocessed = preprocessor.preprocess(request)

    # 3. Build Prompt
    system_prompt_text = prompt_builder.load_system_prompt()
    user_prompt_text = prompt_builder.build_prompt(preprocessed)

    full_prompt = f"{SYS_START}\n{system_prompt_text}\n{SYS_END}\n{USR_START}\n{user_prompt_text}\n{USR_END}\n{ASST_START}\n"

    # 4. Inference with retry
    max_retries = 1

    for attempt in range(max_retries + 1):
        try:
            raw_output = await asyncio.to_thread(engine.generate, full_prompt)
            logger.info(f"Raw LLM output (first 500 chars): {raw_output[:500]}")

            # 5. Parse
            result = response_parser.parse_response(
                raw_output,
                preprocessed.confidence,
                request.session_id
            )

            end_time = time.perf_counter()
            result.processing_time_ms = int((end_time - start_time) * 1000)

            # 6. Cache
            analysis_cache.set(request.feedback, request.poll_stats, result)
            return result

        except ValueError as e:
            logger.warning(f"Attempt {attempt+1} failed to parse JSON: {e}")
            if attempt < max_retries:
                full_prompt += "\nYou MUST return ONLY valid JSON. No other text."
                continue
            else:
                logger.error("All attempts failed.")
                raise e
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            raise e

    raise RuntimeError("Unreachable")
