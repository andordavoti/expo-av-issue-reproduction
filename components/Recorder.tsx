import React, { FC, useEffect, useRef, useState } from "react";
import { TouchableOpacity, FlatList, View, Text, Button } from "react-native";
import { Audio } from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  deleteRecordingFromFileSystem,
  moveRecordingToDocumentDir,
} from "../utils/recorderUtils";
import RecordingItem from "./RecordingItem";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Recorder: FC = () => {
  const recording = useRef<null | Audio.Recording>(null);
  const sound = useRef<null | Audio.Sound>(null);

  const [recordings, setRecordings] = useState<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const [permission, askForPermission] = Audio.usePermissions({
    request: true,
  });

  const recordingAnimation = useSharedValue(1);

  const recordingStyle = useAnimatedStyle(() => ({
    opacity: recordingAnimation.value,
  }));

  useEffect(() => {
    if (isRecording) {
      recordingAnimation.value = withRepeat(
        withTiming(0, { duration: 1000 }),
        -1
      );
    } else {
      recordingAnimation.value = withTiming(1, { duration: 100 });
    }
  }, [isRecording, recordingAnimation]);

  useEffect(() => {
    const restoreRecordings = async () => {
      const recordings = await AsyncStorage.getItem("recordings");

      if (recordings) {
        setRecordings(JSON.parse(recordings));
      }
    };

    restoreRecordings();
  }, []);

  useEffect(() => {
    const storeRecordings = async () => {
      await AsyncStorage.setItem("recordings", JSON.stringify(recordings));
    };

    storeRecordings();
  }, [recordings]);

  useEffect(() => {
    return () => {
      stopPlayingRecording();
    };
  }, [sound]);

  const startRecording = async () => {
    try {
      setIsRecording(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      recording.current = new Audio.Recording();

      await recording.current?.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.current?.startAsync();
    } catch (err) {
      console.log(`Failed to start recording: ${err}`);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.current?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.current?.getURI();

      if (!uri) throw new Error("Could not get recording URI");

      const documentDirUri = await moveRecordingToDocumentDir(uri);

      setIsRecording(false);
      recording.current = null;

      setRecordings((recordings) => [...recordings, documentDirUri]);
    } catch (err) {
      setIsRecording(false);
      recording.current = null;
      console.log("Failed to stop recording: ", err);
    }
  };

  const playRecording = async (localUri: string) => {
    try {
      await stopPlayingRecording();

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const result = await Audio.Sound.createAsync(
        { localUri, uri: localUri },
        { shouldPlay: true },
        async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            await stopPlayingRecording();
          }
        }
      );

      sound.current = result.sound;
      setIsPlayingRecording(true);
    } catch (err) {
      console.log("Error playing recording: ", err);
    }
  };

  const stopPlayingRecording = async () => {
    await sound.current?.stopAsync();
    await sound.current?.unloadAsync();
    sound.current = null;
    setIsPlayingRecording(false);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>New Recording</Text>
      </View>

      {!permission || permission.status !== "granted" ? (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <Text
            style={{
              fontSize: 20,
              textAlign: "center",
              paddingBottom: 16,
            }}
          >
            Permission not granted
          </Text>
          <Button
            title="Grant permission"
            onPress={() => {
              askForPermission();
            }}
          />
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginVertical: 8,
          }}
        >
          <Animated.View style={recordingStyle}>
            <TouchableOpacity
              disabled={isRecording || isPlayingRecording}
              onPress={startRecording}
            >
              <MaterialCommunityIcons
                color={isPlayingRecording ? "grey" : "red"}
                name="record"
                size={22}
              />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            disabled={!isRecording && !isPlayingRecording}
            onPress={async () => {
              if (isRecording) {
                await stopRecording();
              } else if (isPlayingRecording) {
                await stopPlayingRecording();
              }
            }}
          >
            <MaterialCommunityIcons
              color={!isRecording && !isPlayingRecording ? "grey" : "black"}
              name="stop"
              size={22}
            />
          </TouchableOpacity>
        </View>
      )}

      <Text style={{ fontSize: 20, fontWeight: "500", paddingVertical: 8 }}>
        Recordings
      </Text>

      {recordings?.length ? (
        <FlatList
          keyExtractor={(_, index) => index.toString()}
          data={recordings}
          renderItem={({ item, index }) => (
            <RecordingItem
              recordingLocalUri={item}
              index={index}
              isLast={index === recordings.length - 1}
              onDelete={async (recordingToRemove) => {
                const wasDeleted = await deleteRecordingFromFileSystem(item);

                if (!wasDeleted) {
                  console.log("Failed to delete recording from file system");
                }

                const removedRecordingArr = recordings?.filter(
                  (recording) => recordingToRemove !== recording
                );

                setRecordings([...removedRecordingArr]);
              }}
              onPlay={(path) => playRecording(path)}
            />
          )}
          style={{ flexGrow: 0 }}
        />
      ) : (
        <Text style={{ fontSize: 16, paddingTop: 8 }}>No recordings yet</Text>
      )}
    </View>
  );
};

export default Recorder;
