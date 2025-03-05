export const useStartConversation = (
  targetUrl: string,
  flowId: string,
  wsRef: React.MutableRefObject<WebSocket | null>,
  setStatus: (status: string) => void,
  startRecording: () => void,
  handleWebSocketMessage: (event: MessageEvent) => void,
  stopRecording: () => void,
) => {
  try {
    // const url = `ws://${targetUrl}/api/v1/voice/ws/${flowId}`;
    const url = `ws://${window.location.hostname}:7860/api/v1/voice/ws/flow_as_tool/${flowId}`;

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      setStatus("Connected");
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: "elevenlabs.config",
            enabled: true,
            voice_id: "NOpBlnGInO9m6vDvFkFC",
          }),
        );
      }
      startRecording();
    };

    wsRef.current.onmessage = handleWebSocketMessage;

    wsRef.current.onclose = (event) => {
      setStatus(`Disconnected (${event.code})`);
      stopRecording();
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("Connection error");
    };
  } catch (error) {
    console.error("Failed to create WebSocket:", error);
    setStatus("Connection failed");
  }
};
