# Tennis Vision AI - Complete Technical Specification
**Version 1.0** | **Date:** October 10, 2025

> A fully autonomous AI system that learns to predict tennis player fatigue and performance drops from broadcast video, using computer vision, biomechanics tracking, and self-supervised machine learning.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Core Challenges & Solutions](#core-challenges--solutions)
4. [Autonomous Learning Pipeline](#autonomous-learning-pipeline)
5. [Computer Vision Architecture](#computer-vision-architecture)
6. [Broadcast TV Calibration System](#broadcast-tv-calibration-system)
7. [Biomechanics Tracking (200+ Features)](#biomechanics-tracking-200-features)
8. [Libraries & Technologies](#libraries--technologies)
9. [Data Flow & Architecture](#data-flow--architecture)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Budget & Timeline](#budget--timeline)
12. [Risk Mitigation](#risk-mitigation)

---

## 1. Executive Summary

### What This System Does

**Autonomous Learning:**
- AI agent searches YouTube for 100+ tennis matches
- Scrapes player data from Wikipedia/ATP automatically
- Watches entire matches in embedded player (legal, compliant)
- Extracts 200+ biomechanical features every second
- Makes 30,000+ predictions during training
- Validates predictions against actual match outcomes
- Learns which feature patterns predict fatigue/performance drops

**Live Monitoring:**
- Processes broadcast video in real-time
- Tracks micro-adjustments (knee angles, stride length, recovery time)
- Handles constantly changing camera angles
- Emits alerts when fatigue signatures detected
- User makes manual betting decisions (no auto-betting)

### Key Innovation

**The system never needs manual labeling.** It learns what "fatigue" looks like by:
1. Measuring everything (200+ features automatically)
2. Comparing to player baselines
3. Correlating with match outcomes (who won/lost games)
4. Discovering which patterns actually predict performance drops

### Target Performance

- **Prediction Accuracy:** 64-74% (better than market odds by 3-4%)
- **Processing Speed:** <350ms latency on RTX 4090
- **Training Time:** 3-5 days on 100 matches
- **Live Streams:** 2-4 simultaneous streams supported

---

## 2. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│               USER INTERFACE                         │
│  - Video Library (drag-drop matches)                │
│  - Training Wizard (5-step guided process)          │
│  - Live Dashboard (real-time alerts)                │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│          AUTONOMOUS AI AGENT                        │
│  - YouTube Video Finder                             │
│  - Player Data Scraper (Wikipedia/ATP)              │
│  - Match Outcome Verifier                           │
│  - Self-Supervised Learning Loop                    │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│        COMPUTER VISION PIPELINE                     │
│  - Multi-Angle Classification                       │
│  - Adaptive Court Calibration                       │
│  - Player Detection & Tracking                      │
│  - 3D Pose Estimation                               │
│  - Biomechanics Extraction (200+ features)          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│          LEARNING ENGINE                            │
│  - Pattern Discovery (XGBoost/Neural Nets)          │
│  - Prediction Validation                            │
│  - Continuous Model Updates                         │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│          ALERT SYSTEM                               │
│  - Real-time Fatigue Detection                      │
│  - Confidence Scoring                               │
│  - Human-in-the-Loop Betting Guidance               │
└─────────────────────────────────────────────────────┘
```

### Operating Modes

#### Mode 1: Training (Autonomous)
**You provide:** CSV with 100 match names
**AI does:** Everything else (find videos, scrape data, learn patterns)
**Duration:** 3-5 days
**Output:** Trained model + accuracy report

#### Mode 2: Live Monitoring
**You provide:** Stream URL or camera feed
**AI does:** Real-time feature extraction + predictions
**Output:** Fatigue alerts with confidence scores
**You do:** Make manual betting decisions

---

## 3. Core Challenges & Solutions

### Challenge 1: Manual Labeling is Impossible
**Problem:** Can't manually label 100,000 frames as "fatigued" or "not fatigued"

**Solution:** Self-supervised learning
- System measures 200+ features automatically
- Compares to player-specific baselines
- Correlates with match outcomes (ground truth from scoreboards)
- Learns: "When features X, Y, Z change → player loses next 2-3 games"
- No human labeling required

### Challenge 2: Broadcast Camera Constantly Moves
**Problem:** 
- Camera angles change every 30-60 seconds
- Zoom in/out during play
- No fixed calibration possible

**Solution:** Adaptive multi-angle system
- Classify camera angle every frame (CNN classifier)
- Maintain calibration "sessions" per angle
- Recalibrate every 2 seconds (60 frames)
- Cache known angles (angle memory)
- Fall back to relative measurements when court not visible

### Challenge 3: Depth Estimation from Single Camera
**Problem:** TV gives 2D image, need 3D positions for biomechanics

**Solution:** Multi-modal depth estimation
1. **Height scaling:** Use known player height (1.88m) → compute scale
2. **Court geometry:** Map feet to ground plane via homography
3. **Joint proportions:** Knee ~28% of height, Hip ~52%, Shoulder ~81%
4. **Motion parallax:** Estimate depth when camera pans
5. **ML depth:** Monocular depth networks (MiDaS) for relative depth
6. **Fusion:** Combine all methods with confidence weighting

### Challenge 4: What is "Fatigue"?
**Problem:** No clear definition of fatigue - it's subtle and multi-dimensional

**Solution:** Let AI discover patterns
- Measure everything (200+ features)
- Don't pre-define fatigue
- AI finds: "Pattern #23: Recovery time +20%, Towel visits +100%, Stride -6% → Loses next 2.8 games (74% accurate)"
- Multiple fatigue "signatures" emerge automatically

---

## 4. Autonomous Learning Pipeline

### Phase 1: Data Collection (Fully Automated)

#### Step 1.1: YouTube Video Discovery
```python
Input: CSV with match names
  - "Djokovic vs Alcaraz Wimbledon 2024"
  - "Federer vs Nadal Australian Open 2017"
  - ... (100 matches)

AI Agent:
  1. Search YouTube API: "Djokovic Alcaraz Wimbledon 2024 full match"
  2. Filter results:
     - Duration > 2 hours (full match, not highlights)
     - Quality >= 720p
     - Upload date near match date
  3. Select best video
  4. Store: Video ID (for embedding, no download)
  
Output: 100 YouTube video IDs linked to database
```

#### Step 1.2: Player Information Gathering
```python
For each player detected in video:

Sources (in priority order):
  1. Wikipedia API (structured data)
     - Name, height, birthdate, playing hand
     - Career stats
  
  2. ATP/WTA Official Website (web scraping)
     - Current ranking
     - Surface-specific win rates
     - Head-to-head records
  
  3. Tennis databases (tennisabstract.com, etc.)
     - Advanced stats (if available)

Output: Player profile database (JSON/SQL)
  players/djokovic_novak.json:
    {
      "name": "Novak Djokovic",
      "height_m": 1.88,
      "hand": "right",
      "dob": "1987-05-22",
      "surfaces": {
        "hard": 0.842,
        "clay": 0.798,
        "grass": 0.871
      }
    }
```

#### Step 1.3: Match Outcome Verification
```python
For each match:

Sources:
  - ATP/WTA official results
  - Wikipedia match pages
  - ESPN/sports sites

Extract:
  - Winner: "Carlos Alcaraz"
  - Score: "6-2, 6-2, 7-6"
  - Duration: "2h 27min"
  - Key moments (breaks, tiebreaks)

Output: Ground truth labels
  matches/wimb2024_djok_alca/outcome.json:
    {
      "winner": "Carlos Alcaraz",
      "score": [6, 2, 6, 2, 7, 6],
      "duration_min": 147,
      "breaks": {
        "djokovic": 1,
        "alcaraz": 5
      }
    }
```

### Phase 2: Video Processing (Autonomous)

#### Embedded Video Playback (Legal Compliance)
```python
# Uses YouTube IFrame API (official, compliant)
# No video downloading

Process:
  1. Embed YouTube player in headless browser
  2. OS-level screen capture (with user permission)
     - Windows: Graphics Capture API
     - macOS: ScreenCaptureKit
     - Linux: X11/Wayland capture
  3. Process frames at 2-4x speed
  4. Store ONLY extracted features (not raw video)
  5. Delete frame data after processing

Legal safeguards:
  ✓ No video redistribution
  ✓ Personal use / research
  ✓ Fair use doctrine (transformative analysis)
  ✓ Respects YouTube TOS (embed API)
```

#### Feature Extraction (Every 0.5 seconds)
```python
For each frame batch (15 frames = 0.5s):

Extract:
  - Player positions (court coordinates)
  - Pose keypoints (17 joints × 2 players)
  - 3D estimates (depth from height/homography)
  - Joint angles (25 angles per player)
  - Motion velocities (for all joints)
  - Stride characteristics
  - Recovery metrics
  - Behavioral cues (towel, face touches, etc.)
  - Scoreboard data (OCR)
  - Context (time, set, game, server)

Output: Feature vectors (200+ values per player per timestamp)

Storage: Parquet files (compressed, efficient)
  features/wimb2024/djokovic/frame_0001234.parquet
    {
      "timestamp": "00:41:08",
      "recovery_time": 3.2,
      "stride_length": 1.34,
      "knee_flexion_right": 142.3,
      "towel_frequency": 0.31,
      ... (200+ features)
    }
```

### Phase 3: Self-Supervised Learning

#### Prediction → Validation Loop
```python
For each match during training:

While watching:
  Every 2 minutes:
    1. Measure current features
    2. Compare to player baseline
    3. Detect patterns (e.g., "Fatigue Signature #23")
    4. Make internal prediction:
       "Djokovic will lose next 2-3 games (76% confidence)"
    
  Continue watching next 3 games:
    5. Observe actual outcome
    6. Validate: Was prediction correct?
    
  Update model:
    7. If correct: Increase pattern accuracy, boost feature weights
    8. If wrong: Decrease accuracy, investigate why
    9. Discover context (e.g., "Pattern fails in crucial moments")

After 100 matches:
  - 28,000+ predictions made
  - 18,900+ correct (66.4% accuracy)
  - 83 distinct patterns discovered
  - Each pattern has validation accuracy
```

#### Pattern Discovery Example
```python
Pattern #23 Discovered:

Trigger conditions:
  - recovery_time_delta > +20%
  - towel_frequency_delta > +100%
  - stride_length_delta < -5%
  - serve_routine_delta > +10%

Historical performance:
  - Detected 547 times across 100 matches
  - Prediction: "Player loses next 2.8 games (avg)"
  - Accuracy: 74.2% (406 correct, 141 wrong)
  
Context refinements:
  - Works best in games 5-10 of set
  - Less reliable in crucial moments (set points)
  - More accurate on hard courts than clay
```

---

## 5. Computer Vision Architecture

### Core CV Pipeline (30 fps processing)

```
Frame Input (1920×1080, 30 fps)
        ↓
[1] SCENE ANALYSIS
    ├─ Scene cut detection (histogram diff + SSIM)
    ├─ Angle classification (CNN: 6 angle types)
    └─ Quality assessment (lines visible, lighting)
        ↓
[2] COURT CALIBRATION (per angle session)
    ├─ Line detection (Canny edges + Hough transform)
    ├─ Line classification (baseline/sideline/service)
    ├─ Corner detection (line intersections)
    ├─ Homography computation (cv2.findHomography RANSAC)
    └─ Validation (reprojection error < 5px)
        ↓
[3] PLAYER DETECTION
    ├─ YOLOv8 (person class, conf > 0.7)
    ├─ Filter: Remove crowd/officials (on-court only)
    └─ Output: 2 bounding boxes
        ↓
[4] PLAYER TRACKING
    ├─ ByteTrack (multi-object tracker)
    ├─ ID persistence across frames
    ├─ Occlusion handling
    └─ Output: Player A = "Djokovic", Player B = "Alcaraz"
        ↓
[5] POSE ESTIMATION
    ├─ MMPose RTMPose-m (17 keypoints per player)
    ├─ Confidence gating (reject if conf < 0.7)
    ├─ Temporal smoothing (One-Euro + Kalman filter)
    └─ Output: 2D joint coordinates + confidence
        ↓
[6] 3D LIFTING
    ├─ Height-based scaling (use known player height)
    ├─ Ground plane projection (via homography)
    ├─ Vertical offset estimation (joint proportions)
    ├─ Monocular depth network (MiDaS - optional)
    └─ Output: 3D joint coordinates
        ↓
[7] BIOMECHANICS COMPUTATION
    ├─ Joint angles (25 angles per player)
    ├─ Motion velocities (optical flow + differentiation)
    ├─ Stride analysis (foot strike detection)
    ├─ Recovery analysis (shot-to-ready timing)
    └─ Output: Kinematic feature vector
        ↓
[8] BEHAVIORAL ANALYSIS
    ├─ Towel visit detection (player enters towel zone)
    ├─ Face touch detection (hand near face region)
    ├─ Bent-over detection (trunk angle > threshold)
    ├─ Gesture recognition (shoulder rolls, stretches)
    └─ Output: Behavioral feature vector
        ↓
[9] SCOREBOARD OCR
    ├─ Scoreboard detection (template match / YOLO)
    ├─ Text extraction (EasyOCR / Tesseract)
    ├─ Player name matching (fuzzy match to database)
    ├─ Score parsing (sets, games, points)
    └─ Output: Match state vector
        ↓
[10] FEATURE AGGREGATION
    ├─ Combine all feature vectors
    ├─ Temporal windowing (rolling 30s/60s/180s)
    ├─ Compare to player baseline
    ├─ Compute delta features (% change)
    └─ Output: 200+ feature vector for ML model
```

### Component Details

#### Player Detection (YOLOv8)
```python
Model: YOLOv8n (nano, fastest)
Input: 640×640 frame
Output: Bounding boxes with confidence

Configuration:
  - Class: 'person' only
  - Confidence threshold: 0.7
  - NMS IoU threshold: 0.45
  - Filter: Keep only 2 boxes closest to court center

Performance:
  - Inference: 10-15ms on RTX 4090
  - Accuracy: 99.2% detection rate
```

#### Player Tracking (ByteTrack)
```python
Tracker: ByteTrack (ECCV 2022 state-of-the-art)

Features:
  - Associates low-confidence detections (occlusion recovery)
  - Kalman filter for motion prediction
  - ReID embeddings for identity persistence
  
Configuration:
  - Track threshold: 0.6
  - Track buffer: 30 frames
  - Match threshold: 0.8
  
Performance:
  - 80.3 MOTA on MOT17
  - Handles occlusions well
  - Maintains ID across scene cuts (with re-ID)
```

#### Pose Estimation (MMPose RTMPose)
```python
Model: RTMPose-m (medium, real-time optimized)
Input: Player bounding box crop
Output: 17 keypoints × (x, y, confidence)

Keypoints:
  0: Nose
  1-2: Eyes (left, right)
  3-4: Ears (left, right)
  5-6: Shoulders (left, right)
  7-8: Elbows (left, right)
  9-10: Wrists (left, right)
  11-12: Hips (left, right)
  13-14: Knees (left, right)
  15-16: Ankles (left, right)

Performance:
  - Inference: 5-10ms per person
  - Accuracy: 75.8% AP on COCO
  - 90+ FPS on CPU, 430+ FPS on GPU
```

---

## 6. Broadcast TV Calibration System

### The Multi-Angle Challenge

**Problem:** Broadcast cameras constantly change angle, zoom, and pan. Traditional single-calibration systems fail.

**Solution:** Adaptive multi-angle calibration with session management.

### Camera Angle Classification

#### Angle Types Detected
```python
ANGLE_TAXONOMY = {
    'baseline_high': {
        'description': 'Standard TV angle - behind baseline, elevated',
        'frequency': '60% of broadcast time',
        'quality': 'Excellent - full court visible',
        'use_case': 'Primary processing angle'
    },
    'baseline_low': {
        'description': 'Behind baseline, low camera height',
        'frequency': '15% of broadcast time',
        'quality': 'Good - some depth ambiguity',
        'use_case': 'Process with caution'
    },
    'sideline_mid': {
        'description': 'Sideline view at net height',
        'frequency': '10% of broadcast time',
        'quality': 'Excellent - best for depth',
        'use_case': 'High-quality processing'
    },
    'behind_server': {
        'description': 'Tight shot behind server',
        'frequency': '8% of broadcast time',
        'quality': 'Poor - limited court visibility',
        'use_case': 'Degraded mode (relative only)'
    },
    'player_closeup': {
        'description': 'Face/upper body only',
        'frequency': '5% of broadcast time',
        'quality': 'N/A - no court',
        'use_case': 'Skip processing'
    },
    'overhead': {
        'description': 'Bird's eye view (rare)',
        'frequency': '2% of broadcast time',
        'quality': 'Excellent - no depth ambiguity',
        'use_case': 'Best case scenario'
    }
}
```

#### Classification Model
```python
Architecture: ResNet-18 (pretrained on ImageNet)
Training: 10,000 labeled broadcast frames

Input: 224×224 RGB frame (downscaled for speed)
Output: 6-class probability distribution

Performance:
  - Accuracy: 94.2%
  - Inference: 3-5ms on GPU
  - False positive rate: 2.1%
```

### Adaptive Calibration Strategy

#### Session Management
```python
class CalibrationSession:
    """
    Represents one continuous camera angle period
    """
    def __init__(self, angle_type, start_frame):
        self.angle_type = angle_type
        self.start_frame = start_frame
        self.end_frame = None
        
        # Calibration data
        self.homography = None
        self.corners = None
        self.meters_per_pixel = None
        self.fov_degrees = None
        
        # Quality tracking
        self.calibration_quality = 'unknown'
        self.refit_count = 0
        self.last_refit_frame = start_frame
        
        # Performance
        self.frames_processed = 0
        self.avg_reprojection_error = 0.0
```

Timeline during match:
┌─────────────────────────────────────────────────┐
│ Frame 0-5234: Session 1 (baseline_high)        │
│   ├─ Initial calibration (frame 0)             │
│   ├─ Refit #1 (frame 60)                       │
│   ├─ Refit #2 (frame 120)                      │
│   └─ ... (every 60 frames = 2 seconds)         │
├─────────────────────────────────────────────────┤
│ Frame 5235-5298: Session 2 (player_closeup)    │
│   └─ SKIP PROCESSING (no court visible)        │
├─────────────────────────────────────────────────┤
│ Frame 5299-9876: Session 3 (sideline_mid)      │
│   ├─ NEW angle → recalibrate                   │
│   ├─ Store as Session 3                        │
│   └─ Process with new homography               │
├─────────────────────────────────────────────────┤
│ Frame 9877-15234: Session 4 (baseline_high)    │
│   ├─ RECOGNIZE: Same as Session 1!             │
│   ├─ Retrieve cached calibration               │
│   ├─ Validate: Still accurate?                 │
│   └─ If yes: reuse, if no: recalibrate         │
└─────────────────────────────────────────────────┘

### Court Line Detection Pipeline

```python
def detect_court_lines(frame):
    """
    Detect and classify court lines for calibration
    """
    
    # Step 1: Edge detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    
    # Step 2: Line detection (Hough Transform)
    lines = cv2.HoughLinesP(
        edges,
        rho=1,              # Distance resolution
        theta=np.pi/180,    # Angle resolution
        threshold=100,      # Min votes
        minLineLength=50,   # Min line length
        maxLineGap=10       # Max gap between segments
    )
    
    # Step 3: Line classification
    classified_lines = {
        'baselines': [],    # Horizontal, near top/bottom
        'sidelines': [],    # Vertical, near left/right
        'service_lines': [], # Horizontal, middle
        'center_line': []   # Vertical, center
    }
    
    for line in lines:
        angle = compute_line_angle(line)
        position = compute_line_position(line, frame.shape)
        
        # Classify based on angle and position
        if is_horizontal(angle):
            if is_near_edge(position, 'top') or is_near_edge(position, 'bottom'):
                classified_lines['baselines'].append(line)
            else:
                classified_lines['service_lines'].append(line)
        elif is_vertical(angle):
            if is_near_edge(position, 'left') or is_near_edge(position, 'right'):
                classified_lines['sidelines'].append(line)
            else:
                classified_lines['center_line'].append(line)
    
    return classified_lines


def compute_homography(classified_lines):
    """
    Compute perspective transform from detected lines
    """
    
    # Find line intersections (court corners)
    corners_image = find_intersections(
        classified_lines['baselines'],
        classified_lines['sidelines']
    )
    
    # ITF tennis court dimensions (meters)
    COURT_LENGTH = 23.77  # meters
    COURT_WIDTH = 10.97   # meters (doubles)
    
    # Canonical court template (bird's eye view)
    corners_world = np.array([
        [0, 0],                      # Near-left
        [COURT_WIDTH, 0],            # Near-right
        [0, COURT_LENGTH],           # Far-left
        [COURT_WIDTH, COURT_LENGTH]  # Far-right
    ], dtype=np.float32)
    
    # Compute homography matrix
    H, mask = cv2.findHomography(
        corners_image,
        corners_world,
        method=cv2.RANSAC,
        ransacReprojThreshold=3.0
    )
    
    # Validate
    reprojection_error = compute_reprojection_error(
        H, corners_image, corners_world
    )
    
    if reprojection_error < 5.0:  # pixels
        return {
            'homography': H,
            'quality': 'good',
            'error': reprojection_error,
            'corners': corners_image
        }
    else:
        return {
            'homography': None,
            'quality': 'poor',
            'error': reprojection_error
        }
```

### 3D Position Estimation

```python
def estimate_3d_position(keypoints_2d, player_height, homography):
    """
    Convert 2D pose to 3D coordinates
    
    Methods used (in order of reliability):
    1. Height-based scaling (most reliable)
    2. Ground plane projection
    3. Joint proportion estimation
    4. Motion parallax (when available)
    """
    
    # Method 1: Compute scale from player height
    ankle_2d = keypoints_2d['ankle']
    head_2d = keypoints_2d['head']
    
    pixel_height = np.linalg.norm(head_2d - ankle_2d)
    meters_per_pixel = player_height / pixel_height
    
    # Method 2: Map ankle (foot) to ground plane
    ankle_world = cv2.perspectiveTransform(
        ankle_2d.reshape(1, 1, 2),
        homography
    )
    
    x_court = ankle_world[0, 0, 0]  # meters from left sideline
    y_court = ankle_world[0, 0, 1]  # meters from near baseline
    z_ground = 0.0                   # on ground
    
    # Method 3: Estimate vertical position of other joints
    # Using typical human body proportions
    JOINT_HEIGHT_RATIOS = {
        'ankle': 0.04,    # 4% of height
        'knee': 0.28,     # 28% of height
        'hip': 0.52,      # 52% of height
        'shoulder': 0.81, # 81% of height
        'head': 0.93      # 93% of height (top of head = 100%)
    }
    
    joints_3d = {}
    for joint_name, joint_2d in keypoints_2d.items():
        # Ground projection
        joint_ground = cv2.perspectiveTransform(
            joint_2d.reshape(1, 1, 2),
            homography
        )
        
        # Vertical offset
        z_estimate = player_height * JOINT_HEIGHT_RATIOS.get(joint_name, 0.5)
        
        joints_3d[joint_name] = {
            'x': joint_ground[0, 0, 0],
            'y': joint_ground[0, 0, 1],
            'z': z_estimate
        }
    
    # Method 4: Refine with monocular depth (optional)
    if ENABLE_DEPTH_NET:
        depth_map = monocular_depth_estimator(frame)
        depth_refinement = extract_depth_at_joints(depth_map, keypoints_2d)
        
        # Fuse with geometric estimate
        for joint_name in joints_3d:
            geometric_z = joints_3d[joint_name]['z']
            depth_z = depth_refinement[joint_name]
            
            # Weighted average (favor geometric for now)
            joints_3d[joint_name]['z'] = (
                0.7 * geometric_z + 0.3 * depth_z
            )
    
    return joints_3d
```

### Angle Memory System

```python
class AngleMemoryCache:
    """
    Remembers calibrations for previously seen angles
    Enables instant recognition when camera returns
    """
    
    def __init__(self):
        self.cache = {}  # angle_id → calibration data
        
    def compute_fingerprint(self, frame, angle_type):
        """
        Create unique signature for this camera view
        """
        # Extract structural features
        edges = cv2.Canny(frame, 50, 150)
        
        # Line angle histogram (direction of edges)
        lines = cv2.HoughLines(edges, 1, np.pi/180, 100)
        angle_hist = compute_angle_histogram(lines, bins=36)
        
        # HOG features (oriented gradients)
        hog = compute_hog_features(cv2.resize(frame, (128, 128)))
        
        # Court geometry features
        geometry = extract_court_geometry(frame)
        
        # Combine into 256-dim vector
        fingerprint = np.concatenate([
            angle_hist,      # 36 dims
            hog[:150],       # 150 dims
            geometry         # 70 dims
        ])
        
        return fingerprint
    
    def find_match(self, fingerprint, angle_type):
        """
        Search cache for similar angle view
        """
        best_match = None
        best_similarity = 0.0
        
        for angle_id, cached_data in self.cache.items():
            if cached_data['angle_type'] != angle_type:
                continue  # Only compare within same angle type
                
            # Cosine similarity
            similarity = cosine_similarity(
                fingerprint,
                cached_data['fingerprint']
            )
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = angle_id
        
        if best_similarity > 0.85:  # 85% threshold
            return {
                'found': True,
                'angle_id': best_match,
                'similarity': best_similarity,
                'calibration': self.cache[best_match]['calibration']
            }
        else:
            return {'found': False}
    
    def add_to_cache(self, fingerprint, angle_type, calibration):
        """
        Store new angle calibration
        """
        angle_id = f"{angle_type}_{len(self.cache)}"
        
        self.cache[angle_id] = {
            'fingerprint': fingerprint,
            'angle_type': angle_type,
            'calibration': calibration,
            'first_seen': self.frame_number,
            'last_seen': self.frame_number,
            'use_count': 1
        }
        
        return angle_id
```

### Degraded Mode Fallback

```python
def extract_features_robust(frame, pose, homography_quality):
    """
    Adapt feature extraction based on calibration quality
    """
    
    if homography_quality == 'good':
        # FULL MODE: Absolute measurements available
        features = {
            # Absolute spatial
            'stride_length_m': 1.34,
            'recovery_distance_m': 4.2,
            'court_position_x': 5.23,
            'court_position_y': 11.84,
            'player_velocity_ms': 2.1,
            
            # Joint angles (always available)
            'knee_flexion_deg': 142.3,
            'hip_flexion_deg': 78.2,
            'trunk_lean_deg': 23.4,
            
            # Temporal (always available)
            'recovery_time_s': 3.2,
            'serve_routine_s': 9.1,
            
            # Delta (compare to baseline)
            'stride_length_delta_pct': -6.5,
            'recovery_time_delta_pct': +23.0
        }
        
    elif homography_quality == 'degraded':
        # RELATIVE MODE: No absolute positions, deltas only
        features = {
            # No absolute spatial measurements
            
            # Joint angles still available
            'knee_flexion_deg': 142.3,
            'hip_flexion_deg': 78.2,
            
            # Temporal still available
            'recovery_time_s': 3.2,
            'serve_routine_s': 9.1,
            
            # Deltas (most important for fatigue)
            'stride_length_delta_pct': -6.5,
            'recovery_time_delta_pct': +23.0,
            'knee_flexion_delta_deg': -8.2,
            'serve_routine_delta_pct': +11.0
        }
        
    else:  # quality == 'poor'
        # MINIMAL MODE: Temporal features only
        features = {
            # No spatial measurements at all
            
            # Only temporal/behavioral (OCR-based)
            'between_point_time_s': 24.3,
            'serve_routine_s': 9.1,
            'towel_frequency': 0.31,
            'serve_routine_delta_pct': +11.0
        }
    
    return features
```

---

## 7. Biomechanics Tracking (200+ Features)

### Feature Categories

#### Category 1: Kinematic Features (60 metrics)
**Extracted from 3D pose estimation**

```python
KINEMATIC_FEATURES = {
    # Joint angles (25 angles)
    'right_knee_flexion': 142.3,          # degrees
    'left_knee_flexion': 138.7,
    'knee_asymmetry': 3.6,                # abs difference
    'right_hip_flexion': 78.2,
    'left_hip_flexion': 76.9,
    'hip_asymmetry': 1.3,
    'right_ankle_dorsiflexion': -12.3,
    'left_ankle_dorsiflexion': -11.8,
    'trunk_forward_lean': 23.4,
    'trunk_lateral_lean': 2.1,
    'trunk_rotation': 34.2,
    'right_shoulder_flexion': 156.8,
    'left_shoulder_flexion': 161.2,
    'right_elbow_angle': 145.3,
    'left_elbow_angle': 148.7,
    # ... 10 more angles
    
    # Movement velocities (15 metrics)
    'center_of_mass_velocity': 2.1,       # m/s
    'center_of_mass_acceleration': 0.34,  # m/s²
    'right_foot_velocity': 1.27,
    'left_foot_velocity': 1.15,
    'right_hand_velocity': 4.3,           # racket speed proxy
    'left_hand_velocity': 0.8,
    'vertical_oscillation': 0.032,        # m (body bounce)
    'lateral_velocity': 1.8,
    'forward_velocity': 0.6,
    # ... 6 more velocities
    
    # Stride metrics (12 metrics)
    'right_stride_length': 1.34,          # meters
    'left_stride_length': 1.29,
    'stride_asymmetry_pct': 3.7,
    'stride_frequency': 1.8,              # strides/second
    'stride_variability_coeff': 0.08,     # consistency
    'stance_phase_duration': 0.42,        # seconds on ground
    'flight_phase_duration': 0.13,        # seconds in air
    'double_support_time': 0.09,          # both feet down
    'cadence': 108,                       # steps/minute
    # ... 3 more stride metrics
    
    # Range of motion (8 metrics)
    'knee_rom': 68,                       # degrees total range
    'hip_rom': 82,
    'ankle_rom': 45,
    'shoulder_rom': 145,
    'trunk_rom': 67,
    # ... 3 more ROM metrics
}
```

#### Category 2: Temporal/Behavioral Features (40 metrics)
**Extracted from video analysis + OCR**

```python
TEMPORAL_FEATURES = {
    # Timing patterns (15 metrics)
    'between_point_rest_time': 24.3,      # seconds
    'serve_routine_duration': 9.1,
    'first_serve_prep_time': 7.2,
    'second_serve_prep_time': 8.9,
    'ball_bounce_count': 3,
    'ball_bounce_time_total': 4.2,
    'towel_visit_frequency': 0.31,        # per minute
    'towel_visit_duration_avg': 4.2,      # seconds
    'water_sip_duration': 2.1,
    'changeover_walk_speed': 0.91,        # m/s
    'walk_to_baseline_speed': 1.12,
    'walk_to_towel_speed': 0.87,
    'pause_at_back_fence': 3.4,           # seconds
    # ... 2 more timing metrics
    
    # Behavioral gestures (15 metrics)
    # Detected from pose patterns
    'face_touch_frequency': 0.4,          # per minute
    'face_touch_duration_avg': 1.2,       # seconds
    'towel_to_face_duration': 2.8,
    'bent_over_time_pct': 18.2,           # % of rest time
    'bent_over_duration_avg': 4.1,        # seconds per instance
    'hand_on_hip_count': 2,               # per game
    'shirt_pull_count': 5,
    'shoulder_roll_count': 1,
    'head_shake_count': 3,
    'knee_bend_during_rest': 135,         # degrees (should be ~90)
    'stretch_gesture_count': 2,
    'thigh_rub_count': 1,                 # self-massage
    # ... 3 more gestures
    
    # Movement patterns (10 metrics)
    'time_in_ready_position': 67.3,       # % of point time
    'time_at_baseline': 78.4,
    'time_at_net': 12.1,
    'court_coverage_area': 45.3,          # m² covered
    'lateral_movement_pct': 68.2,
    'forward_movement_pct': 31.8,
    # ... 4 more patterns
}
```

#### Category 3: Delta Features (50 metrics)
**Current vs baseline comparisons - MOST IMPORTANT for fatigue**

```python
DELTA_FEATURES = {
    # vs First-set baseline (25 metrics)
    'recovery_time_delta_pct': +23.0,     # 23% slower
    'stride_length_delta_pct': -6.5,      # 6.5% shorter
    'knee_flexion_delta_deg': -8.2,       # 8° less bend
    'serve_routine_delta_pct': +11.0,     # 11% longer
    'towel_frequency_delta_pct': +107.0,  # 2x more visits
    'between_point_delta_pct': +15.0,     # 15% longer rest
    'stride_asymmetry_delta_pct': +45.0,  # asymmetry increased
    'balance_score_delta': -0.09,         # balance degraded
    'center_velocity_delta_pct': -12.3,   # moving slower
    'vertical_oscillation_delta_pct': +18.7,  # more bouncy gait
    # ... 15 more first-set deltas
    
    # vs Last-10-minutes rolling (15 metrics)
    'recovery_velocity_trend': -0.14,     # m/s slower (trending down)
    'stride_asymmetry_trend': +1.8,       # getting worse
    'knee_bend_trend': -0.6,              # degrees/minute decline
    'serve_routine_trend': +0.3,          # seconds/minute increase
    # ... 11 more trend metrics
    
    # vs Last-5-games rolling (10 metrics)
    'first_serve_win_pct_change': -12.0,  # percentage points
    'unforced_error_rate_change': +8.5,
    'rally_length_change': -1.2,          # shots per rally
    'ace_rate_change': -0.15,
    # ... 6 more recent-game deltas
}
```

#### Category 4: Performance Features (30 metrics)
**Extracted from scoreboard OCR**

```python
PERFORMANCE_FEATURES = {
    # Serve statistics (rolling 10-point windows)
    'first_serve_in_pct': 0.62,
    'first_serve_win_pct': 0.67,
    'second_serve_win_pct': 0.43,
    'aces_per_service_game': 0.6,
    'double_faults_per_game': 0.4,
    'service_game_hold_rate': 0.82,
    
    # Return statistics
    'break_point_conversion_rate': 0.31,
    'return_game_win_pct': 0.18,
    'return_points_won_pct': 0.38,
    
    # Rally patterns
    'unforced_errors_per_game': 1.8,
    'forced_errors_per_game': 1.2,
    'winners_per_game': 2.1,
    'rally_length_avg': 4.2,              # shots
    'rally_length_before_error': 3.8,
    
    # Streaks & momentum
    'consecutive_points_won': 2,
    'consecutive_points_lost': 3,
    'consecutive_games_won': 1,
    'consecutive_games_lost': 2,
    'points_won_last_10': 4,
    
    # ... 11 more performance metrics
}
```

#### Category 5: Context Features (20 metrics)
**Match state and environment**

```python
CONTEXT_FEATURES = {
    # Match state
    'match_duration_minutes': 127,
    'games_played_total': 23,
    'set_number': 3,
    'game_number_in_set': 7,
    'points_played_total': 214,
    'time_since_changeover': 4.2,         # minutes
    'games_until_changeover': 2,
    'is_crucial_moment': True,            # set point, break point, etc.
    'momentum_score': 0.34,               # -1 to 1 (favoring opponent)
    
    # Player context
    'player_age': 36,
    'player_height_m': 1.88,
    'opponent_rating': 1,                 # ATP ranking
    'head_to_head_record': 0.5,           # win rate vs opponent
    
    # Environmental
    'surface_type': 'hard',               # hard/clay/grass
    'tournament_stage': 'final',
    'temperature_celsius': 28,            # from broadcast/API
    'humidity_pct': 65,
    'time_of_day': 'afternoon',
    'indoor_outdoor': 'outdoor'
}
```

### Feature Extraction Code

```python
class FeatureExtractor:
    """
    Extracts all 200+ features from video frames
    """
    
    def __init__(self):
        self.player_baselines = {}  # Loaded from database
        self.history_buffer = {}    # Last N frames per player
        
    def extract_all_features(self, frame_data):
        """
        Main extraction pipeline
        
        Input:
          frame_data = {
            'frame': np.array,
            'timestamp': float,
            'players': [
              {
                'id': 'djokovic_novak',
                'bbox': [x1, y1, x2, y2],
                'pose_2d': {...},
                'pose_3d': {...}
              },
              {
                'id': 'alcaraz_carlos',
                ...
              }
            ],
            'homography': np.array,
            'homography_quality': 'good',
            'scoreboard': {...}
          }
        
        Output:
          features = {
            'djokovic_novak': [f1, f2, ... f200],
            'alcaraz_carlos': [f1, f2, ... f200]
          }
        """
        
        features = {}
        
        for player in frame_data['players']:
            player_id = player['id']
            
            # 1. Kinematic features
            kinematic = self.extract_kinematic(
                player['pose_3d'],
                frame_data['homography']
            )
            
            # 2. Temporal features
            temporal = self.extract_temporal(
                player_id,
                frame_data['timestamp'],
                self.history_buffer[player_id]
            )
            
            # 3. Delta features (compare to baseline)
            baseline = self.player_baselines[player_id]
            deltas = self.compute_deltas(
                kinematic,
                temporal,
                baseline
            )
            
            # 4. Performance features (from scoreboard)
            performance = self.extract_performance(
                player_id,
                frame_data['scoreboard']
            )
            
            # 5. Context features
            context = self.extract_context(
                player_id,
                frame_data
            )
            
            # Combine all
            features[player_id] = {
                **kinematic,    # 60 features
                **temporal,     # 40 features
                **deltas,       # 50 features
                **performance,  # 30 features
                **context       # 20 features
            }
            # Total: 200 features
            
            # Update history buffer
            self.history_buffer[player_id].append({
                'timestamp': frame_data['timestamp'],
                'features': features[player_id]
            })
        
        return features
```

---

## 8. Libraries & Technologies

### Core CV Libraries

#### Pose Estimation
```yaml
MMPose (OpenMMLab):
  Repository: https://github.com/open-mmlab/mmpose
  Version: v1.3+
  Model: RTMPose-m (real-time optimized)
  Performance: 75.8% AP on COCO, 90+ FPS CPU
  Use: Primary pose estimation
  
Alternative - Pose2Sim:
  Repository: https://github.com/perfanalytics/pose2sim
  Use: 3D lifting, sports-specific models
  
Alternative - Sports2D:
  Repository: https://github.com/davidpagnon/Sports2D
  Use: 2D to 3D with calibration
```

#### Object Detection & Tracking
```yaml
YOLOv8 (Ultralytics):
  Repository: https://github.com/ultralytics/ultralytics
  Model: YOLOv8n (nano for speed)
  Performance: 10-15ms inference on RTX 4090
  Use: Player detection
  
ByteTrack:
  Repository: https://github.com/FoundationVision/ByteTrack
  Paper: ECCV 2022
  Performance: 80.3 MOTA on MOT17
  Use: Multi-object tracking with occlusion handling
  
Alternative - Soccer Tracking:
  Repository: https://github.com/Anudeep007-hub/soccer-multi-object-tracking
  Features: YOLOv8 + ByteTrack + team assignment
```

#### Tennis-Specific CV
```yaml
Tennis Analysis (Court + Ball):
  Repository: https://github.com/abdullahtarek/tennis_analysis
  Features:
    - Pre-trained court keypoint detector
    - Fine-tuned ball detector (YOLO)
    - Player speed calculation
  Use: Base layer for court/ball detection
  
Roboflow Sports:
  Repository: https://github.com/roboflow/sports
  Features: Camera calibration, court detection tools
  Use: Calibration utilities
```

#### Camera Calibration
```yaml
SoccerNet Calibration:
  Repository: https://github.com/SoccerNet/sn-calibration
  Features: Multi-angle calibration, benchmark methods
  Paper: SoccerNet Camera Calibration Challenge
  Use: Adapt techniques for tennis
  
Awesome Sports Calibration:
  Repository: https://github.com/cemunds/awesome-sports-camera-calibration
  Content: 40+ research papers on sports calibration
  Use: Reference for advanced techniques
  
MC-Calib (Multi-Camera):
  Repository: https://github.com/rameau-fr/MC-Calib
  Use: If expanding to multi-camera setup (future)
```

#### Scoreboard OCR
```yaml
ScoreSight:
  Repository: https://github.com/royshil/scoresight
  Features: Real-time scoreboard OCR for broadcasts
  Platforms: Windows, Mac, Linux
  Inputs: USB, NDI, Screen Capture, RTSP
  Languages: 12 languages supported
  Use: Primary scoreboard detection
  
EasyOCR:
  Repository: https://github.com/JaidedAI/EasyOCR
  Use: Fallback OCR engine
  
Tesseract OCR:
  Repository: https://github.com/tesseract-ocr/tesseract
  Use: Additional OCR option
```

### Machine Learning & AI

#### Self-Supervised Learning
```yaml
XGBoost:
  Repository: https://github.com/dmlc/xgboost
  Use: Primary pattern discovery algorithm
  
LightGBM:
  Repository: https://github.com/microsoft/LightGBM
  Use: Alternative gradient boosting
  
CatBoost:
  Repository: https://github.com/catboost/catboost
  Use: Categorical feature handling
  
PyTorch:
  Repository: https://github.com/pytorch/pytorch
  Use: Deep learning (temporal encoders, depth estimation)
```

#### Sports Prediction Examples
```yaml
MatchOutcomeAI:
  Repository: https://github.com/ratloop/MatchOutcomeAI
  Features: Gradient Boosting, probability calibration
  Use: Reference for prediction architecture
  
ProphitBet:
  Repository: https://github.com/kochlisGit/ProphitBet-Soccer-Bets-Predictor
  Features: Neural networks + Random Forests
  Use: Reference for ensemble methods
  
SportsBet:
  Repository: https://github.com/clemsage/SportsBet
  Features: Value betting, Kelly criterion
  Use: Reference for betting logic
```

### Web Scraping & Data Collection

#### AI Agents
```yaml
LangChain:
  Repository: https://github.com/langchain-ai/langchain
  Use: Agent orchestration, web scraping
  
CrewAI:
  Repository: https://github.com/joaomdmoura/crewAI
  Use: Multi-agent coordination
  
BeautifulSoup4:
  Library: bs4
  Use: HTML parsing
  
Scrapy:
  Repository: https://github.com/scrapy/scrapy
  Use: Advanced web scraping
```

#### YouTube Integration
```yaml
YouTube Data API v3:
  Documentation: https://developers.google.com/youtube/v3
  Use: Video search, metadata retrieval
  
YouTube IFrame Player API:
  Documentation: https://developers.google.com/youtube/iframe_api_reference
  Use: Embed video player, control playback
  
Playwright:
  Repository: https://github.com/microsoft/playwright
  Use: Browser automation, screen capture
```

### Infrastructure

#### Video Processing
```yaml
FFmpeg:
  Repository: https://github.com/FFmpeg/FFmpeg
  Use: Video decoding, frame extraction
  
PyAV:
  Repository: https://github.com/PyAV-Org/PyAV
  Use: Python bindings for FFmpeg
  
OpenCV:
  Repository: https://github.com/opencv/opencv
  Use: Image processing, line detection, homography
```

#### Backend Services
```yaml
FastAPI:
  Repository: https://github.com/tiangolo/fastapi
  Use: REST API, WebSocket server
  
Redis:
  Repository: https://github.com/redis/redis
  Use: Real-time pub/sub, caching
  
PostgreSQL:
  Database: Postgres 15+
  Use: Player profiles, match metadata
  
TimescaleDB:
  Extension: Postgres time-series
  Use: Feature time-series storage
```

#### Frontend
```yaml
Next.js:
  Repository: https://github.com/vercel/next.js
  Use: Web dashboard
  
React:
  Repository: https://github.com/facebook/react
  Use: UI components
  
Tailwind CSS:
  Repository: https://github.com/tailwindlabs/tailwindcss
  Use: Styling
  
Recharts:
  Repository: https://github.com/recharts/recharts
  Use: Data visualization
```

#### Deployment
```yaml
Docker:
  Use: Containerization
  
Kubernetes:
  Use: Orchestration (GKE)
  
Terraform:
  Use: Infrastructure as code (GCP)
  
GCP Services:
  - Cloud Storage (GCS): Feature store
  - Vertex AI: Model training
  - Pub/Sub: Job queue
  - Cloud Run: API hosting
```

### Research Datasets & Papers

```yaml
SportsPose Dataset:
  Repository: https://github.com/ChristianIngwersen/SportsPose
  Content: Dynamic 3D sports pose dataset
  Use: Training/validation data
  
Awesome CV in Sports:
  Repository: https://github.com/avijit9/awesome-computer-vision-in-sports
  Content: 100+ research papers
  Use: Literature review
  
Awesome Sports AI:
  Repository: https://github.com/firefly-cpp/awesome-computational-intelligence-in-sports
  Content: Sports fatigue detection papers
  Use: Feature engineering references
```

---

## 9. Data Flow & Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │Video Library│  │Training      │  │Live Dashboard │  │
│  │(Drag & Drop)│  │Wizard        │  │(Real-time)    │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼───────────────────┼──────────┘
          │                 │                   │
          │    ┌────────────▼───────────────────▼─────┐
          │    │     ORCHESTRATOR SERVICE             │
          │    │  (Python + FastAPI + Celery)         │
          │    └────────────┬─────────────────────────┘
          │                 │
┌─────────▼─────────────────▼──────────────────────────────┐
│              AUTONOMOUS AI AGENTS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │YouTube Agent │  │Scraper Agent │  │Validator     │   │
│  │(Find Videos) │  │(Player Data) │  │Agent         │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────▼──────────────────────┐
          │      KNOWLEDGE BASE                     │
          │  ┌──────────────┐  ┌─────────────────┐ │
          │  │Player DB     │  │Match Outcomes   │ │
          │  │(Postgres)    │  │(Postgres)       │ │
          │  └──────────────┘  └─────────────────┘ │
          │  ┌──────────────┐  ┌─────────────────┐ │
          │  │Video Index   │  │Feature Store    │ │
          │  │(Postgres)    │  │(Parquet/GCS)    │ │
          │  └──────────────┘  └─────────────────┘ │
          └──────────────────┬──────────────────────┘
                             │
          ┌──────────────────▼──────────────────────┐
          │      VIDEO PROCESSING PIPELINE          │
          │  ┌──────────────────────────────────┐   │
          │  │ Frame Ingestion                   │   │
          │  │ (YouTube Embed + Screen Capture)  │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Scene Analysis                    │   │
          │  │ - Cut detection                   │   │
          │  │ - Angle classification            │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Court Calibration                 │   │
          │  │ - Line detection                  │   │
          │  │ - Homography computation          │   │
          │  │ - Session management              │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Player Detection & Tracking       │   │
          │  │ - YOLO detection                  │   │
          │  │ - ByteTrack tracking              │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Pose Estimation                   │   │
          │  │ - MMPose RTMPose                  │   │
          │  │ - 2D to 3D lifting                │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Biomechanics Extraction           │   │
          │  │ - Joint angles                    │   │
          │  │ - Motion analysis                 │   │
          │  │ - Stride/recovery metrics         │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Scoreboard OCR                    │   │
          │  │ - ScoreSight / EasyOCR            │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Feature Aggregation               │   │
          │  │ - 200+ features per 0.5s          │   │
          │  │ - Delta computation               │   │
          │  └────────────┬─────────────────────┘   │
          └───────────────┼──────────────────────────┘
                          │
          ┌───────────────▼──────────────────────────┐
          │      LEARNING ENGINE                     │
          │  ┌──────────────────────────────────┐   │
          │  │ Pattern Discovery                 │   │
          │  │ (XGBoost / Neural Nets)           │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Prediction Validation             │   │
          │  │ - Compare predictions to outcomes │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Model Updates                     │   │
          │  │ - Continuous learning             │   │
          │  │ - Accuracy tracking               │   │
          │  └────────────┬─────────────────────┘   │
          └───────────────┼──────────────────────────┘
                          │
          ┌───────────────▼──────────────────────────┐
          │      PREDICTION SERVICE                  │
          │  ┌──────────────────────────────────┐   │
          │  │ Real-time Inference               │   │
          │  │ (FastAPI + Redis)                 │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ Alert Generation                  │   │
          │  │ - Threshold checks                │   │
          │  │ - Confidence scoring              │   │
          │  └────────────┬─────────────────────┘   │
          │               │                          │
          │  ┌────────────▼─────────────────────┐   │
          │  │ WebSocket Notification            │   │
          │  │ (Push to dashboard)               │   │
          │  └────────────┬─────────────────────┘   │
          └───────────────┼──────────────────────────┘
                          │
          ┌───────────────▼──────────────────────────┐
          │      USER DECISION                       │
          │  - Review alert                          │
          │  - Check live odds                       │
          │  - Make manual bet decision              │
          │  - Log outcome                           │
          └──────────────────────────────────────────┘
```

### Data Flow Example (Training)

```
Step 1: USER INPUT
  ├─ Upload: matches.csv (100 match names)
  └─ Click: "Start Training"

Step 2: YOUTUBE AGENT
  ├─ Search API for each match
  ├─ Filter: duration > 2hr, quality >= 720p
  └─ Store: video_id in database

Step 3: SCRAPER AGENT
  ├─ For each player in match:
  │  ├─ Wikipedia API → height, hand, DOB
  │  ├─ ATP website → ranking, stats
  │  └─ Store: player profile
  └─ For each match:
     ├─ ATP results → winner, score
     └─ Store: ground truth outcomes

Step 4: VIDEO PROCESSING (per match)
  ├─ Embed YouTube player
  ├─ Screen capture @ 30 fps
  ├─ Every frame:
  │  ├─ Classify angle
  │  ├─ Calibrate court (if needed)
  │  ├─ Detect players (YOLO)
  │  ├─ Track IDs (ByteTrack)
  │  ├─ Estimate pose (MMPose)
  │  ├─ Compute 3D positions
  │  ├─ Extract 200+ features
  │  └─ OCR scoreboard
  └─ Save: features to Parquet

Step 5: LEARNING (after all videos processed)
  ├─ Load: All feature vectors + outcomes
  ├─ For each 2-minute window:
  │  ├─ Current features → Make prediction
  │  ├─ Wait for outcome → Validate prediction
  │  └─ Update model accuracy
  └─ Discover patterns:
     ├─ Pattern #1: {...} → 78% accurate
     ├─ Pattern #2: {...} → 71% accurate
     └─ ... (83 patterns total)

Step 6: OUTPUT
  ├─ Trained model saved
  ├─ Pattern library created
  ├─ Accuracy report generated
  └─ Dashboard: "Ready for live use"
```

### Data Flow Example (Live Monitoring)

```
Step 1: USER INPUT
  ├─ Select: Live stream URL
  └─ Click: "Start Monitoring"

Step 2: FRAME INGESTION (30 fps)
  ├─ Embed stream in player
  └─ Capture frames continuously

Step 3: REAL-TIME PROCESSING
  Every frame (33ms):
    ├─ Classify angle → "baseline_high"
    ├─ Retrieve calibration → Homography H
    ├─ Detect players → 2 bboxes
    ├─ Track IDs → Djokovic, Alcaraz
    ├─ Pose estimation → 17 keypoints each
    ├─ 3D lifting → Real-world coordinates
    ├─ Biomechanics → 200+ features
    └─ OCR scoreboard → Match state

Step 4: AGGREGATION (every 0.5s)
  ├─ Collect 15 frames of features
  ├─ Compute rolling averages
  ├─ Load player baseline from DB
  ├─ Calculate deltas (vs baseline)
  └─ Assemble feature vector

Step 5: PREDICTION (every 2 minutes)
  ├─ Input: Current feature vector
  ├─ Model: Check all 83 patterns
  ├─ Match: Pattern #23 detected (78% confidence)
  ├─ Prediction: "Djokovic will lose next 2-3 games"
  └─ Confidence: 78%

Step 6: ALERT DECISION
  IF confidence > 75% AND pattern accuracy > 70%:
    ├─ Generate alert
    ├─ Format: JSON with evidence
    └─ Send via WebSocket

Step 7: DASHBOARD UPDATE
  ├─ Receive: WebSocket message
  ├─ Display: "⚠ Djokovic fatigue detected (78%)"
  ├─ Evidence: "Recovery +23%, Stride -6%, Towel +107%"
  └─ Timer: "Valid for next 120 seconds"

Step 8: USER DECISION
  ├─ User sees alert
  ├─ Checks: Live betting odds
  ├─ Decides: Place bet or skip
  └─ Logs: Decision + outcome (for system eval)
```

---

## 10. Implementation Roadmap

### Phase 1: Proof of Concept (8 weeks, $8-12k)

#### Goals
- Validate technical feasibility
- Prove self-supervised learning works
- Demonstrate end-to-end pipeline on 10 matches

#### Week 1-2: Foundation
**Deliverables:**
- [ ] Repo structure created
- [ ] Docker development environment
- [ ] YouTube API integration working
- [ ] Wikipedia/ATP scraping working
- [ ] Basic player database (10 players)

**Technologies:**
- Python 3.10+
- Docker + docker-compose
- PostgreSQL database
- YouTube Data API v3

#### Week 3-4: CV Pipeline MVP
**Deliverables:**
- [ ] Court detection (from abdullahtarek/tennis_analysis)
- [ ] YOLOv8 player detection working
- [ ] ByteTrack integration
- [ ] MMPose pose estimation working
- [ ] Basic calibration (single angle)

**Technologies:**
- YOLOv8 (Ultralytics)
- ByteTrack
- MMPose (RTMPose-m)
- OpenCV for calibration

#### Week 5-6: Feature Extraction
**Deliverables:**
- [ ] 50 core features extracted (subset of 200)
- [ ] Scoreboard OCR working (EasyOCR)
- [ ] Player identification working
- [ ] Feature storage (Parquet)

**Technologies:**
- NumPy, SciPy for biomechanics
- EasyOCR
- Pandas + Parquet

#### Week 7-8: Learning Loop & Dashboard
**Deliverables:**
- [ ] Self-supervised learning working on 10 matches
- [ ] Pattern discovery (XGBoost)
- [ ] Prediction validation
- [ ] Basic web dashboard (Next.js)
- [ ] Accuracy report

**Technologies:**
- XGBoost
- FastAPI
- Next.js + React
- Recharts for visualization

#### Success Criteria
- ✅ Process 10 matches autonomously
- ✅ Extract features from 80%+ of frames
- ✅ Discover 10-20 patterns
- ✅ Achieve 55-65% prediction accuracy
- ✅ Web dashboard shows results

---

### Phase 2: Production System (12 weeks, $20-30k)

#### Week 9-11: Scale to 100 Matches
**Deliverables:**
- [ ] Autonomous agent orchestration (LangChain)
- [ ] Parallel video processing (Celery)
- [ ] Process 100+ matches
- [ ] Feature set expanded to 200+

#### Week 12-14: Multi-Angle System
**Deliverables:**
- [ ] Angle classification CNN trained
- [ ] Adaptive calibration working
- [ ] Session management implemented
- [ ] Angle memory cache
- [ ] Degraded mode fallback

#### Week 15-17: Advanced ML
**Deliverables:**
- [ ] Ensemble models (XGBoost + Neural Net)
- [ ] Temporal encoder (TCN/LSTM)
- [ ] Probability calibration (Platt scaling)
- [ ] Confidence scoring system
- [ ] Model versioning (MLflow)

#### Week 18-20: Production Infrastructure
**Deliverables:**
- [ ] GCP deployment (Terraform)
- [ ] Kubernetes cluster (GKE)
- [ ] Redis pub/sub for alerts
- [ ] WebSocket real-time streaming
- [ ] Monitoring (Prometheus + Grafana)

#### Week 21-23: UI/UX Polish
**Deliverables:**
- [ ] Desktop app (Electron) OR
- [ ] Production web app
- [ ] Live dashboard with real-time updates
- [ ] Alert management
- [ ] Historical performance tracking

#### Week 24: Testing & Optimization
**Deliverables:**
- [ ] Performance optimization (<350ms latency)
- [ ] Load testing (4 streams)
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Documentation

#### Success Criteria
- ✅ Process 100+ matches autonomously
- ✅ 64-74% prediction accuracy
- ✅ <350ms real-time latency
- ✅ Handle 2-4 simultaneous streams
- ✅ Production-ready dashboard

---

### Phase 3: Maintenance & Iteration (Ongoing, $5k/month)

#### Monthly Tasks
- [ ] Add new match data (20-30 matches/month)
- [ ] Retrain model monthly
- [ ] Monitor prediction accuracy
- [ ] Fix bugs
- [ ] Add requested features

#### Quarterly Tasks
- [ ] Major model updates
- [ ] Performance optimization
- [ ] Security audits
- [ ] Feature engineering improvements

---

## 11. Budget & Timeline

### Phase 1: Proof of Concept
**Duration:** 8 weeks  
**Cost:** $8,000 - $12,000

| Item | Cost |
|------|------|
| Developer (part-time, 20hr/week × 8 weeks) | $6,400 - $9,600 |
| YouTube API quota | $0 - $100 |
| Cloud compute (dev/test) | $300 - $500 |
| Tools & licenses | $300 - $400 |
| Contingency (20%) | $1,000 - $1,500 |
| **TOTAL** | **$8,000 - $12,000** |

**Deliverables:**
- Working prototype on 10 matches
- Proof that autonomous learning works
- Basic web dashboard
- Accuracy report

**Decision Point:**
- ✅ Accuracy > 55% → Proceed to Phase 2
- ❌ Accuracy < 55% → Investigate issues, pivot approach

---

### Phase 2: Production System
**Duration:** 16 weeks  
**Cost:** $20,000 - $30,000

| Item | Cost |
|------|------|
| Developer (full-time, 40hr/week × 16 weeks) | $16,000 - $25,000 |
| Cloud infrastructure (GCP) | $1,500 - $2,500 |
| GPU compute (training) | $800 - $1,200 |
| YouTube API quota (higher tier) | $200 - $500 |
| Tools, libraries, datasets | $500 - $800 |
| Contingency (15%) | $2,000 - $3,000 |
| **TOTAL** | **$21,000 - $33,000** |

**Deliverables:**
- Full production system
- Multi-angle calibration
- 100+ matches processed
- Live monitoring capability
- Production dashboard
- Documentation

---

### Phase 3: Ongoing Maintenance
**Duration:** Monthly  
**Cost:** $3,000 - $5,000/month

| Item | Monthly Cost |
|------|--------------|
| Developer support (10-20hr/month) | $1,600 - $3,200 |
| Cloud hosting (GCP) | $500 - $800 |
| GPU compute (retraining) | $300 - $500 |
| APIs & services | $100 - $200 |
| Data storage | $100 - $300 |
| Monitoring & logs | $100 - $200 |
| Contingency | $300 - $500 |
| **TOTAL** | **$3,000 - $5,000/month** |

**Includes:**
- Bug fixes
- Feature updates
- Monthly model retraining
- Performance monitoring
- Security updates

---

### Total Investment

| Phase | Duration | One-Time Cost | Ongoing Cost |
|-------|----------|---------------|--------------|
| Phase 1 (Prototype) | 8 weeks | $8k - $12k | - |
| Phase 2 (Production) | 16 weeks | $20k - $30k | - |
| Phase 3 (Maintenance) | Ongoing | - | $3k - $5k/month |
| **First Year Total** | 6 months + 6 months | $28k - $42k | $18k - $30k |
| **TOTAL YEAR 1** | **12 months** | - | **$46k - $72k** |

---

### Hardware Requirements

#### Local Workstation (Recommended)
**For live monitoring:**
```
Minimum:
- CPU: Intel i7-11700 or AMD Ryzen 7 5800X
- GPU: NVIDIA RTX 3060 (12GB VRAM)
- RAM: 32 GB DDR4
- Storage: 512 GB NVMe SSD
- Cost: $1,200 - $1,800

Recommended:
- CPU: Intel i9-13900K or AMD Ryzen 9 7950X
- GPU: NVIDIA RTX 4090 (24GB VRAM)
- RAM: 64 GB DDR5
- Storage: 1 TB NVMe SSD (Gen 4)
- Cost: $3,000 - $4,500
```

**Performance:**
- Minimum: 1-2 streams, ~500ms latency
- Recommended: 2-4 streams, <350ms latency

#### Cloud Training (GCP)
**For model training:**
```
Instance: n1-highmem-8 + NVIDIA L4 GPU
- 8 vCPUs
- 52 GB RAM
- 1× NVIDIA L4 (24GB)
- Cost: ~$1.50/hour

Training time:
- 100 matches: 2-3 days (~$75-110)
- Monthly retraining: ~$100/month
```

---

## 12. Risk Mitigation

### Technical Risks

#### Risk 1: Prediction Accuracy Too Low
**Risk:** System achieves <55% accuracy (no better than random)

**Likelihood:** Medium (30%)

**Mitigation:**
- Start with Phase 1 prototype (10 matches) to validate early
- If accuracy low:
  - Add more training data (200 matches instead of 100)
  - Engineer better features (consult sports biomechanics experts)
  - Try different ML algorithms (neural nets, ensembles)
  - Narrow scope (e.g., only predict fatigue, not outcomes)

**Contingency:**
- Phase 1 costs only $8-12k (acceptable loss)
- Learnings still valuable for future projects

---

#### Risk 2: Broadcast Calibration Fails
**Risk:** Can't calibrate court from constantly changing camera

**Likelihood:** Low (15%)

**Mitigation:**
- Use proven techniques (SoccerNet calibration adapted)
- Degraded mode fallback (relative measurements only)
- Focus on high-quality angles (baseline_high, 60% of time)
- Skip problematic angles (closeups, etc.)

**Contingency:**
- Use relative-only features (deltas vs baseline)
- These are actually most important for fatigue anyway
- Can still achieve 60%+ accuracy without absolute positions

---

#### Risk 3: YouTube Legal Issues
**Risk:** YouTube blocks screen capture or embeds

**Likelihood:** Low (10%)

**Mitigation:**
- Use official IFrame API (TOS compliant)
- Screen capture for personal use (fair use doctrine)
- Don't store or redistribute video
- Consult lawyer on jurisdiction

**Contingency:**
- Switch to licensed video archives
- Partner with tennis data provider
- Use own camera setup (more expensive)

---

#### Risk 4: Real-Time Performance Too Slow
**Risk:** Can't process 30 fps in real-time

**Likelihood:** Medium (25%)

**Mitigation:**
- Profile early, optimize hotspots
- Use lighter models (YOLOv8n, RTMPose-s)
- Process at 15 fps instead of 30 fps
- Skip frames during closeups

**Contingency:**
- Accept 500-1000ms latency (still usable)
- Process offline, review after match
- Upgrade hardware (RTX 4090 → A100)

---

### Business Risks

#### Risk 5: Betting Integration Complexity
**Risk:** Difficult to integrate with betting platforms

**Likelihood:** N/A (Not applicable)

**Mitigation:**
- System provides alerts only, no auto-betting
- User makes all betting decisions manually
- No platform integration needed

---

#### Risk 6: Insufficient Training Data
**Risk:** Can't find 100+ full match videos

**Likelihood:** Low (10%)

**Mitigation:**
- Start with 50 matches (sufficient for prototype)
- Use highlights (shorter) for initial testing
- Purchase licensed archives if needed

**Contingency:**
- Record own matches (time-consuming but possible)
- Partner with tennis academies
- Narrow to specific players/tournaments

---

### Legal Risks

#### Risk 7: Copyright Infringement
**Risk:** Sued for processing copyrighted video

**Likelihood:** Very Low (5%)

**Mitigation:**
- No video storage or redistribution
- Transformative use (analysis, not viewing)
- Fair use doctrine (research, personal use)
- Feature extraction only (not playback)
- Consult IP lawyer

**Contingency:**
- Switch to licensed content only
- Partner with rights holders
- Limit to public domain content

---

#### Risk 8: Player Privacy
**Risk:** Privacy issues analyzing public figures

**Likelihood:** Very Low (3%)

**Mitigation:**
- Public figures, public events
- No private data collected
- Only publicly visible behavior
- Comply with GDPR/CCPA (if applicable)

---

## Appendix A: Sample Configuration Files

### Pipeline Configuration
```yaml
# configs/pipelines/broadcast.yaml

video:
  source_type: youtube_embed  # youtube_embed | ffmpeg | camera
  fps: 30
  resolution: 1080p
  
scene:
  cut_detection:
    method: ssim  # ssim | histogram
    threshold: 0.2
  
  angle_classifier:
    model: resnet18_angle_classifier_v1
    confidence_threshold: 0.85
    
calibration:
  method: adaptive  # adaptive | fixed | none
  
  homography:
    refit_interval_frames: 60  # 2 seconds
    ransac_reproj_threshold: 3.0
    min_lines_visible: 4
    
  degraded_mode:
    enable: true
    fallback_to_relative: true
    
  angle_memory:
    enable: true
    similarity_threshold: 0.85
    
```

### Player Profile
```yaml
# configs/players/djokovic_novak.yaml

player_id: djokovic_novak
name: Novak Djokovic
aliases:
  - Djokovic
  - N. Djokovic
  - Novak
 
physical:
  height_m: 1.88
  weight_kg: 80
  hand: right
  backhand: two_handed
 
biographical:
  birthdate: 1987-05-22
  nationality: Serbia
  turned_pro: 2003
 
stats:
  current_ranking: 1
  career_titles: 99
  grand_slams: 24
 
  surfaces:
    hard: 0.842
    clay: 0.798
    grass: 0.871
    
  head_to_head:
    alcaraz_carlos: 0.5
    medvedev_daniil: 0.65
    sinner_jannik: 0.6
    
baseline_metrics:
  # Computed from historical data
  recovery_time_s: 3.1
  stride_length_m: 1.38
  knee_flexion_deg: 135
  serve_routine_s: 8.2
  towel_frequency: 0.15
  # ... (all 200 features)
```

---

## Appendix B: API Examples

### REST API

#### Start Training
```http
POST /api/v1/training/start
Content-Type: application/json

{
  "match_list": [
    {
      "name": "Djokovic vs Alcaraz Wimbledon 2024",
      "date": "2024-07-14"
    },
    {
      "name": "Federer vs Nadal Australian Open 2017",
      "date": "2017-01-29"
    }
  ],
  "config": "configs/pipelines/broadcast.yaml"
}

Response:
{
  "job_id": "train_20251010_123456",
  "status": "started",
  "estimated_duration_hours": 72,
  "matches_count": 100
}
```

#### Check Training Status
```http
GET /api/v1/training/status/train_20251010_123456

Response:
{
  "job_id": "train_20251010_123456",
  "status": "processing",  # queued | processing | completed | failed
  "progress": {
    "matches_processed": 47,
    "matches_total": 100,
    "percent": 47,
    "current_match": "Wimbledon 2024 Final",
    "eta_hours": 38.2
  },
  "preliminary_results": {
    "patterns_discovered": 32,
    "avg_prediction_accuracy": 0.642
  }
}
```

#### Start Live Monitoring
```http
POST /api/v1/live/start
Content-Type: application/json

{
  "source": {
    "type": "youtube_embed",
    "url": "https://youtube.com/watch?v=XXXXX"
  },
  "players": {
    "player_a": "djokovic_novak",
    "player_b": "alcaraz_carlos"
  },
  "alert_config": {
    "fatigue_threshold": 75,
    "confidence_min": 0.75
  }
}

Response:
{
  "session_id": "live_20251010_140532",
  "status": "started",
  "websocket_url": "wss://api.tennis-vision.ai/ws/live/live_20251010_140532"
}
```

### WebSocket API

#### Connect to Live Session
```javascript
const ws = new WebSocket('wss://api.tennis-vision.ai/ws/live/live_20251010_140532');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'features') {
    // Real-time feature updates (every 0.5s)
    console.log('Djokovic recovery time:', data.djokovic.recovery_time);
    console.log('Alcaraz fatigue index:', data.alcaraz.fatigue_index);
  }
  
  else if (data.type === 'alert') {
    // Fatigue alert detected
    displayAlert({
      player: data.player,
      fatigue_index: data.fatigue_index,
      confidence: data.confidence,
      pattern: data.pattern_name,
      evidence: data.evidence,
      recommendation: data.recommendation,
      valid_for_seconds: data.valid_for_seconds
    });
  }
  
  else if (data.type === 'calibration') {
    // Calibration status update
    console.log('Angle:', data.angle_type);
    console.log('Quality:', data.quality);
  }
};

// Example alert message:
{
  "type": "alert",
  "timestamp": "2025-10-10T14:23:45Z",
  "player": "djokovic_novak",
  "fatigue_index": 82,
  "confidence": 0.87,
  "pattern_name": "Fatigue Signature #23",
  "pattern_accuracy": 0.742,
  "evidence": [
    "Recovery time +23% vs baseline",
    "Stride length -6.5% vs baseline",
    "Towel frequency +107% vs baseline",
    "Serve routine +11% vs baseline"
  ],
  "recommendation": "Consider fade on next service game",
  "valid_for_seconds": 120,
  "historical_accuracy": "74.2% (547/737 predictions correct)"
}
```

---

## Appendix C: Glossary

**Angle Session:** Continuous period where broadcast camera maintains same angle/position

**Baseline (Player):** Statistical average of a player's metrics computed from historical matches

**ByteTrack:** State-of-the-art multi-object tracking algorithm (ECCV 2022)

**Calibration:** Process of computing geometric transform between image and real-world court

**Delta Features:** Percentage change of current metrics vs player's baseline

**Degraded Mode:** Fallback processing when court calibration fails; uses relative measurements only

**Homography:** 3×3 perspective transformation matrix mapping image plane to court plane

**Fatigue Signature:** Learned pattern of feature changes that predicts performance decline

**MMPose:** OpenMMLab's pose estimation library

**OCR:** Optical Character Recognition (text extraction from images)

**Pose Lifting:** Converting 2D joint positions to 3D coordinates

**RTMPose:** Real-Time Multi-Person Pose estimation (fast MMPose model)

**Self-Supervised Learning:** ML training without manual labels; uses match outcomes as ground truth

**YOLO:** "You Only Look Once" - fast object detection algorithm

---

## Document Changelog

**v1.0 - October 10, 2025**
- Initial specification document
- Complete technical architecture
- Library research and recommendations
- Budget and timeline estimates

---

**END OF SPECIFICATION**

For questions or clarifications, contact: [Your Email]

Repository: [GitHub URL when created]
