import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import {
  AudioVolumeInfo,
  ChannelMediaOptions,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  IRtcEngineEventHandler,
  RtcSurfaceView,
  VideoRenderModeType,
  createAgoraRtcEngine,
} from "react-native-agora";

import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "VideoCall">;

type Participant = {
  uid: number;
  name: string;
  isLocal: boolean;
};

const MAX_PARTICIPANTS = 4;

const VideoCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const engineRef = useRef<IRtcEngine | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [volumeMap, setVolumeMap] = useState<Record<number, number>>({});
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const localUid = useMemo(() => Math.floor(Math.random() * 100000) + 1, []);
  const { roomCode, username } = route.params;

  const agoraAppId = Constants.expoConfig?.extra?.agoraAppId as string | undefined;
  const agoraToken = Constants.expoConfig?.extra?.agoraTempToken as string | undefined;

  useEffect(() => {
    const setup = async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const audioPermission = await Audio.requestPermissionsAsync();
      const granted =
        cameraPermission?.status === "granted" && audioPermission?.status === "granted";
      setHasPermissions(granted);

      if (!granted) {
        return;
      }

      if (!agoraAppId) {
        console.warn("Missing Agora App ID in extra.agoraAppId");
        return;
      }

      const engine = createAgoraRtcEngine();
      engineRef.current = engine;
      engine.initialize({
        appId: agoraAppId,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      const handler: IRtcEngineEventHandler = {
        onJoinChannelSuccess: () => {
          setIsJoined(true);
        },
        onUserJoined: (_connection, remoteUid) => {
          setRemoteUsers((prev) => {
            if (prev.includes(remoteUid)) return prev;
            const next = [...prev, remoteUid];
            return next.slice(0, MAX_PARTICIPANTS - 1);
          });
        },
        onUserOffline: (_connection, remoteUid) => {
          setRemoteUsers((prev) => prev.filter((id) => id !== remoteUid));
        },
        onLeaveChannel: () => {
          setRemoteUsers([]);
          setIsJoined(false);
        },
        onAudioVolumeIndication: (_connection, speakers) => {
          setVolumeMap((prev) => {
            const updated: Record<number, number> = { ...prev };
            speakers?.forEach((speaker: AudioVolumeInfo) => {
              const key = speaker.uid === 0 ? localUid : speaker.uid ?? 0;
              updated[key] = speaker.volume ?? 0;
            });
            return updated;
          });
        },
      };

      engine.registerEventHandler(handler);
      engine.enableVideo();
      engine.enableAudio();
      engine.enableAudioVolumeIndication(400, 3, true);
      engine.startPreview();

      const options: ChannelMediaOptions = {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      };

      engine.joinChannel(agoraToken || "", roomCode, localUid, options);
    };

    setup();

    return () => {
      const engine = engineRef.current;
      if (engine) {
        engine.stopPreview();
        engine.leaveChannel();
        engine.release();
        engineRef.current = null;
      }
    };
  }, [agoraAppId, localUid, roomCode]);

  const participants: Participant[] = useMemo(() => {
    const base: Participant[] = [
      { uid: localUid, name: username, isLocal: true },
    ];
    const remotes = remoteUsers.map<Participant>((uid) => ({
      uid,
      name: `Guest ${uid}`,
      isLocal: false,
    }));
    return [...base, ...remotes].slice(0, MAX_PARTICIPANTS);
  }, [localUid, remoteUsers, username]);

  const toggleMic = useCallback(() => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    engineRef.current?.muteLocalAudioStream(next);
  }, [isMicMuted]);

  const toggleVideo = useCallback(() => {
    const next = !isVideoMuted;
    setIsVideoMuted(next);
    if (next) {
      engineRef.current?.muteLocalVideoStream(true);
      engineRef.current?.stopPreview();
    } else {
      engineRef.current?.muteLocalVideoStream(false);
      engineRef.current?.startPreview();
    }
  }, [isVideoMuted]);

  const handleLeave = useCallback(() => {
    engineRef.current?.leaveChannel();
    navigation.goBack();
  }, [navigation]);

  const renderVideo = useCallback(
    (participant: Participant, index: number) => {
      const talking = (volumeMap[participant.uid] ?? 0) > 10;
      const tileStyles = [styles.videoTile, talking && styles.videoTileTalking];

      return (
        <View key={participant.uid} style={tileStyles}>
          {Platform.OS === "web" ? (
            <View style={styles.webPlaceholder}>
              <Text style={styles.webPlaceholderText}>
                {participant.isLocal ? "Local video preview" : `Remote user ${participant.uid}`}
              </Text>
            </View>
          ) : (
            <RtcSurfaceView
              style={styles.rtcSurface}
              canvas={{
                uid: participant.uid,
                channelId: roomCode,
              }}
              zOrderMediaOverlay={index !== 0}
              renderMode={VideoRenderModeType.VideoRenderModeHidden}
            />
          )}
          <View style={styles.nameBadge}>
            <Text style={styles.nameBadgeText}>{participant.name}</Text>
          </View>
        </View>
      );
    },
    [roomCode, volumeMap]
  );

  if (hasPermissions === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Permissions needed</Text>
        <Text style={styles.permissionDescription}>
          Enable camera and microphone access to join the call.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => navigation.goBack()}>
          <Text style={styles.permissionButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermissions === null || !agoraAppId) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={[styles.permissionDescription, { marginTop: 16 }]}>Preparing call…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomLabel}>Room {roomCode}</Text>
        <Text style={styles.statusText}>
          {isJoined ? "Connected" : "Connecting…"}
        </Text>
      </View>

      <View style={styles.grid}>
        {participants.map(renderVideo)}
        {participants.length < MAX_PARTICIPANTS &&
          Array.from({ length: MAX_PARTICIPANTS - participants.length }).map((_, index) => (
            <View key={`empty-${index}`} style={[styles.videoTile, styles.emptyTile]}>
              <Text style={styles.emptyTileText}>Waiting…</Text>
            </View>
          ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMicMuted && styles.controlButtonActive]}
          onPress={toggleMic}
        >
          <Text style={styles.controlText}>{isMicMuted ? "Mic Off" : "Mic On"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, isVideoMuted && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Text style={styles.controlText}>{isVideoMuted ? "Video Off" : "Video On"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.leaveButton]} onPress={handleLeave}>
          <Text style={[styles.controlText, styles.leaveText]}>Leave</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomLabel: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "700",
  },
  statusText: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "600",
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  videoTile: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(15,23,42,0.65)",
    borderWidth: 2,
    borderColor: "rgba(148,163,184,0.35)",
  },
  videoTileTalking: {
    borderColor: "#4ade80",
    shadowColor: "#4ade80",
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  rtcSurface: {
    width: "100%",
    height: "100%",
  },
  nameBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(15,23,42,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  nameBadgeText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyTile: {
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  emptyTileText: {
    color: "rgba(226,232,240,0.6)",
    fontSize: 14,
  },
  webPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  webPlaceholderText: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  controlButtonActive: {
    backgroundColor: "rgba(148, 163, 184, 0.35)",
  },
  leaveButton: {
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    borderColor: "rgba(239, 68, 68, 0.9)",
  },
  leaveText: {
    color: "#fff",
  },
  controlText: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "700",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionTitle: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "700",
  },
  permissionDescription: {
    color: "rgba(226,232,240,0.75)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(148, 163, 184, 0.25)",
  },
  permissionButtonText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
});

export default VideoCallScreen;


