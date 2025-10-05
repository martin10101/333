import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "VideoCall">;

type TrackPair = [IMicrophoneAudioTrack, ICameraVideoTrack];

const MAX_PARTICIPANTS = 4;

const attachVideoTrack = (elementId: string, track?: ICameraVideoTrack | null) => {
  if (!track || typeof document === "undefined") return;
  const element = document.getElementById(elementId);
  if (!element) return;

  element.innerHTML = "";
  track.play(element);
};

const detachElement = (elementId: string) => {
  if (typeof document === "undefined") return;
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = "";
  }
};

const VideoCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomCode, username } = route.params;

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<TrackPair | null>(null);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoining, setIsJoining] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localUid = useMemo(() => Math.floor(Math.random() * 100000) + 1, []);
  const agoraAppId = Constants.expoConfig?.extra?.agoraAppId as string | undefined;
  const agoraToken = Constants.expoConfig?.extra?.agoraTempToken as string | undefined;

  const refreshRemoteUsers = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    setRemoteUsers([...client.remoteUsers].slice(0, MAX_PARTICIPANTS - 1));
  }, []);

  const teardownClient = useCallback(async () => {
    const client = clientRef.current;
    const tracks = localTracksRef.current;

    if (tracks) {
      tracks.forEach((track) => {
        track.stop();
        track.close();
      });
      localTracksRef.current = null;
    }

    if (client) {
      client.removeAllListeners();
      try {
        await client.leave();
      } catch (err) {
        console.warn("Failed to leave Agora client", err);
      }
      clientRef.current = null;
    }

    if (typeof document !== "undefined") {
      detachElement("local-player");
      remoteUsers.forEach((user) => detachElement(`remote-${user.uid}`));
    }
  }, [remoteUsers]);

  useEffect(() => {
    if (!agoraAppId) {
      setErrorMessage("Missing Agora App ID. Add extra.agoraAppId to app.config.ts");
      setIsJoining(false);
      return;
    }

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (!clientRef.current) return;

      try {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          attachVideoTrack(`remote-${user.uid}`, user.videoTrack ?? null);
        } else if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      } catch (err) {
        console.warn("Failed to subscribe to remote user", err);
      }

      refreshRemoteUsers();
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (mediaType === "video") {
        user.videoTrack?.stop();
        detachElement(`remote-${user.uid}`);
      }
      if (mediaType === "audio") {
        user.audioTrack?.stop();
      }
      refreshRemoteUsers();
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      user.videoTrack?.stop();
      user.audioTrack?.stop();
      detachElement(`remote-${user.uid}`);
      refreshRemoteUsers();
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    const joinChannel = async () => {
      try {
        await client.join(agoraAppId, roomCode, agoraToken || null, localUid);

        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = tracks;

        await client.publish(tracks);
        attachVideoTrack("local-player", tracks[1]);
        tracks[0].play();

        setErrorMessage(null);
      } catch (err) {
        console.error("Failed to join Agora channel", err);
        setErrorMessage((err as Error)?.message ?? "Unable to join room");
      } finally {
        refreshRemoteUsers();
        setIsJoining(false);
      }
    };

    joinChannel();

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
      teardownClient();
    };
  }, [agoraAppId, agoraToken, localUid, refreshRemoteUsers, roomCode, teardownClient]);

  const toggleMic = useCallback(async () => {
    const tracks = localTracksRef.current;
    if (!tracks) return;

    const [audioTrack] = tracks;
    if (!audioTrack) return;

    const next = !isMicMuted;
    setIsMicMuted(next);

    try {
      await audioTrack.setEnabled(!next);
    } catch (err) {
      console.warn("Failed to toggle microphone", err);
    }
  }, [isMicMuted]);

  const toggleVideo = useCallback(async () => {
    const tracks = localTracksRef.current;
    if (!tracks) return;

    const videoTrack = tracks[1];
    if (!videoTrack) return;

    const next = !isVideoMuted;
    setIsVideoMuted(next);

    try {
      await videoTrack.setEnabled(!next);
      if (next) {
        videoTrack.stop();
        detachElement("local-player");
      } else {
        attachVideoTrack("local-player", videoTrack);
      }
    } catch (err) {
      console.warn("Failed to toggle video", err);
    }
  }, [isVideoMuted]);

  const leaveChannel = useCallback(async () => {
    await teardownClient();
    navigation.reset({ index: 0, routes: [{ name: "JoinRoom" }] });
  }, [navigation, teardownClient]);

  const remotePlaceholders = useMemo(() => {
    const count = Math.max(0, MAX_PARTICIPANTS - 1 - remoteUsers.length);
    return new Array(count).fill(null);
  }, [remoteUsers.length]);

  const statusMessage = useMemo(() => {
    if (errorMessage) return errorMessage;
    if (isJoining) return "Connecting to room...";
    const total = Math.min(MAX_PARTICIPANTS, remoteUsers.length + 1);
    return `${total} participant${total > 1 ? "s" : ""} connected`;
  }, [errorMessage, isJoining, remoteUsers.length]);

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.roomLabel}>{`Room ${roomCode}`}</Text>
          <Text style={styles.roomSub}>{`Signed in as ${username}`}</Text>
        </View>
        <Text style={[styles.status, errorMessage ? styles.statusError : null]}>
          {statusMessage}
        </Text>
      </View>

      <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContainer}>
        <View style={[styles.tile, styles.localTile]}>
          <View nativeID="local-player" style={styles.videoSurface} />
          <View style={styles.nameBadge}>
            <Text style={styles.nameBadgeText}>{username}</Text>
          </View>
          {isVideoMuted && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>Video off</Text>
            </View>
          )}
        </View>

        {remoteUsers.map((user) => (
          <View key={user.uid} style={styles.tile}>
            <View nativeID={`remote-${user.uid}`} style={styles.videoSurface} />
            <View style={styles.nameBadge}>
              <Text style={styles.nameBadgeText}>{`Guest ${user.uid}`}</Text>
            </View>
          </View>
        ))}

        {remotePlaceholders.map((_, index) => (
          <View key={`placeholder-${index}`} style={[styles.tile, styles.placeholderTile]}>
            <Text style={styles.placeholderText}>Waiting for participant...</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed,
            isMicMuted && styles.controlButtonActive,
          ]}
          onPress={toggleMic}
        >
          <Text style={styles.controlText}>{isMicMuted ? "Unmute Mic" : "Mute Mic"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed,
            isVideoMuted && styles.controlButtonActive,
          ]}
          onPress={toggleVideo}
        >
          <Text style={styles.controlText}>{isVideoMuted ? "Turn Video On" : "Turn Video Off"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            styles.leaveButton,
            pressed && styles.leaveButtonPressed,
          ]}
          onPress={leaveChannel}
        >
          <Text style={[styles.controlText, styles.leaveText]}>Leave</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  roomLabel: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "700",
  },
  roomSub: {
    color: "#cbd5f5",
    marginTop: 4,
  },
  status: {
    color: "#cbd5f5",
    fontSize: 14,
    maxWidth: 180,
    textAlign: "right",
  },
  statusError: {
    color: "#f87171",
  },
  gridScroll: {
    flex: 1,
  },
  gridContainer: {
    flexGrow: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingBottom: 24,
  },
  tile: {
    width: "46%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.65)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    overflow: "hidden",
    position: "relative",
    margin: 8,
  },
  localTile: {
    borderColor: "#4ade80",
  },
  placeholderTile: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderColor: "rgba(148,163,184,0.35)",
  },
  placeholderText: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  videoSurface: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.85)",
  },
  nameBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(15,23,42,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  nameBadgeText: {
    color: "#f8fafc",
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(30,41,59,0.85)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    marginHorizontal: 6,
  },
  controlButtonActive: {
    backgroundColor: "rgba(148,163,184,0.35)",
  },
  controlButtonPressed: {
    opacity: 0.8,
  },
  controlText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  leaveButton: {
    backgroundColor: "rgba(239,68,68,0.9)",
    borderColor: "rgba(239,68,68,0.9)",
  },
  leaveButtonPressed: {
    opacity: 0.85,
  },
  leaveText: {
    color: "#fff",
  },
});

export default VideoCallScreen;
