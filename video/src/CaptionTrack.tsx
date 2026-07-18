import type { Caption } from "@remotion/captions";
import { useCallback, useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";

export const CaptionTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading verified captions"));

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile("captions-75s.json"));
      if (!response.ok) {
        throw new Error(`Could not load captions: ${response.status}`);
      }
      const data = (await response.json()) as Caption[];
      setCaptions(data);
      continueRender(handle);
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
  }, [cancelRender, continueRender, handle]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  if (!captions) {
    return null;
  }

  const currentTimeMs = (frame / fps) * 1000;
  const activeCaption = captions.find(
    (caption) => currentTimeMs >= caption.startMs && currentTimeMs < caption.endMs,
  );

  if (!activeCaption) {
    return null;
  }

  const [chinese, english] = activeCaption.text.split("\n", 2);
  const startFrame = (activeCaption.startMs / 1000) * fps;
  const endFrame = (activeCaption.endMs / 1000) * fps;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          width: 1760,
          marginBottom: 82,
          padding: "24px 34px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          color: "#ffffff",
          textAlign: "center",
          background: "rgba(5, 10, 7, 0.93)",
          borderTop: "4px solid #d8ff63",
          boxShadow: "0 20px 70px rgba(0, 0, 0, 0.52)",
          opacity: interpolate(
            frame,
            [startFrame, startFrame + 10, endFrame - 10, endFrame],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        <div style={{ fontSize: 48, lineHeight: 1.18, fontWeight: 750 }}>{chinese}</div>
        <div style={{ fontSize: 42, lineHeight: 1.2, fontWeight: 550, color: "#d8ff63" }}>
          {english}
        </div>
      </div>
    </AbsoluteFill>
  );
};
