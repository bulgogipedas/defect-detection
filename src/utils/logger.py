import logging
import sys


def get_logger(name: str = "visual_defect_pipeline") -> logging.Logger:
    log = logging.getLogger(name)
    if not log.handlers:
        h = logging.StreamHandler(sys.stdout)
        h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
        log.addHandler(h)
        log.setLevel(logging.INFO)
    return log
