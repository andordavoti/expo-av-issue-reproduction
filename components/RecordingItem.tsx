import React, { FC } from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Share from "react-native-share";

interface Props {
  recordingLocalUri: string;
  index: number;
  isLast: boolean;
  onPlay: (path: string) => void;
  onDelete: (recordingLocalUri: string) => void;
}

const RecordingItem: FC<Props> = ({
  recordingLocalUri,
  index,
  isLast,
  onPlay,
  onDelete,
}) => {
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <View
      style={{
        borderBottomColor: "#4e4e4e",
        paddingTop: 8,
        paddingBottom: !isLast ? 8 : undefined,
        borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0,
      }}
    >
      <TouchableOpacity
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onPress={() => {
          onPlay(recordingLocalUri);
        }}
      >
        <Text style={{ fontSize: 16 }}>{`${getOrdinal(
          index + 1
        )} Recording`}</Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            onPress={() => {
              onDelete(recordingLocalUri);
            }}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={22}
              color="black"
            />
          </TouchableOpacity>

          <View style={{ paddingLeft: 16 }} />

          <TouchableOpacity
            onPress={async () => {
              try {
                await Share.open({
                  url: recordingLocalUri,
                  type: "audio/mp4",
                });
              } catch (err) {
                if ((err as Error)?.message !== "User did not share") {
                  console.error(err);
                }
              }
            }}
          >
            <MaterialCommunityIcons name="export" size={22} color="black" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default RecordingItem;
