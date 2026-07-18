import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CaptionTrack } from "./CaptionTrack";

type SceneDefinition = {
  from: number;
  duration: number;
  image: string;
  fit?: "cover" | "contain";
  focalLabel: string;
};

const fps = 30;

const scenes: readonly SceneDefinition[] = [
  { from: 0, duration: 6, image: "01-generated-pack-1600x900.png", focalLabel: "OPEN-SOURCE WORLD ASSET PIPELINE" },
  { from: 6, duration: 11, image: "02-workbench-1600x900.png", focalLabel: "WORLD SPEC" },
  { from: 17, duration: 11, image: "01-generated-pack-1600x900.png", focalLabel: "DETERMINISTIC OUTPUT" },
  { from: 28, duration: 10, image: "02-workbench-1600x900.png", focalLabel: "VALIDATION BEFORE EXPORT" },
  { from: 38, duration: 11, image: "03-pack-contents-1600x900.png", focalLabel: "PORTABLE PACK CONTENTS" },
  { from: 49, duration: 9, image: "05-open-contract-1600x900.png", focalLabel: "EXECUTABLE-FREE ASSET ZIP" },
  { from: 58, duration: 11, image: "04-godot-verification-1600x900.png", focalLabel: "SAME CANDIDATE PACK VERIFIED" },
  { from: 69, duration: 6, image: "cover-1260x1000.png", fit: "contain", focalLabel: "FREE · OPEN SOURCE · ALPHA" },
];

const Scene: React.FC<{ scene: SceneDefinition }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const durationInFrames = scene.duration * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050a07", overflow: "hidden" }}>
      <Img
        src={staticFile(scene.image)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: scene.fit ?? "cover",
          opacity: interpolate(
            frame,
            [0, 12, durationInFrames - 12, durationInFrames - 1],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          scale: interpolate(frame, [0, durationInFrames], [1.015, 1.055], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 100,
          right: 80,
          padding: "14px 22px",
          color: "#d8ff63",
          background: "rgba(5, 10, 7, 0.88)",
          border: "1px solid rgba(216, 255, 99, 0.48)",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 2,
          opacity: interpolate(frame, [8, 22], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {scene.focalLabel}
      </div>
      {scene.from === 69 ? (
        <div
          style={{
            position: "absolute",
            top: 116,
            left: 80,
            color: "#ffffff",
            background: "rgba(5, 10, 7, 0.92)",
            borderLeft: "8px solid #d8ff63",
            padding: "22px 30px",
            fontSize: 38,
            fontWeight: 700,
            opacity: interpolate(frame, [12, 28], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          github.com/babyrush0101-source/mapsoo-kids
        </div>
      ) : null}
      {scene.from === 17 ? (
        <div
          style={{
            position: "absolute",
            left: 240,
            right: 240,
            top: 280,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
            opacity: interpolate(frame, [14, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {["RUN A", "RUN B"].map((run) => (
            <div
              key={run}
              style={{
                padding: "34px 40px",
                color: "#ffffff",
                background: "rgba(5, 10, 7, 0.95)",
                border: "2px solid rgba(216, 255, 99, 0.52)",
              }}
            >
              <div style={{ color: "#d8ff63", fontSize: 36, fontWeight: 900, letterSpacing: 3 }}>{run}</div>
              <div style={{ marginTop: 16, fontSize: 32, lineHeight: 1.45 }}>
                spec: sunny-meadow<br />
                seed: mapsoo-demo-001
              </div>
              <div style={{ marginTop: 22, fontFamily: "Consolas, monospace", fontSize: 27, color: "#c6d3c8" }}>
                ZIP SHA-256<br />589da53a8745c47c…
              </div>
            </div>
          ))}
          <div
            style={{
              gridColumn: "1 / -1",
              justifySelf: "center",
              padding: "14px 28px",
              color: "#071006",
              background: "#d8ff63",
              fontSize: 38,
              fontWeight: 900,
            }}
          >
            RUN A = RUN B · byte-for-byte candidate ZIP
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="MapsooWorldsmith75s"
      component={MapsooWorldsmithVideo}
      durationInFrames={75 * fps}
      fps={fps}
      width={1920}
      height={1080}
      defaultProps={{ release: "v0.1.0-alpha.1" }}
    />
  );
};

const MapsooWorldsmithVideo: React.FC<{ release: string }> = ({ release }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#050a07" }}>
      {scenes.map((scene) => (
        <Sequence
          key={`${scene.from}-${scene.image}`}
          from={scene.from * fps}
          durationInFrames={scene.duration * fps}
        >
          <Scene scene={scene} />
        </Sequence>
      ))}
      <CaptionTrack />
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 42,
          height: 5,
          background: "rgba(255, 255, 255, 0.14)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${interpolate(frame, [0, 75 * fps - 1], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}%`,
            background: "#d8ff63",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 52,
          color: "rgba(255,255,255,0.68)",
          fontSize: 24,
          letterSpacing: 1,
        }}
      >
        {release}
      </div>
    </AbsoluteFill>
  );
};
