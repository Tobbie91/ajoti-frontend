export interface DojahWidgetOptions extends Record<string, unknown> {
  onSuccess: (response: unknown) => void;
  onError: (error: unknown) => void;
  onClose: () => void;
}

interface DojahConnect {
  setup(): void;
  open(): void;
}

declare global {
  interface Window {
    Connect?: new (options: DojahWidgetOptions) => DojahConnect;
  }
}

let scriptLoad: Promise<void> | undefined;

function loadDojahWidget(): Promise<void> {
  if (window.Connect) return Promise.resolve();
  if (scriptLoad) return scriptLoad;

  scriptLoad = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-ajoti-dojah-widget="true"]',
    );
    const script = existing ?? document.createElement("script");
    script.src = "https://widget.dojah.io/widget.js";
    script.async = false;
    script.dataset.ajotiDojahWidget = "true";
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoad = undefined;
      reject(new Error("Unable to load Dojah verification. Please try again."));
    };
    if (!existing) document.head.appendChild(script);
  });

  return scriptLoad;
}

export async function openDojahWidget(
  config: Record<string, unknown>,
  callbacks: { onSuccess: () => void; onError: (error: unknown) => void },
): Promise<void> {
  await loadDojahWidget();
  if (!window.Connect) {
    scriptLoad = undefined;
    throw new Error("Dojah verification could not be initialized. Please try again.");
  }

  const connect = new window.Connect({
    ...config,
    onSuccess: () => callbacks.onSuccess(),
    onError: (error) => callbacks.onError(error),
    onClose: () => undefined,
  });
  connect.setup();
  connect.open();
}
