import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "JoinRoom">;

const USERNAME_KEY = "@familyhub_username";

const JoinRoomScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);

  const isValidRoomCode = /^[A-Za-z0-9-_]{3,16}$/.test(roomCode);

  useEffect(() => {
    const loadStoredName = async () => {
      try {
        const stored = await AsyncStorage.getItem(USERNAME_KEY);
        if (stored) setUsername(stored);
      } catch (error) {
        console.warn("Failed to load stored username", error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredName();
  }, []);

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      Alert.alert("Missing name", "Please enter a username.");
      return;
    }
    if (!isValidRoomCode) {
      Alert.alert(
        "Room code",
        "Use 3-16 letters, numbers, hyphen, or underscore."
      );
      return;
    }

    try {
      await AsyncStorage.setItem(USERNAME_KEY, username.trim());
      navigation.navigate("VideoCall", { roomCode, username: username.trim() });
    } catch (error) {
      Alert.alert("Oops", "Could not save username. Please try again.");
    }
  };

  return (
    <LinearGradient
      colors={["#6d28d9", "#2563eb"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>FH</Text>
          </View>
          <Text style={styles.title}>Family Hub</Text>
          <Text style={styles.subtitle}>
            Jump into a private room with family and friends.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor="#a5b4fc"
            value={username}
            editable={!loading}
            onChangeText={setUsername}
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 24 }]}>Room code</Text>
          <TextInput
            style={styles.input}
            placeholder="Room code (e.g. 333 or family-room)"
            placeholderTextColor="#a5b4fc"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={16}
            value={roomCode}
            onChangeText={(value) => setRoomCode(value.trim())}
            returnKeyType="done"
            onSubmitEditing={handleJoinRoom}
          />

          <TouchableOpacity
            style={[
              styles.button,
              (!username.trim() || !isValidRoomCode) && styles.buttonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleJoinRoom}
            disabled={!username.trim() || !isValidRoomCode}
          >
            <Text style={styles.buttonText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  form: {
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    gap: 12,
  },
  label: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
  button: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#facc15",
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "rgba(250, 204, 21, 0.45)",
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});

export default JoinRoomScreen;
