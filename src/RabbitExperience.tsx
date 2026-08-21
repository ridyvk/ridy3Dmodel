import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";

const RabbitCanvas = lazy(() => import("./RabbitCanvas"));

class RabbitErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ridy 3D render failed", error, info.componentStack);
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function supportsWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", {
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
    });
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

export default function RabbitExperience() {
  const [ready, setReady] = useState(false);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    if (!supportsWebGL2()) setRenderError(true);
  }, []);

  return (
    <main className="ridy-app" aria-label="自然に動くうさちゃんの3Dモデル">
      <div
        className={`loading-rabbit ${ready && !renderError ? "is-hidden" : ""}`}
        aria-hidden={ready && !renderError}
      >
        <img src={`${import.meta.env.BASE_URL}icons/icon-512.png`} alt="ridy" />
      </div>

      {!renderError && (
        <div className={`rabbit-stage ${ready ? "is-ready" : ""}`}>
          <RabbitErrorBoundary onError={() => setRenderError(true)}>
            <Suspense fallback={null}>
              <RabbitCanvas onReady={() => setReady(true)} />
            </Suspense>
          </RabbitErrorBoundary>
        </div>
      )}
    </main>
  );
}
