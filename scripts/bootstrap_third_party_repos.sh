#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
TARGET_DIR="$ROOT_DIR/third_party"

mkdir -p "$TARGET_DIR"

repos=(
  "https://github.com/open-mmlab/mmpose.git"
  "https://github.com/ultralytics/ultralytics.git"
  "https://github.com/FoundationVision/ByteTrack.git"
  "https://github.com/abdullahtarek/tennis_analysis.git"
  "https://github.com/roboflow/sports.git"
  "https://github.com/SoccerNet/sn-calibration.git"
  "https://github.com/cemunds/awesome-sports-camera-calibration.git"
  "https://github.com/rameau-fr/MC-Calib.git"
  "https://github.com/royshil/scoresight.git"
  "https://github.com/JaidedAI/EasyOCR.git"
  "https://github.com/tesseract-ocr/tesseract.git"
  "https://github.com/dmlc/xgboost.git"
  "https://github.com/microsoft/LightGBM.git"
  "https://github.com/catboost/catboost.git"
  "https://github.com/pytorch/pytorch.git"
  "https://github.com/ratloop/MatchOutcomeAI.git"
  "https://github.com/kochlisGit/ProphitBet-Soccer-Bets-Predictor.git"
  "https://github.com/clemsage/SportsBet.git"
  "https://github.com/langchain-ai/langchain.git"
  "https://github.com/joaomdmoura/crewAI.git"
  "https://github.com/scrapy/scrapy.git"
  "https://github.com/microsoft/playwright-python.git"
  "https://github.com/PyAV-Org/PyAV.git"
  "https://github.com/tiangolo/fastapi.git"
  "https://github.com/redis/redis.git"
  "https://github.com/timescale/timescaledb.git"
  "https://github.com/vercel/next.js.git"
  "https://github.com/facebook/react.git"
  "https://github.com/tailwindlabs/tailwindcss.git"
  "https://github.com/recharts/recharts.git"
  "https://github.com/prometheus/prometheus.git"
  "https://github.com/grafana/grafana.git"
  "https://github.com/FFmpeg/FFmpeg.git"
  "https://github.com/firefly-cpp/awesome-computational-intelligence-in-sports.git"
  "https://github.com/ChristianIngwersen/SportsPose.git"
  "https://github.com/avijit9/awesome-computer-vision-in-sports.git"
)

for repo in "${repos[@]}"; do
  name="$(basename "$repo" .git)"
  dest="$TARGET_DIR/$name"

  if [[ -d "$dest/.git" ]]; then
    echo "[skip] $name already cloned"
    continue
  fi

  echo "[clone] $repo -> $dest"
  git clone --depth=1 "$repo" "$dest"

done

cat <<INFO
\nThird-party repositories are now available under $TARGET_DIR.\nReview individual project licenses before incorporating code into the project.\nINFO
