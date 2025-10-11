# Third-party resources

The technical specification references a number of open-source projects that
accelerate implementation. Run `./scripts/bootstrap_third_party_repos.sh` to
clone lightweight snapshots (depth=1) of each repository into `third_party/`.

| Area | Repository | Purpose |
|------|------------|---------|
| Pose estimation | open-mmlab/mmpose | Primary 2D/3D pose models (RTMPose). |
| Object detection | ultralytics/ultralytics | YOLOv8 player detection. |
| Tracking | FoundationVision/ByteTrack | Multi-object tracking baseline. |
| Tennis CV | abdullahtarek/tennis_analysis | Court keypoints and ball detection. |
| Sports calibration | SoccerNet/sn-calibration | Multi-angle homography techniques. |
| Sports calibration (survey) | cemunds/awesome-sports-camera-calibration | Literature roundup for calibration. |
| Multi-camera calibration | rameau-fr/MC-Calib | Advanced calibration strategies. |
| Sports analytics tooling | roboflow/sports | Additional court detection utilities. |
| Scoreboard OCR | royshil/scoresight | Dedicated scoreboard OCR pipeline. |
| OCR fallback | JaidedAI/EasyOCR | Lightweight multilingual OCR engine. |
| OCR fallback | tesseract-ocr/tesseract | Classical OCR alternative. |
| Gradient boosting | dmlc/xgboost | Pattern discovery baseline algorithm. |
| Gradient boosting | microsoft/LightGBM | High-performance boosting alternative. |
| Gradient boosting | catboost/catboost | Handles categorical features well. |
| Deep learning | pytorch/pytorch | Neural network experimentation. |
| Betting ML example | ratloop/MatchOutcomeAI | Gradient boosting calibration ideas. |
| Betting ML example | kochlisGit/ProphitBet-Soccer-Bets-Predictor | Ensemble strategies. |
| Betting ML example | clemsage/SportsBet | Value betting references. |
| Agents/orchestration | langchain-ai/langchain | Web/search automation agents. |
| Agents/orchestration | joaomdmoura/crewAI | Multi-agent coordination. |
| Scraping | scrapy/scrapy | Full-featured scraping framework. |
| Browser automation | microsoft/playwright-python | Legal screen capture automation. |
| Video decoding | PyAV-Org/PyAV | FFmpeg bindings for Python. |
| API framework | tiangolo/fastapi | Backend framework reference. |
| Data infrastructure | redis/redis | Caching and pub/sub. |
| Data infrastructure | timescale/timescaledb | Time-series extension for Postgres. |
| Frontend | vercel/next.js | Dashboard baseline framework. |
| Frontend | facebook/react | UI component library. |
| Frontend styling | tailwindlabs/tailwindcss | Utility-first CSS. |
| Frontend charts | recharts/recharts | React charting components. |
| Monitoring | prometheus/prometheus | Metrics collection. |
| Monitoring | grafana/grafana | Observability dashboards. |
| Video processing | FFmpeg/FFmpeg | Core decoding/transcoding toolchain. |
| Sports AI survey | firefly-cpp/awesome-computational-intelligence-in-sports | Research survey. |
| Pose datasets | ChristianIngwersen/SportsPose | Sports-specific pose dataset. |
| Sports CV survey | avijit9/awesome-computer-vision-in-sports | Research survey. |

Review each project's license before incorporating code or assets into the main
application.
