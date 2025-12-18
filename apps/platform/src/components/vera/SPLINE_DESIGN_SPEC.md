# VERA Orb Spline Design Specification

## Scene Setup

Open https://spline.design and create a new project named "VERA Orb"

### Canvas Settings
- Background: Transparent (for web embed)
- Camera: Orthographic or Perspective (45° FOV)
- Lighting: 3-point setup (key, fill, rim)

---

## 3D Objects

### 1. Pearl Orb (Main Sphere)
**Object Name:** `Orb` (required for code reference)

| Property | Value |
|----------|-------|
| Shape | Sphere |
| Size | 200px diameter |
| Position | Center (0, 0, 0) |

**Material (PBR):**
- Base Color: `#E8E8EC` (pearl white)
- Metalness: 0.1
- Roughness: 0.15
- Iridescence: 0.3 (subtle rainbow shift)
- Environment Map: Studio HDRI

**Embossed Text on Surface:**
- "V" - Large, centered, `#9CA3AF` color, slight depth
- "VERA" - Below V, smaller, same color

---

### 2. Orbital Ring (Torus)
**Object Name:** `Ring`

| Property | Value |
|----------|-------|
| Shape | Torus |
| Major Radius | 280px |
| Minor Radius | 3px |
| Position | Center, same as Orb |

**Material:**
- Base Color: `#FFFFFF`
- Emission: `#FFFFFF` at 0.5 intensity (soft glow)
- Opacity: 0.8

---

### 3. Orange Accent Nodes (4x Spheres)
**Object Names:** `Node1`, `Node2`, `Node3`, `Node4`

| Property | Value |
|----------|-------|
| Shape | Sphere |
| Size | 12px diameter |
| Positions | On ring at 0°, 90°, 180°, 270° |

**Material:**
- Base Color: `#F97316` (orange-500)
- Emission: `#F97316` at 0.8 intensity
- Glow Effect: Enabled

---

### 4. Floating Labels (3D Text)
**Object Names:** `LabelMetaLoop`, `LabelPolicy`, `LabelProof`, `LabelPartners`

| Label | Position on Ring |
|-------|-----------------|
| META-LOOP | Top (12 o'clock) |
| POLICY | Right (3 o'clock) |
| PROOF | Bottom (6 o'clock) |
| PARTNERS | Left (9 o'clock) |

**Text Properties:**
- Font: Inter or SF Pro (sans-serif)
- Size: 14px
- Color: `#6B7280` (gray-500)
- Letter Spacing: 2px (tracking)
- Face: Outward from ring center

---

### 5. Orange Glow Base
**Object Name:** `GlowBase`

| Property | Value |
|----------|-------|
| Shape | Ellipse/Plane |
| Size | 300px x 100px |
| Position | Below orb (y: -120) |
| Rotation | Flat (x: -90°) |

**Material:**
- Base Color: `#F97316`
- Emission: `#F97316` at 1.0
- Opacity: 0.4
- Blur/Feather: Maximum

---

## Animations

### Idle Animation (Always Playing)
1. **Ring Rotation**
   - Rotate `Ring` around Y-axis
   - Speed: 360° per 20 seconds
   - Easing: Linear, loop infinite

2. **Orb Float**
   - Move `Orb` on Y-axis: ±10px
   - Duration: 3 seconds
   - Easing: Ease-in-out, loop (ping-pong)

3. **Node Pulse**
   - Scale nodes: 1.0 → 1.2 → 1.0
   - Duration: 2 seconds each
   - Stagger: 0.5s between nodes

---

### Hover State
**Trigger:** Mouse hover on `Orb`

1. Scale `Orb`: 1.0 → 1.05
2. Increase `GlowBase` emission: 1.0 → 1.5
3. Speed up ring rotation: 2x
4. Duration: 0.3s, ease-out

---

### Mouse Follow (Tilt)
**Event:** Mouse Move on canvas

1. Calculate angle from cursor to orb center
2. Rotate `Orb` toward cursor: max ±15° on X/Y axes
3. Smooth interpolation (lerp factor: 0.1)

---

### Click Animation
**Trigger:** Mouse click on `Orb`

1. Pulse scale: 1.0 → 1.1 → 1.0
2. Flash `GlowBase`: emission spike to 2.0
3. Duration: 0.2s

---

## Events (for React Integration)

Create these Spline events:

| Event Name | Trigger | Action |
|------------|---------|--------|
| `onOrbClick` | Click on `Orb` | Emit to React |
| `onOrbHover` | Hover on `Orb` | Trigger hover animation |
| `onOrbHoverEnd` | Hover end on `Orb` | Reset to idle |

---

## Export Settings

1. Click "Export" → "Code Embed"
2. Copy the scene URL (format: `https://prod.spline.design/XXXX/scene.splinecode`)
3. Update `SPLINE_SCENE_URL` in `VERAOrb.tsx`

---

## Reference Image

The orb should match this aesthetic:
- Photorealistic pearl sphere with soft reflections
- Ethereal glow underneath
- Floating labels in a circular orbit
- Clean, minimal, premium feel


