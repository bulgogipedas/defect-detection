# Model/Inference Change Evidence

Date: 2026-04-25
Scope: MVP MLOps upgrade (config hardening, model lifecycle metadata, telemetry)

## Evaluation command template

```bash
uv run python -m src.training.evaluate \
  --model patchcore \
  --category bottle \
  --weights models/patchcore_bottle.pkl \
  --output-json models/eval/bottle_metrics.json
```

## Promotion gate policy

- Minimum AUROC: 0.70
- Minimum F1: 0.50

## Notes

- This change set introduces promotion workflow and telemetry fields.
- Use real dataset run outputs for production release decisions.
