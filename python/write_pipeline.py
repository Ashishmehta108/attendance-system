import os

pipeline_code = (
    "import time\n"
    "import asyncio\n"
    "import logging\n"
    "from app.api.schemas import FeedbackRequest, AnalysisResponse\n"
    "from app.core import preprocessor, prompt_builder, response_parser\n"
    "from app.core.inference import Phi4MiniEngine\n"
    "from app.utils.cache import analysis_cache\n"
    "\n"
    "logger = logging.getLogger(__name__)\n"
    "\n"
    "SYS_START = '<' + '|system|' + '>'\n"
    "SYS_END = '<' + '|end|' + '>'\n"
    "USR_START = '<' + '|user|' + '>'\n"
    "USR_END = '<' + '|end|' + '>'\n"
    "ASST_START = '<' + '|assistant|' + '>'\n"
    "\n"
    "\n"
    "async def analyze_feedback(\n"
    "    request: FeedbackRequest,\n"
    "    engine: Phi4MiniEngine\n"
    ") -> AnalysisResponse:\n"
    "    start_time = time.perf_counter()\n"
    "\n"
    "    # 1. Cache Check\n"
    "    cached_result = analysis_cache.get(request.feedback, request.poll_stats)\n"
    "    if cached_result:\n"
    '        logger.info(f"Cache hit for session {request.session_id}")\n'
    "        cached_result.session_id = request.session_id\n"
    "        cached_result.processing_time_ms = int((time.perf_counter() - start_time) * 1000)\n"
    "        return cached_result\n"
    "\n"
    "    # 2. Preprocess\n"
    "    preprocessed = preprocessor.preprocess(request)\n"
    "\n"
    "    # 3. Build Prompt\n"
    "    system_prompt_text = prompt_builder.load_system_prompt()\n"
    "    user_prompt_text = prompt_builder.build_prompt(preprocessed)\n"
    "\n"
    '    full_prompt = f"{SYS_START}\\n{system_prompt_text}\\n{SYS_END}\\n{USR_START}\\n{user_prompt_text}\\n{USR_END}\\n{ASST_START}\\n"\n'
    "\n"
    "    # 4. Inference with retry\n"
    "    max_retries = 1\n"
    "\n"
    "    for attempt in range(max_retries + 1):\n"
    "        try:\n"
    "            raw_output = await asyncio.to_thread(engine.generate, full_prompt)\n"
    '            logger.info(f"Raw LLM output (first 500 chars): {raw_output[:500]}")\n'
    "\n"
    "            # 5. Parse\n"
    "            result = response_parser.parse_response(\n"
    "                raw_output,\n"
    "                preprocessed.confidence,\n"
    "                request.session_id\n"
    "            )\n"
    "\n"
    "            end_time = time.perf_counter()\n"
    "            result.processing_time_ms = int((end_time - start_time) * 1000)\n"
    "\n"
    "            # 6. Cache\n"
    "            analysis_cache.set(request.feedback, request.poll_stats, result)\n"
    "            return result\n"
    "\n"
    "        except ValueError as e:\n"
    '            logger.warning(f"Attempt {attempt+1} failed to parse JSON: {e}")\n'
    "            if attempt < max_retries:\n"
    '                full_prompt += "\\nYou MUST return ONLY valid JSON. No other text."\n'
    "                continue\n"
    "            else:\n"
    '                logger.error("All attempts failed.")\n'
    "                raise e\n"
    "        except Exception as e:\n"
    '            logger.error(f"Pipeline error: {e}")\n'
    "            raise e\n"
    "\n"
    '    raise RuntimeError("Unreachable")\n'
)

with open(r"E:\Backend\app\core\pipeline.py", "w", encoding="utf-8") as f:
    f.write(pipeline_code)

print("pipeline.py written successfully")
