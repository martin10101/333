import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import JoinRoomScreen from "../screens/JoinRoomScreen";
import VideoCallScreen from "../screens/VideoCallScreen";

export type RootStackParamList = {
  JoinRoom: undefined;
  VideoCall: { roomCode: string; username: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="JoinRoom"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
        <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
