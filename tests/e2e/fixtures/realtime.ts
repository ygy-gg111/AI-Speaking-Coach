import type { Page } from "@playwright/test";

export async function installRealtimeBrowserMocks(page: Page) {
  await page.addInitScript(() => {
    const state = {
      mediaRequests: [] as MediaTrackConstraints[],
      sentEvents: [] as Record<string, unknown>[],
      peers: [] as Array<RTCPeerConnection & { testChannel?: RTCDataChannel }>,
    };

    class FakeTrack {
      kind = "audio";
      enabled = true;
      constructor(private readonly deviceId: string) {}
      stop() {}
      getSettings() { return { deviceId: this.deviceId }; }
    }
    class FakeStream {
      constructor(private readonly track: FakeTrack) {}
      getTracks() { return [this.track]; }
      getAudioTracks() { return [this.track]; }
    }
    class FakeChannel extends EventTarget {
      readyState: RTCDataChannelState = "open";
      send(value: string) { state.sentEvents.push(JSON.parse(value)); }
      close() { this.readyState = "closed"; }
    }
    class FakePeer extends EventTarget {
      connectionState: RTCPeerConnectionState = "new";
      testChannel?: FakeChannel;
      private sender = { track: null as FakeTrack | null, replaceTrack: async (track: FakeTrack) => { this.sender.track = track; } };
      constructor() { super(); state.peers.push(this as unknown as RTCPeerConnection & { testChannel?: RTCDataChannel }); }
      createDataChannel() { this.testChannel = new FakeChannel(); return this.testChannel; }
      addTrack(track: FakeTrack) { this.sender.track = track; return this.sender; }
      getSenders() { return [this.sender]; }
      async createOffer() { return { type: "offer" as RTCSdpType, sdp: "mock-offer" }; }
      async setLocalDescription() {}
      async setRemoteDescription() {
        this.connectionState = "connected";
        this.dispatchEvent(new Event("connectionstatechange"));
        this.testChannel?.dispatchEvent(new Event("open"));
      }
      close() { this.connectionState = "closed"; }
    }

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async ({ audio }: MediaStreamConstraints) => {
          const constraints = typeof audio === "object" ? audio : {};
          state.mediaRequests.push(constraints);
          const requested = constraints.deviceId;
          const deviceId = typeof requested === "object" && "exact" in requested
            ? String(requested.exact)
            : "mic-default";
          return new FakeStream(new FakeTrack(deviceId));
        },
        enumerateDevices: async () => [
          { kind: "audioinput", deviceId: "mic-default", groupId: "g1", label: "Built-in Microphone" },
          { kind: "audioinput", deviceId: "mic-usb", groupId: "g2", label: "USB Microphone" },
        ],
      },
    });
    Object.defineProperty(window, "RTCPeerConnection", { configurable: true, value: FakePeer });
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: class { autoplay = false; srcObject: unknown = null; setAttribute() {} remove() {} async play() {} },
    });
    Object.assign(window, {
      __realtimeTest: {
        mediaRequests: state.mediaRequests,
        sentEvents: state.sentEvents,
        disconnect() {
          const peer = state.peers.at(-1) as unknown as FakePeer | undefined;
          if (!peer) return;
          peer.connectionState = "disconnected";
          peer.dispatchEvent(new Event("connectionstatechange"));
        },
        emit(event: Record<string, unknown>) {
          const peer = state.peers.at(-1) as unknown as FakePeer | undefined;
          peer?.testChannel?.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(event) }));
        },
      },
    });
  });
}
