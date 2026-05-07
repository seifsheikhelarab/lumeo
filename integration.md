PostMessage API Control
Control VidFast players programmatically using the PostMessage API. Perfect for watch party features and custom player integrations.

Available Commands
play
Resume video playback
iframe.contentWindow.postMessage({
    command: 'play'
}, '*');
pause
Pause video playback
iframe.contentWindow.postMessage({
    command: 'pause'
}, '*');
seek
Jump to specific time in video (seconds)
iframe.contentWindow.postMessage({
    command: 'seek',
    time: 120  // Jump to 2 minutes
}, '*');
volume
Set player volume (0.0 to 1.0)
iframe.contentWindow.postMessage({
    command: 'volume',
    level: 0.5  // Set to 50% volume
}, '*');
mute
Toggle mute state
iframe.contentWindow.postMessage({
    command: 'mute',
    muted: true  // true to mute, false to unmute
}, '*');
getStatus
Get current player status
iframe.contentWindow.postMessage({
    command: 'getStatus'
}, '*');

// Listen for response
window.addEventListener('message', ({ data }) => {
    if (data.type === 'PLAYER_EVENT' && data.data.event === 'playerstatus') {
        console.log('Current time:', data.data.currentTime);
        console.log('Duration:', data.data.duration);
        console.log('Is playing:', data.data.playing);
        console.log('Is muted:', data.data.muted);
        console.log('Volume:', data.data.volume);
    }
});
Watch Party Integration Example
Perfect for synchronizing video playback across multiple users in a watch party scenario.

// Watch Party Controller Example
class WatchPartyController {
    vidfastOrigins = [
        'https://vidfast.pro',
        'https://vidfast.in',
        'https://vidfast.io',
        'https://vidfast.me',
        'https://vidfast.net',
        'https://vidfast.pm',
        'https://vidfast.xyz'
    ]

    constructor(iframeElement) {
        this.iframe = iframeElement;
        this.setupEventListeners();
    }

    // Sync play command to all participants
    syncPlay(time) {
        this.iframe.contentWindow.postMessage({
            command: 'play',
            time: time
        }, '*');

        // Broadcast to other participants
        this.broadcastToParty({
            action: 'play',
            time: time
        });
    }

    // Sync pause command to all participants
    syncPause(time) {
        this.iframe.contentWindow.postMessage({
            command: 'pause',
            time: time
        }, '*');

        this.broadcastToParty({
            action: 'pause',
            time: time
        });
    }

    // Sync seek to specific time for all participants
    syncSeek(time) {
        this.iframe.contentWindow.postMessage({
            command: 'seek',
            time: time
        }, '*');

        this.broadcastToParty({
            action: 'seek',
            time: time
        });
    }

    // Handle incoming party commands
    handlePartyCommand(command) {
        switch (command.action) {
            case 'play':
                this.iframe.contentWindow.postMessage({
                    command: 'play'
                }, '*');
                break;
            case 'pause':
                this.iframe.contentWindow.postMessage({
                    command: 'pause'
                }, '*');
                break;
            case 'seek':
                this.iframe.contentWindow.postMessage({
                    command: 'seek',
                    time: command.time
                }, '*');
                break;
        }
    }

    broadcastToParty(command) {
        // Your party synchronization logic here
        // (WebSocket, Socket.IO, etc.)
    }

    onPlayerStatusUpdate(status) {
        // Your status update logic here
    }

    setupEventListeners() {
        // Listen for player events
        window.addEventListener('message', (event) => {
            if (!this.vidfastOrigins.includes(event.origin) || !event.data) {
                return;
            }

            if (event.data.type === 'PLAYER_EVENT') {
                const {
                    event: playerEvent,
                    currentTime
                } = event.data.data;

                switch (playerEvent) {
                    case 'play':
                        this.syncPlay(currentTime);
                        break;
                    case 'pause':
                        this.syncPause(currentTime);
                        break;
                    case 'seeked':
                        this.syncSeek(currentTime);
                        break;
                }
            }

            if (event.data.type === 'PLAYER_EVENT' && event.data.data.event === 'playerstatus') {
                this.onPlayerStatusUpdate(event.data.data);
            }
        });
    }
}

// Usage
const iframe = document.querySelector('#vidfast-player');
const watchParty = new WatchPartyController(iframe);